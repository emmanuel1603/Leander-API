'use strict';

var cors = require('cors');
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
const path = require('path');

// Configuración de middlewares
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración de CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

// Importar rutas
var forumRoutes = require('./routes/Forum');
var user_routes = require('./routes/user');
var publication_routes = require('./routes/publication');
var message_routes = require('./routes/message');
var event_routes = require('./routes/event');
var notification_routes = require('./routes/notification');
var announcement_routes = require('./routes/announcement');

// Usar rutas
app.use('/api', forumRoutes);
app.use('/api', user_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', event_routes);
app.use('/api', notification_routes);
app.use('/api', announcement_routes);

module.exports = app;
