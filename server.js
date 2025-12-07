const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cartRoutes");
const salesRoutes = require("./routes/saleRoutes");
const { errorHandler } = require("./utils/errorHandler");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Reemplaza con el origen de tu frontend
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
    .connect("mongodb://localhost:27017/odontools", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Error conectando a MongoDB:", err);
      process.exit(1);
    });
}

module.exports = app;
