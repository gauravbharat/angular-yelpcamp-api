const bcrypt = require('bcrypt');
const crypto = require('crypto');
const EmailHandler = require('../utils/email.util');

const User = require('../models/user.model');
const Campground = require('../models/campground.model');
const Comment = require('../models/comment.model');
const Notification = require('../models/notification.model');

const NotificationController = require('./notification.controller');

const {
  validateIdentifier,
  PROCESS_USER,
} = require('../utils/validations.util');
const { returnError } = require('../utils/error.util');
const { isArray, isString } = require('util');

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
        enableNotifications: {
          newCampground: newUser.enableNotifications.newCampground,
          newComment: newUser.enableNotifications.newComment,
          newFollower: newUser.enableNotifications.newFollower,
        },
        enableNotificationEmails: {
          system: newUser.enableNotificationEmails.system,
          newCampground: newUser.enableNotificationEmails.newCampground,
          newComment: newUser.enableNotificationEmails.newComment,
          newFollower: newUser.enableNotificationEmails.newFollower,
        },
        hideStatsDashboard: newUser.hideStatsDashboard,
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

  try {
    /** Send a welcome email to the user
     * this process shouldn't block user registration by http error
     */
    await EmailHandler.sendEmail({
      process: EmailHandler.PROCESS_NEW_USER,
      textOnly: false,
      emailTo: req.body.email,
      emailSubject: `Welcome to Angular-YelpCamp!`,
      emailBody: `<div style="width: 60%; margin: 50px auto;">
      <h2>Greetings, ${req.body.firstnamee}!</h2>
      <br />
    
      <h3>
        We are glad you chose to be a part of our
        <a href="${process.env.CLIENT_URL}" target="_blank"
          >Angular-YelpCamp community.</a
        >
      </h3>
      <br />
    
      <p>
        Feel free to explore fellow member campgrounds, post your own camps or let
        the members know what you think about their camps!
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
      <h4>
        To manage your information,
        <a href="${process.env.CLIENT_URL}/user/current" target="_blank"
          >click here</a
        >
      </h4>
      <hr />
      <br />
    
      <h3>Warm welcome, and happy camping!!</h3>
      <br />
    
      <h4>Best Regards,</h4>
      <h3>The Angular-YelpCamp Team ⛺️</h3>
    </div>
    `,
    });
  } catch (error) {
    console.log('error sending registration email', error);
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
        enableNotifications: {
          newCampground: user.enableNotifications.newCampground,
          newComment: user.enableNotifications.newComment,
          newFollower: user.enableNotifications.newFollower,
        },
        enableNotificationEmails: {
          system: user.enableNotificationEmails.system,
          newCampground: user.enableNotificationEmails.newCampground,
          newComment: user.enableNotificationEmails.newComment,
          newFollower: user.enableNotificationEmails.newFollower,
        },
        hideStatsDashboard: user.hideStatsDashboard,
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
    req.body.followerUserId,
    res
  );

  if (!response.id) {
    return res;
  }

  let followerUserId = response.id;
  let action;

  if (req.body.follow) {
    action = { $push: { followers: followerUserId } };
  } else {
    action = { $pullAll: { followers: [followerUserId] } };
  }

  try {
    /** When current user follows a fellow user, created a notification for that user */
    if (!req.body.follow) {
      /** If current user unfollows a fellow user =>
       * fetch fellow user notifications
       * filter to select only those where current user id matches with that of the follower
       * delete such notifications
       * pull out from notifications array of fellow user
       */
      action = { $pullAll: { followers: [followerUserId] } };

      const notifications = await Notification.find({
        'follower.id': followerUserId,
        'follower.followingUserId': userToFollowId,
      });

      if (notifications && notifications.length > 0) {
        let notification_ids = await notifications.map((notification) => {
          return notification._id;
        });

        await Notification.deleteMany({
          'follower.id': followerUserId,
          'follower.followingUserId': userToFollowId,
        });

        /** Take this opportunity to pull-out those notification ids which does not exist */
        User.findById(userToFollowId)
          .populate('notifications')
          .exec(async (err, user) => {
            let deadNotifications;

            // Get active notifications, if any
            let activeNotifications = user.notifications.map(
              (notification) => notification._id
            );

            // Get all notifications currently stored
            let userData = await User.findOne({ _id: userToFollowId });
            let allNotifications = userData.notifications;

            // Separate the dead-ref ones
            if (activeNotifications && activeNotifications.length > 0) {
              deadNotifications = allNotifications.filter(
                (x) => !activeNotifications.includes(x)
              );
            } else {
              deadNotifications = allNotifications;
            }

            // console.log('activeNotifications', activeNotifications);
            // console.log('allNotifications', allNotifications);
            // console.log('deadNotifications', deadNotifications);

            // Remove dead-ref notifications
            if (deadNotifications && deadNotifications.length > 0) {
              await User.updateOne(
                { _id: userToFollowId },
                {
                  $pullAll: {
                    notifications: [...deadNotifications],
                  },
                }
              );
            }
          });

        action = {
          $pullAll: {
            followers: [followerUserId],
            notifications: [...notification_ids],
          },
        };
      }
    }

    const result = await User.updateOne({ _id: userToFollowId }, action);

    // console.log('user follow result', result, 'option', req.body.follow);

    if (result.n > 0) {
      res.status(200).json({
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

  try {
    if (req.body.follow) {
      const userToFollow = await User.findById(userToFollowId);

      if (userToFollow) {
        const currentUser = await User.findById(followerUserId);

        // check that user opted to receive in-app follower notifications
        if (userToFollow.enableNotifications.newFollower) {
          let notification = await NotificationController.createNotification({
            username: currentUser.username,
            follower: {
              id: currentUser._id,
              followerAvatar: currentUser.avatar,
              followingUserId: userToFollowId,
            },
            notificationType:
              NotificationController.notificationTypes.NEW_FOLLOWER,
          });

          if (notification) {
            await userToFollow.notifications.push(notification);
            await userToFollow.save();
          }
        }

        // check that user opted to receive new follower emails
        if (userToFollow.enableNotificationEmails.newFollower) {
          // send password reset link to user
          await EmailHandler.sendEmail({
            process: EmailHandler.PROCESS_NEW_FOLLOWER,
            textOnly: false,
            emailTo: userToFollow.email,
            emailSubject: `Angular-YelpCamp: Your have a new follower!`,
            emailBody: `
            <div style="width: 60%; margin: 50px auto;">
  <h2>Hey, ${userToFollow.firstName}!</h2>
  <br />

  <h2>
    You have a new follower -
  </h2>
  <br />
  <hr />
  <div>
    <span style="display: flex; justify-content: flex-start;">
      <img
        style="
          width: 100px;
          height: 100px;
          object-fit: cover;
          overflow: hidden;
          border-radius: 50%;
        "
        src="${currentUser.avatar}"
        alt="${currentUser.username}"
      />
      &nbsp;&nbsp;
      <h2>${currentUser.username}</h2>
    </span>
  </div>
  <hr />
  <br />

  <h4>
    To see complete user profile,
    <a
      href="${process.env.CLIENT_URL}/user/other/${currentUser._id}"
      target="_blank"
      >click here</a
    >
  </h4>
  <h4>
    To see all notifications,
    <a href="${process.env.CLIENT_URL}/user/notifications" target="_blank"
      >click here</a
    >
  </h4>
  <h4>
    To manage notifications,
    <a href="${process.env.CLIENT_URL}/user/current" target="_blank"
      >click here</a
    >
  </h4>
  <br />

  <h4>Happy camping, and keep posting!</h4>

  <h4>Best Regards,</h4>
  <h3>The Angular-YelpCamp Team ⛺️</h3>
</div>`,
          });
        }
      }
    }
  } catch (error) {
    console.log('error updating new follow notifications', error);
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
    req.body.userData.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  try {
    const firstName = req.body.userData.firstname.trim();
    const lastName = req.body.userData.lastname.trim();
    const email = req.body.userData.email.trim();

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'Invalid input received!' });
    }

    let result = await User.updateOne(
      { _id: userId },
      {
        firstName,
        lastName,
        email,
        hideStatsDashboard: req.body.userData.hideStatsDashboard,
        'enableNotifications.newCampground':
          req.body.userData.enableNotifications.newCampground,
        'enableNotifications.newComment':
          req.body.userData.enableNotifications.newComment,
        'enableNotifications.newFollower':
          req.body.userData.enableNotifications.newFollower,
        'enableNotificationEmails.newCampground':
          req.body.userData.enableNotificationEmails.newCampground,
        'enableNotificationEmails.newComment':
          req.body.userData.enableNotificationEmails.newComment,
        'enableNotificationEmails.newFollower':
          req.body.userData.enableNotificationEmails.newFollower,
      }
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

/** Set user notifications to read or unread */
exports.updateNotification = async (req, res) => {
  try {
    if (!isArray(req.body.notificationIdArr)) {
      return res.status(400).json({
        message:
          'Invalid data format received to remove notification/s. Please contact web administrator.',
      });
    }

    await NotificationController.updateNotification(req);

    res.status(200).json({ message: 'Notification updated!' });
  } catch (error) {
    return returnError(
      'update-user-notifications',
      error,
      500,
      'Error updating user notifications!',
      res
    );
  }
};

exports.removeNotifications = async (req, res) => {
  try {
    if (!isArray(req.body.notificationIdArr)) {
      return res.status(400).json({
        message:
          'Invalid data format received to remove notification/s. Please contact web administrator.',
      });
    }

    let result = await User.updateOne(
      { _id: req.userData.userId },
      {
        $pullAll: {
          notifications: [req.body.notificationIdArr],
        },
      }
    );

    await NotificationController.deleteNotification(req);

    res.status(200).json({ message: 'Notification removed!' });
  } catch (error) {
    return returnError(
      'remove-user-notifications',
      error,
      500,
      'Error removing user notifications!',
      res
    );
  }
};

/** Password reset related methods - Start */
exports.createResetToken = async (req, res) => {
  try {
    // Check user email exists
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        message: 'User for password reset not found!',
      });
    }

    // create a token and save it for the user
    const buf = await crypto.randomBytes(20);
    const token = buf.toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // send password reset link to user
    await EmailHandler.sendEmail({
      process: EmailHandler.PROCESS_RESET_PASSWORD_TOKEN_REQUEST,
      textOnly: true,
      emailTo: req.body.email,
      emailSubject: `Angular-YelpCamp: Password Reset`,
      emailBody: `You are receiving this because you (or someone else) have requested the reset of the Angular-YelpCamp password. \n\n
       Please click on the following link, or paste this into your browser to complete the process - \n 
       ${process.env.CLIENT_URL}/auth/reset/${token}\n\n
      If you did not request this, please ignore this email and your Angular-YelpCamp password will remain unchanged.\n 
      The Angular-YelpCamp Team`,
    });

    res
      .status(200)
      .json({ message: 'Password reset link sent to user email address!' });
  } catch (error) {
    return returnError(
      'create-reset-token',
      error,
      500,
      'Server error creating reset password link!',
      res
    );
  }
};

exports.verifyResetToken = async (req, res) => {
  if (!req.params.token || !isString(req.params.token)) {
    return res.status(400).json({
      message:
        'Invalid data format received to reset password. Please contact web administrator.',
    });
  }

  try {
    const user = await User.findOne({ resetPasswordToken: req.params.token });

    if (!user) {
      return res.status(401).json({
        message: 'Password reset token is invalid or has expired.',
      });
    }

    const expiresIn = user.resetPasswordExpires.getTime();
    const now = new Date();

    // console.log('expiresIn', expiresIn);
    // console.log('now', now.getTime());

    if (now.getTime() > expiresIn) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(401).json({
        message: 'Password reset token is invalid or has expired.',
      });
    }

    res.status(200).json({ message: 'Token verified successfully!' });
  } catch (error) {
    return returnError(
      'verify-reset-token',
      error,
      500,
      'Server error verifying reset token!',
      res
    );
  }
};

