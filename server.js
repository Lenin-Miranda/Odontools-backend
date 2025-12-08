const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const logger = require("./middlewares/logger");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cartRoutes");
const salesRoutes = require("./routes/saleRoutes");
const { errorHandler } = require("./utils/errorHandler");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://tu-frontend.vercel.app", // 🔹 Agrega tu dominio de producción
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error("CORS policy: Origin not allowed"), false);
      }
      return callback(null, true);
    },
    optionsSuccessStatus: 200,
    credentials: true, // ✅ Permite enviar cookies
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(cookieParser()); // ✅ Parser de cookies

// Servir archivos estáticos desde la carpeta uploads
app.use("/uploads", express.static("uploads"));

// Rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/sales", salesRoutes);
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/odontools")
    .then(() => {
      app.listen(PORT);
    })
    .catch((err) => {
      logger.error(`Error conectando a MongoDB: ${err.message}`);
      process.exit(1);
    });
}

module.exports = app;
