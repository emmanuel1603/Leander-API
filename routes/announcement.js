'use strict'

var express = require('express');
var AnnouncementController = require('../controller/announcement');
var api = express.Router();
var auth = require('../middleware/auth');

api.post('/announcement', auth.ensureAuth, AnnouncementController.saveAnnouncement);
api.get('/announcements', auth.ensureAuth, AnnouncementController.getAnnouncements);
api.get('/announcement/:id', auth.ensureAuth, AnnouncementController.getAnnouncement);
api.put('/announcement/:id', auth.ensureAuth, AnnouncementController.updateAnnouncement);
api.delete('/announcement/:id', auth.ensureAuth, AnnouncementController.deleteAnnouncement);
api.put('/announcement/highlight/:id', auth.ensureAuth, AnnouncementController.highlightAnnouncement);

module.exports = api;
