const ForumPost = require('../models/Forum');

// Crear nueva pregunta
async function createForumPost(req, res) {
  try {
    const { title, text } = req.body;
    const userId = req.user.sub;

    const newPost = new ForumPost({ title, text, user: userId });
    const savedPost = await newPost.save();
    res.status(201).send({ post: savedPost });
  } catch (err) {
    res.status(500).send({ message: 'Error al crear post', error: err.message });
  }
}

// Obtener todos los posts
async function getForumPosts(req, res) {
  try {
    const posts = await ForumPost.find()
      .populate('user', 'name surname image')
      .populate('answers.user', 'name surname image')
      .sort('-created_at');
    res.status(200).send({ posts });
  } catch (err) {
    res.status(500).send({ message: 'Error al obtener posts', error: err.message });
  }
}

// Responder a un post
async function addAnswer(req, res) {
  try {
    const postId = req.params.id;
    const { text } = req.body;
    const userId = req.user.sub;

    const post = await ForumPost.findById(postId);
    if (!post) return res.status(404).send({ message: 'Post no encontrado' });

    post.answers.push({ user: userId, text });
    await post.save();

    res.status(200).send({ post });
  } catch (err) {
    res.status(500).send({ message: 'Error al responder', error: err.message });
  }
}
module.exports = {
   createForumPost,
   getForumPosts,
   addAnswer

};
