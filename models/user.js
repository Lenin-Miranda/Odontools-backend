const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 25,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator(value) {
        return validator.isEmail(value);
      },
      message: "Debe ingresar un correo valido",
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: 6,
    maxlength: 128,
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator(value) {
        // Si el valor está vacío, es válido (campo opcional)
        if (!value || value === "") return true;
        return validator.isMobilePhone(value, "any");
      },
      message: "Debe ingresar un numero de telefono valido",
    },
  },
  address: {
    type: String,
    trim: true,
    maxlength: 256,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  status: {
    type: String,
    enum: ["active", "inactive", "suspended"],
    default: "active",
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  biography: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  image: {
    type: String,
    required: false, // Cambiado a false para que sea opcional
    trim: true,
    validate: {
      validator(value) {
        // Si el valor está vacío, es válido (campo opcional)
        if (!value || value === "") return true;
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
  accountName: {
    type: String,
    trim: true,
    maxlength: 100,
  },
  accountNumber: {
    type: Number,
    trim: true,
    maxlength: 20,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
