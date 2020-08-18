const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth.middleware');

const UserController = require('../controllers/user.controller');

// Get user details
router.get('/:userId', checkAuth, UserController.getUser);

// Get user activity
router.get('/activity/:userId', checkAuth, UserController.getUserActivity);

// Signup user
router.post('/signup', UserController.registerUser);

// Login user
router.post('/login', UserController.loginUser);

// Follow or unfollow user
router.post('/follow', checkAuth, UserController.toggleFollowUser);

// Change user avatar
router.put('/avatar/me', checkAuth, UserController.updateUserAvatar);

// Change user password
router.put('/pwd/me', checkAuth, UserController.updateUserPassword);

// Change user details
router.put('/detail/me', checkAuth, UserController.updateUserDetails);

module.exports = router;
