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
    let {
      name,
      description,
      price,
      stock,
      category,
      discount,
      isFavorite,
      reviews,
    } = req.body;

    let mainImage = null;
    let additionalImages = [];

    // 🖼️ Procesar imagen principal (Cloudinary)
    if (req.files && req.files.image && req.files.image[0]) {
      mainImage = req.files.image[0].path; // Cloudinary URL
    }

    // 🖼️ Procesar imágenes adicionales (Cloudinary)
    if (req.files && req.files.images) {
      additionalImages = req.files.images.map((file) => file.path); // Cloudinary URLs
    }

    const requiredFields = { name, description, price, stock, category };
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

    if (!mainImage) {
      return res.status(400).json({
        success: false,
        message: "Debes proporcionar al menos una imagen principal",
      });
    }

    if (price < 0 || stock < 0) {
      logger.warn("El precio y el stock no deben de ser negativos");
      return res.status(400).json({
        success: false,
        message: "El precio y el stock no deben de ser negativos",
      });
    }

    // Crear el producto con imagen principal + galería
    const productData = {
      ...req.body,
      image: mainImage,
      images: additionalImages,
    };

    const newProduct = await Product.create(productData);

    res.status(201).json({ success: true, product: newProduct });
  } catch (error) {
    logger.error(`Error al crear producto: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
  return null;
};

exports.updateProduct = async (req, res) => {
  try {
    let updateData = { ...req.body };

    // 🖼️ Actualizar imagen principal si se subió (Cloudinary)
    if (req.files && req.files.image && req.files.image[0]) {
      updateData.image = req.files.image[0].path; // Cloudinary URL
    }

    // 🖼️ Actualizar/agregar imágenes adicionales (Cloudinary)
    if (req.files && req.files.images && req.files.images.length > 0) {
      const newImages = req.files.images.map((file) => file.path); // Cloudinary URLs

      // Si ya tiene imágenes, agregar las nuevas; si no, crear array nuevo
      const existingProduct = await Product.findById(req.params.id);
      if (existingProduct && existingProduct.images) {
        updateData.images = [...existingProduct.images, ...newImages];
      } else {
        updateData.images = newImages;
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
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

// 🗑️ Eliminar una imagen específica de la galería
exports.deleteProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Debes proporcionar la URL de la imagen a eliminar",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      logger.warn(`Producto no encontrado: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado",
      });
    }

    // No permitir eliminar la imagen principal si hay imágenes en la galería
    if (imageUrl === product.image && product.images.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No puedes eliminar la imagen principal. Primero establece otra como principal.",
      });
    }

    // Eliminar de la galería
    product.images = product.images.filter((img) => img !== imageUrl);
    await product.save();

    logger.info(`Imagen eliminada del producto ${id}`);

    res.status(200).json({
      success: true,
      message: "Imagen eliminada exitosamente",
      product,
    });
  } catch (error) {
    logger.error(`Error al eliminar imagen: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};
