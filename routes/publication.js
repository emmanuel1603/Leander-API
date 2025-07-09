'use strict';

const express = require('express');
const router = express.Router();
const PublicationController = require('../controller/publication');
const { upload } = require('../middleware/upload');
const auth = require('../middleware/auth');
var api = express.Router();

// Definición de rutas
api.post('/publication', [auth.ensureAuth, upload.array('files', 10)], PublicationController.savePublication);
api.get('/publications', auth.ensureAuth, PublicationController.getPublications);
api.get('/publications/:page', auth.ensureAuth, PublicationController.getPublications);
api.get('/publication/:id', auth.ensureAuth, PublicationController.getPublication);
api.get('/my-publications', auth.ensureAuth, PublicationController.getMyPublications);
api.delete('/publication/:id', auth.ensureAuth, PublicationController.deletePublication);
api.put('/publication/like/:id', auth.ensureAuth, PublicationController.likePublication);
api.put('/publication/unlike/:id', auth.ensureAuth, PublicationController.unlikePublication);
api.post('/publication/comment/:id', auth.ensureAuth, PublicationController.addComment);
api.delete('/publication/comment/:id/:commentId', auth.ensureAuth, PublicationController.deleteComment);
api.put('/publication/:id', auth.ensureAuth, PublicationController.updatePublication);
api.put('/publication/:id/comment/:commentId', auth.ensureAuth, PublicationController.updateComment);
module.exports = api;
