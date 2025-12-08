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

// Cargar variables de entorno solo si existe el archivo
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "https://odontools-frontend.vercel.app",
  "https://odontools-28dbh88q1-lenin9073-9038s-projects.vercel.app",
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
  // Verificar variables críticas
  if (!process.env.MONGODB_URI) {
    logger.error("⚠️ MONGODB_URI no está configurada!");
  }
  if (!process.env.JWT_SECRET) {
    logger.error("⚠️ JWT_SECRET no está configurada!");
  }

  // Iniciar servidor primero
  app.listen(PORT, () => {
    logger.info(`Servidor corriendo en puerto ${PORT}`);
    logger.info(`NODE_ENV: ${process.env.NODE_ENV || 'no configurado'}`);
  });

  // Conectar a MongoDB
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/odontools";
  logger.info(`Intentando conectar a MongoDB...`);
  
  mongoose
    .connect(mongoUri)
    .then(() => {
      logger.info("✅ Conectado a MongoDB exitosamente");
    })
    .catch((err) => {
      logger.error(`❌ Error conectando a MongoDB: ${err.message}`);
      logger.error(`Stack: ${err.stack}`);
    });
}

module.exports = app;
