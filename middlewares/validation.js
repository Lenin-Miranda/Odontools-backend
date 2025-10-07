const { celebrate, Joi } = require("celebrate");

const validator = require("validator");

const validateUrl = (value, helpers) => {
  if (!validator.isURL(value)) {
    return helpers.message("string.uri");
  }

  return value;
};

exports.registerValidation = celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(3).max(25).required().messages({
      "string.min": "El nombre debe tener al menos {#limit} caracteres",
      "string.max": "El nombre no debe exceder {#limit} caracteres",
      "string.empty": "El nombre es obligatorio",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Debe ingresar un correro valido",
      "string.empty": "El correo es obligatorio",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "La contraseña debe tener al menos {#limit} caracteres",
      "string.max": "La contraseña no debe exceder {#limit} caracteres",
      "string.empty": "La contraseña es obligatoria",
    }),
    isAdmin: Joi.boolean().required().messages({
      "boolean.base": "isAdmin debe ser un valor booleano",
    }),
  }),
});

exports.loginValidation = celebrate({
  body: Joi.object().keys({
    email: Joi.string().email().required().messages({
      "string.email": "Debe ingresar un correro valido",
      "string.empty": "El correo es obligatorio",
    }),
    password: Joi.string().min(6).max(128).required().messages({
      "string.min": "La contraseña debe tener al menos {#limit} caracteres",
      "string.max": "La contraseña no debe exceder {#limit} caracteres",
      "string.empty": "La contraseña es obligatoria",
    }),
  }),
});
