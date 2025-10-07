const Cart = require("../models/cart");
const Product = require("../models/products"); // <-- importante
const logger = require("../middlewares/logger.js");

// Obtener el carrito del usuario
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );
    if (!cart) {
      logger.warn(`Carrito no encontrado para el usuario: ${req.user.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado" });
    }
    res.status(200).json({ success: true, cart });
  } catch (error) {
    logger.error(`Error al obtener el carrito: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Agregar un producto al carrito
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // Verificar si el producto existe
    const productExists = await Product.findById(productId);
    if (!productExists) {
      logger.warn(`Producto no encontrado: ${productId}`);
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      logger.info(`Creando carrito nuevo para el usuario: ${req.user.id}`);
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }

      await cart.save();
    }

    // Hacer populate del producto antes de devolver la respuesta
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );
    res.status(200).json({ success: true, cart: populatedCart });
  } catch (error) {
    logger.error(`Error al agregar al carrito: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Eliminar un producto del carrito
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      logger.warn(`Carrito no encontrado para el usuario: ${req.user.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );
    await cart.save();

    // Hacer populate del producto antes de devolver la respuesta
    await cart.populate("items.product");

    res.status(200).json({ success: true, cart });
  } catch (error) {
    logger.error(`Error al eliminar del carrito: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.increaseItemQuantity = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el carrito",
      });
    }

    cart.items[itemIndex].quantity += 1;
    logger.info(
      `Aumentando cantidad del producto ${productId} en el carrito de ${req.user.id}`
    );

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({ success: true, cart });
  } catch (error) {
    logger.error(`Error al aumentar cantidad: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.decreaseItemQuantity = async (req, res) => {
  try {
    const productId = req.params.productId || req.body.productId;
    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product._id.toString() === productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado en el carrito",
      });
    }

    cart.items[itemIndex].quantity -= 1;
    if (cart.items[itemIndex].quantity <= 0) {
      logger.info(
        `Eliminando producto ${productId} del carrito de ${req.user.id}`
      );
      cart.items.splice(itemIndex, 1);
    } else {
      logger.info(
        `Disminuyendo cantidad del producto ${productId} en el carrito de ${req.user.id}`
      );
    }

    await cart.save();
    await cart.populate("items.product");

    console.log("🛒 Carrito actualizado:", cart.items); // <-- línea añadida para depuración

    res.status(200).json({ success: true, cart });
  } catch (error) {
    logger.error(`Error al disminuir cantidad: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      logger.warn(`Carrito no encontrado para el usuario: ${req.user.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Carrito no encontrado" });
    }
    cart.items = [];
    cart.markModified("items");
    await cart.save();

    // Hacer populate del producto antes de devolver la respuesta
    const populatedCart = await Cart.findById(cart._id).populate(
      "items.product"
    );

    res.status(200).json({
      success: true,
      message: "Carrito limpiado",
      cart: populatedCart,
    });
  } catch (error) {
    logger.error(`Error al limpiar el carrito: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
