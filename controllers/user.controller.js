const bcrypt = require('bcrypt');
const EmailHandler = require('../utils/email.util');

const User = require('../models/user.model');
const Campground = require('../models/campground.model');
const Comment = require('../models/comment.model');

const {
  validateIdentifier,
  PROCESS_USER,
} = require('../utils/validations.util');
const { returnError } = require('../utils/error.util');

exports.registerUser = async (req, res) => {
  if (!req.body) {
    return returnError(
      'register-user',
      error,
      400,
      'No user registration data received!',
      res
    );
  }

  try {
    const userData = await new User({
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      firstName: req.body.firstname,
      lastName: req.body.lastname,
      isAdmin: req.body.isAdmin,
      isPublisher: req.body.isPublisher,
      isRequestedAdmin: req.body.isRequestedAdmin,
    });

    const newUser = await userData.save();
    const token = await userData.generateAuthToken();

    /** Send a welcome email to the user */
    await EmailHandler.sendEmail({
      process: EmailHandler.PROCESS_NEW_USER,
      emailTo: req.body.email,
      emailSubject: `Angular-YelpCamp: Welcome!`,
      emailBody: `<h1>Hello, ${req.body.firstname}!</h1>
      <br />
      <h3>We are glad you chose to be a part of our <a href="https://secure-sands-36219.herokuapp.com/" target="_blank">Angular-YelpCamp community.</a></h3>
      <br />
      <p>
        Feel free to explore fellow member campgrounds, post your own camps or let the
        members know what you think about their camps!
      </p>
      <br />
      <hr />
      <p>For your records, your registration details are -</p>
      <ul>
        <li>username: ${req.body.username}</li>
        <li>username: ${req.body.email}</li>
        <li>username: ${req.body.firstname}</li>
        <li>username: ${req.body.lastname}</li>
      </ul>
      <hr />
      <br />
      
      <h3>Warm welcome, and happy camping!!</h3>
      <br />
      <h4>Best Regards,</h4>
      <h4><strong>The Angular-YelpCamp Team &#9968;</strong></h4>`,
    });

    res.status(201).json({
      message: 'User registered!',
      newUser: {
        userId: newUser._id,
        email: newUser.email,
        username: newUser.username,
        firstname: newUser.firstName,
        lastname: newUser.lastName,
        isAdmin: newUser.isAdmin,
        avatar: newUser.avatar,
        followers: newUser.followers,
        notifications: newUser.notifications,
        isPublisher: newUser.isPublisher,
        isRequestedAdmin: newUser.isRequestedAdmin,
        isSuperAdmin: newUser.isSuperAdmin,
        token,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    return returnError(
      'register-user',
      error,
      500,
      'User registration failed!',
      res
    );
  }
};

exports.loginUser = async (req, res) => {
  if (!req.body) {
    return returnError(
      'login-user',
      error,
      400,
      'No user login data received!',
      res
    );
  }

  // console.log(req.body);

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
        firstname: user.firstName,
        lastname: user.lastName,
        isAdmin: user.isAdmin,
        avatar: user.avatar,
        followers: user.followers,
        notifications: user.notifications,
        isPublisher: user.isPublisher,
        isRequestedAdmin: user.isRequestedAdmin,
        isSuperAdmin: user.isSuperAdmin,
        token,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    return returnError('login-user', error, 500, 'User login failed!', res);
  }
};

exports.getUserActivity = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_USER,
    'get-couser',
    req.params.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  try {
    /** Get User Campgrounds, limit to last 10 */
    const mappedCamgrounds = await getUserCampgrounds(userId);

    res.status(200).json({
      message: 'Returning user activity, if exists',
      userCampgrounds: mappedCamgrounds,
      userComments: [],
    });
  } catch (error) {
    return returnError(
      'get-user-activity',
      error,
      500,
      'Error getting user activity!',
      res
    );
  }
};

exports.getUser = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_USER,
    'get-couser',
    req.params.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  try {
    /** Get User Details */
    const userData = await User.findById(userId);

    if (!userData) {
      return res.status(404).json({
        message:
          'User does not exist now, the account may have been deleted or removed!',
      });
    }

    /** Get User Campgrounds, limit to last 10 */
    const mappedCamgrounds = await getUserCampgrounds(userId);

    // /** Get User Comment Activity, limit to last 10 */
    // // const userData3 = await Comment.find({'author.id': userId}).limit(10).sort([['edited', -1]]);
    // const userData3 = await Comment.find({ 'author.id': userId })
    // .limit(10)
    // .sort([['created', -1]]);

    // const commentIdList = userData3.map(comment => {
    //   return comment._id
    // });

    // console.log(
    //   '============================================================='
    // );
    // console.log('userData2', userData2);
    // console.log(
    //   '============================================================='
    // );
    // console.log('mappedCamgrounds', mappedCamgrounds);
    // console.log(
    //   '============================================================='
    // );

    /** USED FIND INSTEAD OF AGGREGATION
    let userData = await User.aggregate([
      {
        $match: {
          _id: {
            $in: [userId],
          },
        },
      },
      {
        $lookup: {
          from: 'campgrounds',
          localField: '_id',
          foreignField: 'author.id',
          as: 'user_campgrounds',
        },
      },
    ]);

    

    let userData2 = await User.aggregate([
      {
        $match: {
          _id: {
            $in: [userId],
          },
        },
      },
      {
        $lookup: {
          from: 'campgrounds',
          let: { authorId: '$_id', username: '$username' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ['$author.id', '$$authorId'],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                userId: '$$authorId',
                username: '$$username',
                campgroundId: '$_id',
                name: '$name',
                created: '$created',
              },
            },
          ],
          as: 'user_campgrounds',
        },
      },
    ]);

    */

    // res.status(200).json({ message: 'trial run' });

    // console.log(user);

    return res.status(200).json({
      message: 'User found!',
      coUserData: {
        coUserId: userData._id,
        email: userData.email,
        username: userData.username,
        firstname: userData.firstName,
        lastname: userData.lastName,
        isAdmin: userData.isAdmin,
        avatar: userData.avatar,
        followers: userData.followers,
        isPublisher: userData.isPublisher,
        isRequestedAdmin: userData.isRequestedAdmin,
        isSuperAdmin: userData.isSuperAdmin,
      },
      userCampgrounds: mappedCamgrounds,
    });
  } catch (error) {
    return returnError('get-user', error, 500, 'User fetch failed!', res);
  }
};

