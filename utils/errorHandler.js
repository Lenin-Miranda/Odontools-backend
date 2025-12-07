exports.errorHandler = (err, req, res, next) => {
  console.error({
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? err.stack : undefined,
  });
  let statusCode = err.statusCode || 500;
  let message = err.message || "Error interno del servidor";

  switch (err.name) {
    case "ValidationError":
      statusCode = 400;
      message = "Datos de entrada inválidos o campos requeridos faltantes";
      break;
    case "CastError":
      statusCode = 400;
      message = `ID inválido: ${err.value}`;
      break;
    case "JsonWebTokenError":
      statusCode = 401;
      message = "Token inválido. Por favor, inicia sesión de nuevo.";
      break;
    case "TokenExpiredError":
      statusCode = 401;
      message = "Tu sesión ha expirado. Por favor, inicia sesión de nuevo.";
      break;
    case "MongoServerError":
      if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue);
        message = `El valor para el campo ${field} ya existe. Debe ser único.`;
      }
      break;
    default:
      break;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    // Solo mostramos stack si estamos en modo dev (útil para debug)
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};
