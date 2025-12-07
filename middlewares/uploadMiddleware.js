const multer = require("multer");
const path = require("path");

// Configuración de almacenamiento de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// Filtro de archivos para aceptar solo imágenes
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Solo se permiten imágenes (jpeg, jpg, png, gif)"));
  }
};

// Configuración de Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño de archivo: 5MB
  fileFilter: fileFilter,
});

// Exportar directamente el objeto upload
module.exports = upload;
