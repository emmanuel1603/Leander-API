'use strict'

var express = require('express');
var NotificationController = require('../controller/notifiaction'); // Corregir el nombre del archivo si es necesario
var api = express.Router();
var auth = require('../middleware/auth');

api.get('/notifications', auth.ensureAuth, NotificationController.getNotifications);
api.get('/unviewed-notifications', auth.ensureAuth, NotificationController.getUnviewedNotifications);
api.put('/viewed-notifications', auth.ensureAuth, NotificationController.setViewedNotifications);

module.exports = api;
