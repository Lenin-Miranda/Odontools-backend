const express = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUserById,
  editUser,
  deleteUser,
  editUserProfile,
} = require("../controllers/authControllers.js");
const { protect } = require("../middlewares/authMiddleware.js");
const {
  registerValidation,
  loginValidation,
} = require("../middlewares/validation.js");
const { celebrate } = require("celebrate");
const { errors } = require("celebrate");

const router = express.Router();

// Register route
router.post("/register", registerValidation, registerUser);

// Login router
router.post("/login", loginValidation, loginUser);

// ✅ Logout route
router.post("/logout", logoutUser);

// Get all users (protected route)
router.get("/", protect, getUsers);

// Get user by ID (protected route)
router.get("/:id", protect, getUserById);

// Edit user profile (protected route) - DEBE estar antes de /:id
router.put("/profile", protect, editUserProfile);

// Edit user (protected route)
router.put("/:id", protect, editUser);

// Delete user (protected route)
router.delete("/:id", protect, deleteUser);

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

router.use(errors());

module.exports = router;
