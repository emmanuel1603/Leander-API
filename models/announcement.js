'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnnouncementSchema = Schema({
    title: String,
    content: String,
    user: {type: Schema.ObjectId, ref: 'User'},
    isPublic: {type: Boolean, default: true},
    isHighlighted: {type: Boolean, default: false},
    expiresAt: Date,
    createdAt: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
