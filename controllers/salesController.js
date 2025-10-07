const mongoose = require("mongoose");
const Sale = require("../models/sale");
const Cart = require("../models/cart");
const Product = require("../models/products");
const logger = require("../middlewares/logger.js");

exports.createSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentMethod, shippingAddress } = req.body;

    if (!paymentMethod || !shippingAddress) {
      logger.warn("Método de pago y dirección de envío son requeridos");
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Método de pago y dirección de envío son requeridos",
      });
    }

    const cart = await Cart.findOne({ user: req.user.id })
      .populate("items.product")
      .session(session);

    if (!cart || cart.items.length === 0) {
      logger.warn(`Carrito vacío para el usuario: ${req.user.id}`);
      await session.abortTransaction();
      session.endSession();
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

      if (product.stock < quantity) {
        logger.warn(`Stock insuficiente para el producto: ${product._id}`);
        await session.abortTransaction();
        session.endSession();
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
        stockAtSale: product.stock,
      });

      // Reducir el stock (dentro de la transacción)
      product.stock -= quantity;
      await product.save({ session });
    }

    const newSale = await Sale.create(
      [
        {
          user: req.user.id,
          products: saleProducts,
          status: "pending",
          totalPrice,
          paymentMethod,
          shippingAddress,
        },
      ],
      { session }
    );

    // Vaciar el carrito
    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedSale = await Sale.findById(newSale[0]._id)
      .populate("user")
      .populate("products.product");

    logger.info(`Venta creada exitosamente: ${newSale[0]._id}`);

    res.status(201).json({
      success: true,
      sale: populatedSale,
      message: "Venta creada exitosamente",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error(`Error al crear la venta: ${error.message}`);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