exports.resetPassword = async (req, res) => {
  let user;
  if (
    !req.params.token ||
    !isString(req.params.token) ||
    !req.body.newpw ||
    !isString(req.body.newpw)
  ) {
    return res.status(400).json({
      message:
        'Invalid data format received to reset password. Please contact web administrator.',
    });
  }

  try {
    user = await User.findOne({ resetPasswordToken: req.params.token });

    if (!user) {
      return res.status(401).json({
        message: 'Password reset token is invalid or has expired.',
      });
    }

    const expiresIn = user.resetPasswordExpires.getTime();
    const now = new Date();

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    if (now.getTime() > expiresIn) {
      await user.save();
      return res.status(401).json({
        message: 'Password reset token is invalid or has expired.',
      });
    }

    user.password = req.body.newpw;
    await user.save();

    res.status(200).json({
      message: 'Password reset! Please login with your new password.',
    });
  } catch (error) {
    return returnError(
      'reset-password',
      error,
      500,
      'Server error resetting user password!',
      res
    );
  }

  try {
    // send password reset success to user, without sending any http error back on email service malfunction
    await EmailHandler.sendEmail({
      process: EmailHandler.PROCESS_RESET_PASSWORD_CONFIRMATION,
      textOnly: true,
      emailTo: user.email,
      emailSubject: `Angular-YelpCamp: Your password has been changed`,
      emailBody: `Hello ${user.username},\n\n
          This is a confirmation that the password for your account ${user.email} has just changed.\n
          
          *** In case you have not requested this change, please contact Angular-YelpCamp immediately on support@veerappa.co ***\n
          
          The Angular-YelpCamp Team`,
    });
  } catch (error) {
    console.log('email send password reset', error);
  }
};
/** Password reset related methods - Ends */

/** JWT (JSON Web Token) =>
1. package of information, hashed into one long string
2. which is generated on the server upon a successful login or signup
3. that token is sent back to the browser where you can store it in the angular app, in the form of a cookie or in the localStorage
4. this token is then attached to all future requests as as part of the URL header, the token can't be faked and only requests with a valid token are allowed otherwise rejected */
