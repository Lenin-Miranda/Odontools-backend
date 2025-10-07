const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const logger = require("../middlewares/logger.js");

//Registro de usuario

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin } = req.body;

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      logger.warn(`Registro fallido: El usuario con email ${email} ya existe.`);
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      isAdmin,
    });

    logger.info(`Usuario registrado: ${email}`);

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    logger.error(`Error en el registro de usuario: ${error.message}`);
    res.status(500).json({
      message: "Erro al crear el usaurio",
      error: error.message,
    });
  }
  return null;
};

exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      logger.warn(
        `Inicio de sesion fallido: Usuario con email ${email} no encontrado.`
      );
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(
        `Inicio de sesion fallido: Contraseña incorrecta para el usuario ${email}.`
      );
      return res.status(400).json({
        error: "Contraseña incorrecta",
      });
    }
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    logger.info(`Usuario logueado: ${email}`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    logger.error(`Error en el inicio de sesion: ${error.message}`);
    res.status(500).json({
      message: "Error al iniciar sesion",
      error: error.message,
    });
  }
  return null;
};
