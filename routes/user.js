'use strict';

var express = require('express');
var UserController = require('../controller/user');
var md_auth = require('../middleware/auth'); // Middleware para autenticar
const upload = require('../config/multer'); // Ruta al archivo de configuración


var api = express.Router();

// Rutas de usuario
api.post('/register', UserController.saveUser );
api.post('/login', UserController.login);
api.post('/upload-image-user/:id', md_auth.ensureAuth, upload.single('image'), UserController.uploadImage);
api.post('/follow/:id', md_auth.ensureAuth, UserController.followUser );
api.post('/unfollow/:id', md_auth.ensureAuth, UserController.unfollowUser );

module.exports = api;
