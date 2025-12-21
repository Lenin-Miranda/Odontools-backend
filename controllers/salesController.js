const mongoose = require("mongoose");
const Sale = require("../models/sale");
const Cart = require("../models/cart");
const Product = require("../models/products");
const User = require("../models/user");
const logger = require("../middlewares/logger.js");
const PDFDocument = require("pdfkit");
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
    const { paymentMethod, shippingAddress, shippingType } = req.body;
    const { SHIPPING_TYPES } = require("../models/sale");

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

    // Buscar el tipo de envío seleccionado
    const selectedShipping = SHIPPING_TYPES.find(
      (s) => s.type === shippingType
    );
    if (!selectedShipping) {
      return res.status(400).json({
        success: false,
        message: "Tipo de envío no válido.",
      });
    }
    const finalShippingCost = selectedShipping.cost;
    totalPrice += finalShippingCost;

    const newSale = await Sale.create({
      user: req.user.id,
      products: saleProducts,
      status: "pendiente",
      totalPrice,
      shippingType,
      shippingCost: finalShippingCost,
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

    // Enviar email de notificación al admin con detalles de envío
    try {
      const shippingTypeLabel = populatedSale.shippingType
        ? require("../models/sale").SHIPPING_TYPES.find(
            (s) => s.type === populatedSale.shippingType
          )?.label || populatedSale.shippingType
        : "";
      const adminEmailData = newOrderAdminEmail({
        ...populatedSale.toObject(),
        shippingTypeLabel,
      });
      await sendEmailToAdmin(adminEmailData.subject, adminEmailData.html);
      logger.info("Email enviado al admin exitosamente");
    } catch (emailError) {
      logger.error(`Error al enviar email al admin: ${emailError.message}`);
    }

    // Enviar email de confirmación al cliente con detalles de envío
    try {
      const shippingTypeLabel = populatedSale.shippingType
        ? require("../models/sale").SHIPPING_TYPES.find(
            (s) => s.type === populatedSale.shippingType
          )?.label || populatedSale.shippingType
        : "";
      const customerEmailData = newOrderCustomerEmail({
        ...populatedSale.toObject(),
        shippingTypeLabel,
      });
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

    // Validar que el usuario existe
    if (!sale.user) {
      logger.error(`Usuario no encontrado para la venta: ${req.params.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado en la venta" });
    }

    // Filtrar productos que existen (por si alguno fue eliminado)
    const validProducts = sale.products.filter((item) => item.product != null);

    if (validProducts.length === 0) {
      logger.warn(`No hay productos válidos en la venta: ${req.params.id}`);
      return res.status(400).json({
        success: false,
        message: "La venta no tiene productos válidos",
      });
    }

    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50, size: "A4" });

    // Configurar headers de respuesta
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=sale_${sale._id}.pdf`
    );
    res.setHeader("Content-Type", "application/pdf");

    // Pipe del PDF a la respuesta
    doc.pipe(res);

    // Manejar errores del stream
    doc.on("error", (err) => {
      logger.error(`Error en el stream del PDF: ${err.message}`);
    });

    // ========== ENCABEZADO ==========
    doc
      .fillColor("#2c3e50")
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("FACTURA DE VENTA", 50, 50, { align: "center" });

    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text(`ID: ${sale._id}`, 50, 90, { align: "center" });

    // Línea decorativa
    doc
      .moveTo(50, 110)
      .lineTo(545, 110)
      .lineWidth(2)
      .strokeColor("#3498db")
      .stroke();

    // ========== INFORMACIÓN DEL CLIENTE ==========
    doc
      .fontSize(14)
      .fillColor("#2c3e50")
      .font("Helvetica-Bold")
      .text("Información del Cliente", 50, 130);

    doc
      .fontSize(11)
      .fillColor("#34495e")
      .font("Helvetica")
      .text(`Nombre:`, 50, 155, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${sale.user.name}`, { continued: false });

    doc
      .font("Helvetica")
      .text(`Email:`, 50, 175, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${sale.user.email}`, { continued: false });

    // ========== DETALLES DE LA VENTA ==========
    doc
      .fontSize(14)
      .fillColor("#2c3e50")
      .font("Helvetica-Bold")
      .text("Detalles de la Venta", 350, 130);

    const saleDate = new Date(sale.saleDate).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc
      .fontSize(11)
      .fillColor("#34495e")
      .font("Helvetica")
      .text(`Fecha:`, 350, 155, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${saleDate}`, { continued: false });

    // Estado con color
    const statusColors = {
      pendiente: "#f39c12",
      confirmado: "#3498db",
      enviado: "#9b59b6",
      entregado: "#27ae60",
      cancelado: "#e74c3c",
    };

    doc
      .font("Helvetica")
      .fillColor("#34495e")
      .text(`Estado:`, 350, 175, { continued: true });

    doc
      .font("Helvetica-Bold")
      .fillColor(statusColors[sale.status] || "#34495e")
      .text(` ${sale.status.toUpperCase()}`, { continued: false });

    doc
      .fillColor("#34495e")
      .font("Helvetica")
      .text(`Método de Pago:`, 350, 195, { continued: true })
      .font("Helvetica-Bold")
      .text(` ${sale.paymentMethod}`, { continued: false });

    // ========== DIRECCIÓN DE ENVÍO ==========
    doc
      .fontSize(14)
      .fillColor("#2c3e50")
      .font("Helvetica-Bold")
      .text("Dirección de Envío", 50, 215);

    doc
      .fontSize(11)
      .fillColor("#34495e")
      .font("Helvetica")
      .text(sale.shippingAddress, 50, 240, {
        width: 500,
        align: "left",
      });

    // Línea separadora
    doc
      .moveTo(50, 280)
      .lineTo(545, 280)
      .lineWidth(1)
      .strokeColor("#bdc3c7")
      .stroke();

    // ========== TABLA DE PRODUCTOS ==========
    doc
      .fontSize(16)
      .fillColor("#2c3e50")
      .font("Helvetica-Bold")
      .text("Productos", 50, 300);

    let yPosition = 330;

    // Encabezados de la tabla con fondo
    doc.rect(50, yPosition, 495, 25).fillColor("#34495e").fill();

    doc
      .fontSize(11)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("Producto", 60, yPosition + 7, { width: 200, continued: false })
      .text("Cant.", 280, yPosition + 7, { width: 50, continued: false })
      .text("Precio Unit.", 340, yPosition + 7, { width: 80, continued: false })
      .text("Subtotal", 450, yPosition + 7, { width: 85, align: "right" });

    yPosition += 30;

    // Productos - usar solo productos válidos
    validProducts.forEach((item, index) => {
      // Fondo alternado
      if (index % 2 === 0) {
        doc
          .rect(50, yPosition - 5, 495, 30)
          .fillColor("#ecf0f1")
          .fill();
      }

      doc
        .fontSize(10)
        .fillColor("#2c3e50")
        .font("Helvetica")
        .text(item.product.name, 60, yPosition, {
          width: 200,
          continued: false,
        })
        .text(item.quantity.toString(), 280, yPosition, {
          width: 50,
          continued: false,
        })
        .text(`$${item.priceAtSale.toFixed(2)}`, 340, yPosition, {
          width: 80,
          continued: false,
        })
        .font("Helvetica-Bold")
        .text(`$${item.subtotal.toFixed(2)}`, 450, yPosition, {
          width: 85,
          align: "right",
        });

      yPosition += 30;

      // Agregar nueva página si es necesario
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
    });

    // Línea antes del subtotal
    doc
      .moveTo(50, yPosition + 10)
      .lineTo(545, yPosition + 10)
      .lineWidth(1)
      .strokeColor("#bdc3c7")
      .stroke();

    // ========== SUBTOTAL Y COSTOS ==========
    yPosition += 30;

    // Calcular subtotal de productos (sin envío)
    const subtotalProducts = validProducts.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    doc
      .fontSize(12)
      .fillColor("#34495e")
      .font("Helvetica")
      .text("Subtotal Productos:", 350, yPosition, { continued: true })
      .font("Helvetica-Bold")
      .text(` $${subtotalProducts.toFixed(2)}`, { align: "right" });

    yPosition += 25;

    doc
      .font("Helvetica")
      .text("Costo de Envío:", 350, yPosition, { continued: true })
      .font("Helvetica-Bold")
      .text(` $${sale.shippingCost.toFixed(2)}`, { align: "right" });

    yPosition += 35;

    // ========== TOTAL ==========
    doc
      .rect(350, yPosition - 10, 195, 40)
      .fillColor("#27ae60")
      .fill();

    doc
      .fontSize(16)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("TOTAL:", 360, yPosition, { continued: true })
      .fontSize(18)
      .text(` $${sale.totalPrice.toFixed(2)}`, { align: "right" });

    // ========== PIE DE PÁGINA ==========
    doc
      .fontSize(10)
      .fillColor("#95a5a6")
      .font("Helvetica")
      .text(
        "Gracias por su compra. Para cualquier consulta, contáctenos.",
        50,
        yPosition + 80,
        {
          align: "center",
          width: 495,
        }
      );

    doc
      .fontSize(8)
      .fillColor("#bdc3c7")
      .text(
        `Documento generado el ${new Date().toLocaleDateString("es-ES")}`,
        50,
        750,
        {
          align: "center",
        }
      );

    // Finalizar PDF
    doc.end();

    logger.info(`Venta exportada a PDF exitosamente: ${req.params.id}`);
  } catch (error) {
    logger.error(`Error al exportar la venta: ${error.message}`);

    // Solo enviar respuesta de error si no se ha enviado nada aún
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
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
