const express = require("express");
const {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  increaseItemQuantity,
  decreaseItemQuantity,
} = require("../controllers/cartController");
const { protect } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/", protect, getCart);
router.post("/add", protect, addToCart);
router.delete("/clear", protect, clearCart);
router.delete("/:productId", protect, removeFromCart);
router.post("/increase/:productId", protect, increaseItemQuantity);
router.post("/decrease/:productId", protect, decreaseItemQuantity);

module.exports = router;
