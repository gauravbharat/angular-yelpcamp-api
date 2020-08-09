const express = require('express');
const router = express.Router();

const UserController = require('../controllers/user.controller');

// Signup user
router.post('/signup', UserController.registerUser);

// Login user
router.post('/login', UserController.loginUser);

module.exports = router;
