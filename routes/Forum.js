const express = require('express');
const router = express.Router();
const forumController = require('../controller/Forum');
var auth = require('../middleware/auth');

router.post('/forum', auth.ensureAuth, forumController.createForumPost);
router.get('/forum', auth.ensureAuth, forumController.getForumPosts);
router.post('/forum/:id/answer', auth.ensureAuth, forumController.addAnswer);

module.exports = router;