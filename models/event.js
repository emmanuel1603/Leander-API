'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var EventSchema = Schema({
    title: String,
    description: String,
    date: Date,
    location: String,
    created_at: String,
    user: { type: Schema.ObjectId, ref: 'User' },
    attendees: [{ type: Schema.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Event', EventSchema);
