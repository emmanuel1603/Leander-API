const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/users'); // Carpeta donde se guardan
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, 'user-' + Date.now() + ext); // Ej: user-1625372938123.jpg
    }
});

// Filtro para validar extensiones
const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes'));
    }
};

module.exports = multer({ storage, fileFilter });