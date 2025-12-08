const mongoose = require("mongoose");
const validator = require("validator");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "El nombre del producto es obligatorio"],
      minlength: [3, "El nombre del producto debe tener al menos 3 caracteres"],
      maxLength: [
        100,
        "El nombre del producto no puede exceder 100 caracteres",
      ],
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: [true, "La descripcion del producto es obligatoria"],
      minlength: [
        10,
        "La descripcion del producto debe tener al menos 10 caracteres",
      ],
      maxLength: [
        1000,
        "La descripcion del producto no puede exceder 1000 caracteres",
      ],
      trim: true,
      default: "",
    },
    // 🖼️ Sistema de múltiples imágenes
    images: [
      {
        type: String,
        trim: true,
        validate: {
          validator(value) {
            return (
              validator.isURL(value, {
                protocols: ["http", "https"],
                require_protocol: false,
              }) ||
              value.startsWith("/uploads/") ||
              /^https?:\/\/.+/.test(value)
            );
          },
          message: "Cada imagen debe ser una URL válida o ruta válida",
        },
      },
    ],
    // Imagen principal - primera del array o única
    image: {
      type: String,
      required: [true, "La imagen del producto es obligatoria"],
      trim: true,
      validate: {
        validator(value) {
          // Permitir URLs válidas o rutas que empiecen con http/https o rutas locales
          return (
            validator.isURL(value, {
              protocols: ["http", "https"],
              require_protocol: false,
            }) ||
            value.startsWith("/uploads/") ||
            /^https?:\/\/.+/.test(value)
          );
        },
        message: "Debe ingresar una URL válida o ruta de imagen válida",
      },
      default: "",
    },
    price: {
      type: Number,
      required: [true, "El precio del producto es obligatorio"],
      min: [0, "El precio del producto no debe de ser negativo"],
    },
    reviews: {
      type: Number,
      min: [0, "El número de reseñas no debe de ser negativo"],
      default: 0,
    },
    stock: {
      type: Number,
      required: [true, "El stock del producto es obligatorio"],
      min: [0, "El stock del producto no debe de ser negativo"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "El descuento no debe ser negativo"],
      max: [100, "El descuento no debe exceder 100"],
      validate: {
        validator: Number.isInteger,
        message: "El descuento debe ser un número entero",
      },
    },
    category: {
      type: String,
      required: [true, "La categoría del producto es obligatoria"],
      trim: true,
      default: "",
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