exports.toggleFollowUser = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_USER,
    'follow-co-user',
    req.body.userToFollowId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userToFollowId = response.id;

  response = await validateIdentifier(
    PROCESS_USER,
    'follow-co-user',
    req.body.followingUserId,
    res
  );

  if (!response.id) {
    return res;
  }

  let followingUserId = response.id;
  let action;

  if (req.body.follow) {
    action = { $push: { followers: followingUserId } };
  } else {
    action = { $pullAll: { followers: [followingUserId] } };
  }

  try {
    const result = await User.updateOne({ _id: userToFollowId }, action);

    // console.log('user follow result', result, 'option', req.body.follow);

    if (result.n > 0) {
      return res.status(200).json({
        message: `User ${
          req.body.follow ? 'followed' : 'unfollowed'
        } successfully!`,
      });
    } else {
      return res.status(404).json({
        message: 'User not found to follow!',
      });
    }
  } catch (error) {
    return returnError(
      'follow-user',
      error,
      500,
      'Error in user follow update!',
      res
    );
  }
};

exports.updateUserAvatar = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_USER,
    'change-user-avatar',
    req.body.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  try {
    const avatar = req.body.avatar.trim();

    if (!avatar) {
      return res
        .status(400)
        .json({ message: 'Invalid path for new user avatar image!' });
    }

    let result = await User.updateOne({ _id: userId }, { avatar });

    if (result.n > 0) {
      await Comment.updateMany(
        { 'author.id': userId },
        { 'author.avatar': avatar }
      );
      res.status(200).json({ message: 'User avatar updated!' });
    } else {
      res.status(401).json({ message: 'user avatar update failed!' });
    }
  } catch (error) {
    return returnError(
      'change-user-avatar',
      error,
      500,
      'Error updating user avatar image!',
      res
    );
  }
};

exports.updateUserPassword = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_USER,
    'change-user-password',
    req.body.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  try {
    const oldPassword = req.body.oldpass.trim();
    const newPassword = req.body.newpass.trim();

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Invalid password!' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({ message: 'Invalid user!' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: 'Old password is incorrect, please try again!' });
    }

    /** All checks performed, set new password
     * encryption would be taken care in the 'pre' save code defined in user model */
    user.password = newPassword.trim();

    await user.save();

    res.status(200).json({ message: 'Password changed!' });
  } catch (error) {
    return returnError(
      'change-user-password',
      error,
      500,
      'Server error updating password, please try again after some time or contact administrator!',
      res
    );
  }
};

exports.updateUserDetails = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_USER,
    'change-user-details',
    req.body.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  try {
    const firstName = req.body.firstname.trim();
    const lastName = req.body.lastname.trim();
    const email = req.body.email.trim();

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Invalid input received!' });
    }

    let result = await User.updateOne(
      { _id: userId },
      { firstName, lastName, email }
    );

    if (result.n > 0) {
      res.status(200).json({ message: 'User details updated!' });
    } else {
      res.status(401).json({ message: 'user detail update failed!' });
    }
  } catch (error) {
    return returnError(
      'change-user-details',
      error,
      500,
      'Error updating user details!',
      res
    );
  }
};

const getUserCampgrounds = async (userId) => {
  try {
    const campgrounds = await Campground.find({ 'author.id': userId })
      .limit(10)
      .sort([['created', -1]]);

    return (mappedCamgrounds = campgrounds.map((campground) => {
      return {
        campgroundId: campground._id,
        campgroundName: campground.name,
        campgroundCreated: campground.created,
      };
    }));
  } catch (error) {
    throw new Error('Error getting user campgrounds!');
  }
};

/** JWT (JSON Web Token) =>
1. package of information, hashed into one long string
2. which is generated on the server upon a successful login or signup
3. that token is sent back to the browser where you can store it in the angular app, in the form of a cookie or in the localStorage
4. this token is then attached to all future requests as as part of the URL header, the token can't be faked and only requests with a valid token are allowed otherwise rejected */
