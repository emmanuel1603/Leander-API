'use strict'

var express = require('express');
var EventController = require('../controller/event');
var api = express.Router();
var auth = require('../middleware/auth');

api.post('/event', auth.ensureAuth, EventController.saveEvent);
api.get('/events', auth.ensureAuth, EventController.getEvents);
api.get('/event/:id', auth.ensureAuth, EventController.getEvent);
api.delete('/event/:id', auth.ensureAuth, EventController.deleteEvent);
api.put('/event/attend/:id', auth.ensureAuth, EventController.attendEvent);
api.put('/event/unattend/:id', auth.ensureAuth, EventController.unattendEvent);

module.exports = api;
