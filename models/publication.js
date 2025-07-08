'use strict'
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PublicationSchema = Schema({
title: { type: String, required: true },
    text: String,
    files: [{
        path: String,
        originalName: String,
        mimeType: String,
        fileType: String // image | video | document | other
    }],
    created_at: String,
    user: { type: Schema.ObjectId, ref: 'User' },
    likes: [{ type: Schema.ObjectId, ref: 'User' }],
    comments: [{
        text: String,
        user: { type: Schema.ObjectId, ref: 'User' },
        created_at: String
    }]
});

module.exports = mongoose.model('Publication', PublicationSchema);
