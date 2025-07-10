// models/forumPost.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const respuestaSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  votes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

const forumPostSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  answers: [respuestaSchema],
  votes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ForumPost', forumPostSchema);