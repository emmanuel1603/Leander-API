const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Lista de formatos de video compatibles
const VIDEO_MIMETYPES = [
    'video/mp4',
    'video/quicktime',  // mov
    'video/x-msvideo',  // avi
    'video/x-matroska', // mkv
    'video/webm',
    'video/ogg'
];

// Lista de formatos de imagen compatibles
const IMAGE_MIMETYPES = [
    'image/jpeg', 
    'image/png',
    'image/gif',
    'image/webp'
];

// Documentos y otros
const DOC_MIMETYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain'
];

const allowedMimeTypes = [...VIDEO_MIMETYPES, ...IMAGE_MIMETYPES, ...DOC_MIMETYPES];

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = 'uploads/publications/';
        
        // Crear subdirectorios por tipo
        if (VIDEO_MIMETYPES.includes(file.mimetype)) {
            uploadPath += 'videos/';
        } else if (IMAGE_MIMETYPES.includes(file.mimetype)) {
            uploadPath += 'images/';
        } else {
            uploadPath += 'documents/';
        }

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no soportado: ${file.mimetype}`), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB para videos grandes
    }
});

// Configuración específica para videos
const videoUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (VIDEO_MIMETYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten formatos de video'), false);
        }
    },
    limits: {
        fileSize: 500 * 1024 * 1024 // 500MB para videos
    }
});

module.exports = {
    upload,
    videoUpload
};
