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
        expiresIn: "6d",
      }
    );

    logger.info(`Usuario logueado: ${email}`);

    // ✅ Enviar token SOLO en cookie HttpOnly segura
    // Forzar secure y sameSite para máxima compatibilidad móvil en producción
    const cookieOptions = {
      httpOnly: true,
      secure: true, // 🔥 FORZADO
      sameSite: "none", // 🔥 FORZADO
      maxAge: 6 * 24 * 60 * 60 * 1000,
    };

    console.log("Set-Cookie options:", cookieOptions);
    res.cookie("token", token, cookieOptions);

    // Solo devolver información del usuario, NO el token
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
        biography: user.biography || "",
        image: user.image || "",
        phone: user.phone || "",
        address: user.address || "",
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

// ✅ Nuevo endpoint de logout
exports.logoutUser = (req, res) => {
  try {
    // Limpiar la cookie del token
    res.cookie("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      expires: new Date(0), // Expirar inmediatamente
    });

    logger.info(`Usuario cerró sesión`);

    res.status(200).json({
      success: true,
      message: "Sesión cerrada exitosamente",
    });
  } catch (error) {
    logger.error(`Error al cerrar sesión: ${error.message}`);
    res.status(500).json({
      message: "Error al cerrar sesión",
      error: error.message,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json({ users });

    if (!users.length) {
      logger.info("No hay usuarios registrados en el sistema.");
    } else {
      logger.info(`Se han obtenido ${users.length} usuarios del sistema.`);
    }
  } catch (error) {
    logger.error(`Error al obtener usuarios: ${error.message}`);
    res.status(500).json({
      message: "Error al obtener usuarios",
      error: error.message,
    });
  }
  return null;
};

exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      logger.warn(`Usuario con ID ${userId} no encontrado.`);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    res.status(200).json({ user });
    logger.info(`Usuario con ID ${userId} obtenido exitosamente.`);
  } catch (error) {
    logger.error(`Error al obtener el usuario: ${error.message}`);
    res.status(500).json({
      message: "Error al obtener el usuario",
      error: error.message,
    });
  }
};

exports.editUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, isAdmin } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      logger.warn(`El usuario con ID ${userId} no fue encontrado para editar.`);
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    user.name = name || user.name;
    user.email = email || user.email;

    if (typeof isAdmin === "boolean") {
      user.isAdmin = isAdmin;
    }

    await user.save();
    logger.info(`Usuario editado: ${user.email} (ID: ${userId})`);
    res.status(200).json({
      message: "Usuario actualizado exitosamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin || false,
      },
    });
  } catch (error) {
    logger.error(`Error al editar el usuario: ${error.message}`);
    res.status(500).json({
      message: "Error al editar el usuario",
      error: error.message,
    });
  }
  return null;
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      logger.warn(
        `El usuario con ID ${userId} no fue encontrado para eliminar.`
      );
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    logger.info(`Usuario eliminado: ${user.email} (ID: ${userId})`);
    res.status(200).json({ message: "Usuario eliminado exitosamente" });
  } catch (error) {
    logger.error(`Error al eliminar el usuario: ${error.message}`);
    res.status(500).json({
      message: "Error al eliminar el usuario",
      error: error.message,
    });
  }
  return null;
};

exports.editUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, image, phone, address, biography } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      logger.warn(
        `El usuario con ID ${userId} no fue encontrado para editar el perfil.`
      );
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Actualizar solo los campos proporcionados
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (image !== undefined) user.image = image;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (biography !== undefined) user.biography = biography;

    await user.save();

    logger.info(`Perfil de usuario editado: ${user.email} (ID: ${userId})`);

    res.status(200).json({
      message: "Perfil de usuario actualizado exitosamente",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
        phone: user.phone,
        address: user.address,
        biography: user.biography,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    logger.error(`Error al editar el perfil del usuario: ${error.message}`);
    res.status(500).json({
      message: "Error al editar el perfil del usuario",
      error: error.message,
    });
  }
};
