const express = require('express');
const router = express.Router({ mergeParams: true });

const CommentController = require('../controllers/comment.controller');
const checkAuth = require('../middleware/check-auth.middleware');

// router.get('', CommentController.getCampgroundComments);
router.post('/new', checkAuth, CommentController.createComment);
router.put('/:commentId', checkAuth, CommentController.editComment);
router.delete(
  '/:userId/:commentId',
  checkAuth,
  CommentController.deleteComment
);

module.exports = router;
