const express = require("express");
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleByUser,
  getSalesById,
  updateSaleStatus,
  exportSale,
  exportSalesToCSV,
  exportsSalesByUserToCSV,
} = require("../controllers/salesController");
const { protect, isAdmin } = require("../middlewares/authMiddleware");

// 🧾 Crear una venta (usuario)
router.post("/", protect, createSale);

// 👤 Obtener las ventas del usuario autenticado
router.get("/user", protect, getSaleByUser);

// 📤 Exportar ventas del usuario autenticado (DEBE IR ANTES que /user/:id)
router.get("/user/csv-export", protect, exportsSalesByUserToCSV);

// 📤 Exportar todas las ventas a CSV (DEBE IR ANTES que /:id)
router.get("/csv-export", protect, isAdmin, exportSalesToCSV);

// 🧾 Obtener todas las ventas (solo admin)
router.get("/", protect, isAdmin, getSales);

// 🔍 Obtener una venta por ID (solo admin)
router.get("/:id", protect, isAdmin, getSalesById);

// 📤 Exportar una venta específica (solo admin)
router.get("/:id/export", protect, isAdmin, exportSale);

// 🔄 Actualizar el estado de una venta (solo admin)
router.put("/:id/status", protect, isAdmin, updateSaleStatus);

module.exports = router;
