// const mongoose = require(mongoose);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user.model');
const chalk = require('../utils/chalk.util');

exports.registerUser = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: 'No user registration data received!',
    });
  }

  try {
    const userData = await new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstname: req.body.firstName,
      lastname: req.body.firstName,
      isAdmin: req.body.isAdmin,
      isPublisher: req.body.isPublisher,
      isRequestedAdmin: req.body.isRequestedAdmin,
    });

    const newUser = await userData.save();
    const token = await userData.generateAuthToken();

    res.status(201).json({
      message: 'User registered!',
      newUser: {
        userId: newUser._id,
        email: newUser.email,
        username: newUser.username,
        isAdmin: newUser.isAdmin,
        avatar: newUser.avatar,
        followers: newUser.followers,
        notifications: newUser.notifications,
        isPublisher: newUser.isPublisher,
        isRequestedAdmin: newUser.isRequestedAdmin,
        token,
        tokenTimer: 3600,
      },
    });
  } catch (error) {
    chalk.logError('register-user', error);
    console.log('register-user', error);
    res.status(500).json({
      message: 'User registration failed!',
      error,
    });
  }
};

exports.loginUser = async (req, res) => {
  if (!req.body) {
    return res.status(400).json({
      message: 'No user login data received!',
    });
  }

  try {
    const user = await User.findByCredentials(
      req.body.username,
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.status(201).json({
      message: 'User logged-in!',
      userData: {
        userId: user._id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        followers: user.followers,
        notifications: user.notifications,
        isPublisher: user.isPublisher,
        isRequestedAdmin: user.isRequestedAdmin,
        token,
        tokenTimer: 3600,
      },
    });
  } catch (error) {
    chalk.logError('login-user', error);
    console.log('login-user', error);
    res.status(500).json({
      message: 'User login failed!',
      error,
    });
  }
};

/** JWT (JSON Web Token) =>
1. package of information, hashed into one long string
2. which is generated on the server upon a successful login or signup
3. that token is sent back to the browser where you can store it in the angular app, in the form of a cookie or in the localStorage
4. this token is then attached to all future requests as as part of the URL header, the token can't be faked and only requests with a valid token are allowed otherwise rejected */
