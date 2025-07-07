'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var NotificationSchema = Schema({
    type: String, // 'like', 'comment', 'message', 'event_attend', etc.
    read: Boolean,
    created_at: { type: Date, default: Date.now }, // Cambiado a Date para consistencia
    emitter: { type: Schema.ObjectId, ref: 'User' },
    receiver: { type: Schema.ObjectId, ref: 'User' },
    publication: { type: Schema.ObjectId, ref: 'Publication' },
    event: { type: Schema.ObjectId, ref: 'Event' },
    message: { type: Schema.ObjectId, ref: 'Message' } // Añadir referencia a Message
});

module.exports = mongoose.model('Notification', NotificationSchema);
