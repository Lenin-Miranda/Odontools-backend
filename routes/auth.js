const express = require("express");
const {
  registerUser,
  loginUser,
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

router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

router.use(errors());

module.exports = router;
