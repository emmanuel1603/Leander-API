'use strict'

var express = require('express');
var MessageController = require('../controller/message');
var api = express.Router();
var auth = require('../middleware/auth');

api.post('/message', auth.ensureAuth, MessageController.saveMessage);
api.get('/received-messages', auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/emitted-messages', auth.ensureAuth, MessageController.getEmittedMessages);
api.get('/unviewed-messages', auth.ensureAuth, MessageController.getUnviewedMessages);
api.put('/viewed-messages', auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;
