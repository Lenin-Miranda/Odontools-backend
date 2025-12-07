const express = require("express");

const {
  getProducts,
  getProductsById,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
} = require("../controllers/productControllers");

const { protect, isAdmin } = require("../middlewares/authMiddleware.js");
const upload = require("../middlewares/uploadMiddleware");
const router = express.Router();

//public routes
router.get("/", getProducts);
router.get("/:id", getProductsById);

//protected routes - admin only
// 🖼️ Permite imagen principal + imágenes adicionales
router.post(
  "/",
  protect,
  isAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  createProduct
);

router.put(
  "/:id",
  protect,
  isAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 4 },
  ]),
  updateProduct
);

router.delete("/:id", protect, isAdmin, deleteProduct);

// 🗑️ Eliminar una imagen específica de un producto
router.delete("/:id/images", protect, isAdmin, deleteProductImage);

// Ruta específica para subir imágenes (legacy - mantener por compatibilidad)
router.post("/upload", protect, isAdmin, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ninguna imagen",
      });
    }

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
      req.file.filename
    }`;

    res.status(200).json({
      success: true,
      message: "Imagen subida exitosamente",
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al subir la imagen",
      error: error.message,
    });
  }
});

module.exports = router;
