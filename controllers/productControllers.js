const Product = require("../models/products");
const logger = require("../middlewares/logger.js");

//obtener todos los productos

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      products,
      message: products.length
        ? "No hay productos disponibles"
        : "Productos obtenidos exitosamente",
    });
  } catch (error) {
    logger.error(`Error al obtener productos: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
  return null;
};

exports.getProductsById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      logger.warn(`Producto no encontrado: ${req.params.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    logger.error(`Error al obtener producto por ID: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }

  return null;
};

exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      image,
      category,
      discount,
      isFavorite,
      reviews,
    } = req.body;

    const requiredFields = { name, description, price, stock, image, category };
    const missing = Object.entries(requiredFields)
      .filter(
        ([_, value]) => value === undefined || value === null || value === ""
      )
      .map(([key]) => key);

    if (missing.length > 0) {
      logger.warn("Faltan campos obligatorios para crear el producto");
      return res.status(400).json({
        success: false,
        message: `Faltan los siguientes campos: ${missing.join(", ")}`,
      });
    }

    if (price < 0 || stock < 0) {
      logger.warn("El precio y el stock no deben de ser negativos");
      return res.status(400).json({
        success: false,
        message: "El precio y el stock no deben de ser negativos",
      });
    }
    const newProduct = await Product.create(req.body);

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    console.error(`Error al crear producto: ${error}`);
    logger.error(`Error al crear producto: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
  return null;
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      logger.warn(`Producto no encontrado para actualizar: ${req.params.id}`);
      return res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    logger.error(`Error al actualizar producto: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
  return null;
};

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      logger.warn(`Producto no encontrado para eliminar: ${req.params.id}`);
      res
        .status(404)
        .json({ success: false, message: "Producto no encontrado" });
    }

    res
      .status(200)
      .json({ success: true, message: "Producto eliminado exitosamente" });
  } catch (error) {
    logger.error(`Error al eliminar producto: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
  return null;
};
