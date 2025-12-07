const mongoose = require("mongoose");
const Sale = require("../models/sale");
const Cart = require("../models/cart");
const Product = require("../models/products");
const User = require("../models/user");
const logger = require("../middlewares/logger.js");
const { sendEmailToAdmin } = require("../services/sendEmailToAdmin.js");
const { sendEmailToCustomer } = require("../services/sendEmailToCostumer.js");
const {
  newOrderAdminEmail,
  newOrderCustomerEmail,
  orderConfirmedCustomerEmail,
  orderCancelledCustomerEmail,
  orderShippedCustomerEmail,
  orderDeliveredCustomerEmail,
} = require("../utils/emailTemplates.js");

exports.createSale = async (req, res) => {
  try {
    const { paymentMethod, shippingAddress } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      logger.warn(`Carrito vacío para el usuario: ${req.user.id}`);
      return res.status(400).json({
        success: false,
        message: "El carrito está vacío",
      });
    }

    let totalPrice = 0;
    const saleProducts = [];

    for (const item of cart.items) {
      const product = item.product;
      const quantity = item.quantity;

      // Verificar stock disponible pero NO descontar aún (se descontará al confirmar pago)
      if (product.stock < quantity) {
        logger.warn(`Stock insuficiente para el producto: ${product._id}`);
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para el producto: ${product.name}`,
        });
      }

      const priceAtSale = product.price;
      const subtotal = priceAtSale * quantity;
      totalPrice += subtotal;

      saleProducts.push({
        product: product._id,
        quantity,
        priceAtSale,
        subtotal,
        stockAtSale: product.stock, // Guardar stock actual para referencia
      });
    }

    const newSale = await Sale.create({
      user: req.user.id,
      products: saleProducts,
      status: "pendiente",
      totalPrice,
      paymentMethod,
      shippingAddress,
    });

    // Vaciar el carrito
    cart.items = [];
    await cart.save();

    const populatedSale = await Sale.findById(newSale._id)
      .populate("user")
      .populate("products.product");

    logger.info(`Venta creada exitosamente: ${newSale._id}`);

    // Enviar email de notificación al admin con template HTML
    try {
      const adminEmailData = newOrderAdminEmail(populatedSale);
      await sendEmailToAdmin(adminEmailData.subject, adminEmailData.html);
      logger.info("Email enviado al admin exitosamente");
    } catch (emailError) {
      logger.error(`Error al enviar email al admin: ${emailError.message}`);
    }

    // Enviar email de confirmación al cliente con template HTML
    try {
      const customerEmailData = newOrderCustomerEmail(populatedSale);
      await sendEmailToCustomer(
        populatedSale.user.email,
        customerEmailData.subject,
        customerEmailData.html
      );
      logger.info("Email enviado al cliente exitosamente");
    } catch (emailError) {
      logger.error(`Error al enviar email al cliente: ${emailError.message}`);
    }

    res.status(201).json({
      success: true,
      sale: populatedSale,
      message: "Orden creada exitosamente.",
    });
  } catch (error) {
    logger.error(`Error al crear la venta: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user")
      .populate("products.product");
    logger.info(`Ventas obtenidas exitosamente`);

    res
      .status(200)
      .json({ success: true, sales, message: "Ventas obtenidas exitosamente" });
  } catch (error) {
    logger.error(`Error al obtener las ventas: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSaleByUser = async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user.id })
      .populate("user")
      .populate("products.product");
    logger.info(`Ventas del usuario ${req.user.id} obtenidas exitosamente`);

    res
      .status(200)
      .json({ success: true, sales, message: "Ventas obtenidas exitosamente" });
  } catch (error) {
    logger.error(
      `Error al obtener las ventas del usuario ${req.user.id}: ${error.message}`
    );
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("user")
      .populate("products.product");
    if (!sale) {
      logger.warn(`Venta no encontrada: ${req.params.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Venta no encontrada" });
    }
    res.status(200).json({ success: true, sale });
  } catch (error) {
    logger.error(`Error al obtener la venta por ID: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateSaleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pendiente",
      "confirmado",
      "enviado",
      "entregado",
      "cancelado",
    ];

    if (!validStatuses.includes(status)) {
      logger.warn(`Estado de venta invalido: ${status}`);
      return res
        .status(400)
        .json({ success: false, message: "Estado de venta invalido" });
    }

    const sale = await Sale.findById(req.params.id)
      .populate("user")
      .populate("products.product");

    if (!sale) {
      logger.warn(`Venta no encontrada: ${req.params.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Venta no encontrada" });
    }

    const previousStatus = sale.status;

    // ✅ Si cambia a "confirmado" → DESCONTAR STOCK
    if (status === "confirmado" && previousStatus === "pendiente") {
      logger.info(`Confirmando venta y descontando stock: ${sale._id}`);

      for (const item of sale.products) {
        const product = await Product.findById(item.product._id);
        if (product) {
          // Verificar stock disponible
          if (product.stock < item.quantity) {
            return res.status(400).json({
              success: false,
              message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
            });
          }
          product.stock -= item.quantity;
          await product.save();
          logger.info(
            `Stock descontado para ${product.name}: -${item.quantity}, nuevo stock: ${product.stock}`
          );
        }
      }

      // Enviar email de confirmación al cliente
      try {
        const emailData = orderConfirmedCustomerEmail(sale);
        await sendEmailToCustomer(
          sale.user.email,
          emailData.subject,
          emailData.html
        );
        logger.info("Email de confirmación enviado al cliente");
      } catch (emailError) {
        logger.error(
          `Error al enviar email de confirmación: ${emailError.message}`
        );
      }
    }

    // ❌ Si cambia a "cancelado" → RESTAURAR STOCK (solo si estaba confirmado)
    if (status === "cancelado" && previousStatus === "confirmado") {
      logger.info(`Cancelando venta y restaurando stock: ${sale._id}`);

      for (const item of sale.products) {
        const product = await Product.findById(item.product._id);
        if (product) {
          product.stock += item.quantity;
          await product.save();
          logger.info(
            `Stock restaurado para ${product.name}: +${item.quantity}, nuevo stock: ${product.stock}`
          );
        }
      }

      // Enviar email de cancelación al cliente
      try {
        const emailData = orderCancelledCustomerEmail(sale);
        await sendEmailToCustomer(
          sale.user.email,
          emailData.subject,
          emailData.html
        );
        logger.info("Email de cancelación enviado al cliente");
      } catch (emailError) {
        logger.error(
          `Error al enviar email de cancelación: ${emailError.message}`
        );
      }
    }

    // 🚚 Si cambia a "enviado" → ENVIAR EMAIL
    if (status === "enviado") {
      logger.info(`Notificando envío de venta: ${sale._id}`);

      try {
        const emailData = orderShippedCustomerEmail(sale);
        await sendEmailToCustomer(
          sale.user.email,
          emailData.subject,
          emailData.html
        );
        logger.info("Email de envío enviado al cliente");
      } catch (emailError) {
        logger.error(`Error al enviar email de envío: ${emailError.message}`);
      }
    }

    // ✅ Si cambia a "entregado" → ENVIAR EMAIL DE CONFIRMACIÓN
    if (status === "entregado") {
      logger.info(`Notificando entrega de venta: ${sale._id}`);

      try {
        const emailData = orderDeliveredCustomerEmail(sale);
        await sendEmailToCustomer(
          sale.user.email,
          emailData.subject,
          emailData.html
        );
        logger.info("Email de entrega enviado al cliente");
      } catch (emailError) {
        logger.error(`Error al enviar email de entrega: ${emailError.message}`);
      }
    }

    sale.status = status;
    await sale.save();

    logger.info(
      `Estado de venta actualizado exitosamente: ${req.params.id} de ${previousStatus} a ${status}`
    );

    res.status(200).json({
      success: true,
      sale,
      message: `Estado actualizado a ${status} exitosamente`,
    });
  } catch (error) {
    logger.error(`Error al actualizar el estado de la venta: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("user")
      .populate("products.product");
    if (!sale) {
      logger.warn(`Venta no encontrada: ${req.params.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Venta no encontrada" });
    }

    // Generar el contenido del archivo de texto
    let content = `Venta ID: ${sale._id}\n`;
    content += `Usuario: ${sale.user.name} (${sale.user.email})\n`;
    content += `Fecha de Venta: ${sale.saleDate.toISOString()}\n`;
    content += `Estado: ${sale.status}\n`;
    content += `Método de Pago: ${sale.paymentMethod}\n`;
    content += `Dirección de Envío: ${sale.shippingAddress}\n`;
    content += `\nProductos:\n`;

    sale.products.forEach((item, index) => {
      content += `${index + 1}. ${item.product.name} - Cantidad: ${
        item.quantity
      }, Precio Unitario: $${item.priceAtSale.toFixed(
        2
      )}, Subtotal: $${item.subtotal.toFixed(2)}\n`;
    });

    // Devolver el archivo de texto como descarga
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sale_${sale._id}.txt`
    );
    res.setHeader("Content-Type", "text/plain");
    res.status(200).send(content);
    logger.info(`Venta exportada exitosamente: ${req.params.id}`);
  } catch (error) {
    logger.error(`Error al exportar la venta: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Controlado para exportar todas las ventas a CSV

exports.exportSalesToCSV = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("user")
      .populate("products.product");
    if (!sales || sales.length === 0) {
      logger.warn("No hay ventas para exportat");
      return res
        .status(404)
        .json({ success: false, message: "No hay ventas para exportar" });
    }
    let csvContent =
      "Sale ID,User,Sale Date,Status,Payment Method,Shipping Address,Total Price,Products\n";
    sales.forEach((sale) => {
      const productsStr = sale.products
        .map((item) => {
          return `${item.product.name} (Qty: ${
            item.quantity
          }, Price: $${item.priceAtSale.toFixed(2)})`;
        })
        .join(" | ");
      csvContent += `${sale._id},${sale.user.name} (${
        sale.user.email
      }),${sale.saleDate.toISOString()},${sale.status},${sale.paymentMethod},"${
        sale.shippingAddress
      }",$${sale.totalPrice.toFixed(2)},"${productsStr}"\n`;
    });
    res.setHeader("Content-Disposition", "attachment; filename=sales.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvContent);
    logger.info("Ventas exportadas a CSV exitosamente");
  } catch (error) {
    logger.error(`Error al exportar las ventas a CSV: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportsSalesByUserToCSV = async (req, res) => {
  try {
    const sales = await Sale.find({ user: req.user.id })
      .populate("user")
      .populate("products.product");
    if (!sales || sales.length === 0) {
      logger.warn(`No hay ventas para exportar del usuario: ${req.user.id}`);
      return res
        .status(404)
        .json({ success: false, message: "No hay ventas para exportar" });
    }
    let csvContent =
      "Sale ID,User,Sale Date,Status,Payment Method,Shipping Address,Total Price,Products\n";
    sales.forEach((sale) => {
      const productsStr = sale.products
        .map((item) => {
          return `${item.product.name} (Qty: ${
            item.quantity
          }, Price: $${item.priceAtSale.toFixed(2)})`;
        })
        .join(" | ");
      csvContent += `${sale._id},${sale.user.name} (${
        sale.user.email
      }),${sale.saleDate.toISOString()},${sale.status},${sale.paymentMethod},"${
        sale.shippingAddress
      }",$${sale.totalPrice.toFixed(2)},"${productsStr}"\n`;
    });
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales_user_${req.user.id}.csv"
    );
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvContent);
    logger.info(
      `Ventas del usuario ${req.user.id} exportadas a CSV exitosamente`
    );
  } catch (error) {
    logger.error(
      `Error al exportar las ventas del usuario ${req.user.id} a CSV: ${error.message}`
    );
    res.status(500).json({ success: false, message: error.message });
  }
};
