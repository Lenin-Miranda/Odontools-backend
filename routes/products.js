const express = require("express");

const {
  getProducts,
  getProductsById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productControllers");

const { protect, isAdmin } = require("../middlewares/authMiddleware.js");
const router = express.Router();

//public routes
router.get("/", getProducts);
router.get("/:id", getProductsById);

//protected routes - admin only
router.post("/", protect, isAdmin, createProduct);
router.put("/:id", protect, isAdmin, updateProduct);
router.delete("/:id", protect, isAdmin, deleteProduct);

module.exports = router;
