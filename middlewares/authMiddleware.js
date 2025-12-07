const jwt = require("jsonwebtoken");

exports.protect = (req, res, next) => {
  let token;

  // ✅ Leer token SOLO desde cookie (método seguro)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      message: "No autenticado. Por favor inicia sesión.",
      requiresLogin: true,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 🔹 Aquí aseguramos que req.user tenga exactamente lo que los controladores esperan
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
      isAdmin: decoded.isAdmin,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: "Token inválido" });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: "Acceso denegado, no es administrador" });
  }
};
