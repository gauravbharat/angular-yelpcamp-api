const Campground = require('../models/campground.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const EmailHandler = require('../utils/email.util');

const NotificationController = require('./notification.controller');

const {
  PROCESS_CAMPGROUND,
  PROCESS_COMMENT,
  validateIdentifier,
  PROCESS_USER,
} = require('../utils/validations.util');
const { returnError } = require('../utils/error.util');

// exports.getCampgroundComments = async (req, res) => {
//   //
// };

exports.createComment = async (req, res) => {
  let subprocess = 'create-comment';
  let foundCampground, newComment;

  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    subprocess,
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;

  try {
    //Check that the campground exists and get the campround
    foundCampground = await Campground.findOne({ _id: campgroundId });

    if (!foundCampground) {
      return res.status(400).json({ message: 'Campground not found!' });
    }
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error getting campground for creating review!',
      res
    );
  }

  try {
    req.body.text = req.sanitize(req.body.text);
    newComment = await Comment.create({ text: req.body.text });

    newComment.author.id = req.body.userId;
    newComment.author.username = req.body.username;
    newComment.author.avatar = req.body.userAvatar;

    await newComment.save();
  } catch (error) {
    return returnError(subprocess, error, 500, 'Error creating review!', res);
  }

  try {
    foundCampground.comments.push(newComment);
    await foundCampground.save();

    res.status(200).json({ message: 'Review added successfully!' });
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error updating campground for new review!',
      res
    );
  }

  /* 19082020 - Gaurav - Add notification when a comment is added, no error should be thrown on its failure though 
      1. confirm that the campground author and the comment author are not the same, no notifications for self comments
      2. find the campground author ID
      3. create a notification with the username, campground ID and name, comment ID and user ID
      4. update the notifications array for the campground author (user) 
    */
  try {
    /** 31082020 - Gaurav - Suddenly userId comparison failed when db is access from cloud atlas,
     * converted them to string before comparing */
    if (String(foundCampground.author.id) !== String(req.body.userId)) {
      const campgroundAuthor = await User.findById(foundCampground.author.id);

      // User may or may not exist
      if (campgroundAuthor) {
        // check that user opted to receive in-app comment notifications
        if (campgroundAuthor.enableNotifications.newComment) {
          let notification = await NotificationController.createNotification({
            campgroundId: foundCampground._id,
            commentId: newComment._id,
            campgroundName: foundCampground.name,
            userId: req.body.userId,
            username: req.body.username,
            notificationType:
              NotificationController.notificationTypes.NEW_COMMENT,
          });

          if (notification) {
            await campgroundAuthor.notifications.push(notification);
            await campgroundAuthor.save();
          }
        }

        // check that user opted to receive new comment emails
        if (campgroundAuthor.enableNotificationEmails.newComment) {
          // send password reset link to user
          await EmailHandler.sendEmail({
            process: EmailHandler.PROCESS_NEW_COMMENT,
            textOnly: false,
            emailTo: campgroundAuthor.email,
            emailSubject: `Angular-YelpCamp: Your campground ${foundCampground.name} has a new review!`,
            emailBody: `
            <div style="width: 60%; margin: 50px auto;">
  <h2>Greetings, ${campgroundAuthor.firstName}!</h2>
  <br />

  <h2>
    ${req.body.username} just reviewed your campground
    ${foundCampground.name} -
  </h2>
  <br />
  <hr />
  <div>
    <span style="display: flex; justify-content: flex-start;">
      <img
        style="
          width: 50px;
          height: 50px;
          object-fit: cover;
          overflow: hidden;
          border-radius: 50%;
        "
        src="${req.body.userAvatar}"
        alt="${req.body.username}"
      />
      &nbsp;&nbsp;
      <h3>${req.body.username}</h3>
    </span>

    <h3><i>${req.body.text}</i></h3>
  </div>
  <hr />
  <br />

  <h4>
    To visit campground,
    <a href="${process.env.CLIENT_URL}/campgrounds/show/${foundCampground._id}" target="_blank"
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

  <h4>Happy Camping!</h4>

  <h4>Best Regards,</h4>
  <h3>The Angular-YelpCamp Team ⛺️</h3>
</div>`,
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

exports.editComment = async (req, res) => {
  let subprocess = 'edit-comment';

  response = await validateIdentifier(
    PROCESS_COMMENT,
    subprocess,
    req.params.commentId,
    res
  );

  if (!response.id) {
    return res;
  }

  let commentId = response.id;

  response = await validateIdentifier(
    PROCESS_USER,
    subprocess,
    req.body.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;
  req.body.text = req.sanitize(req.body.text);

  try {
    const result = await Comment.updateOne(
      {
        _id: commentId,
        'author.id': userId,
      },
      { text: req.body.text, isEdited: true }
    );

    if (result.n > 0) {
      return res.status(200).json({ message: 'Review updated successfully!' });
    } else {
      return res
        .status(401)
        .json({ message: 'Unauthorized to change review!' });
    }
  } catch (error) {
    return returnError(subprocess, error, 500, 'Error editing review!', res);
  }
};

exports.deleteComment = async (req, res) => {
  let subprocess = 'delete-comment';

  let response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    subprocess,
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;

  response = await validateIdentifier(
    PROCESS_COMMENT,
    subprocess,
    req.params.commentId,
    res
  );

  if (!response.id) {
    return res;
  }

  let commentId = response.id;

  response = await validateIdentifier(
    PROCESS_USER,
    subprocess,
    req.params.userId,
    res
  );

  if (!response.id) {
    return res;
  }

  let userId = response.id;

  /** Is it required to check campground existence before removing any comment. Don't think so, BUT.
   * There may be, MAY BE, cases where a comment is erroneously not attached to a campground.
   * Our goal is to remove comments, including any unattached ones.
   * Verify though that the userId matches with the comment authorId OR it can also be the
   * campground owner userId who wants to delete any unwanted comment from teh campground.
   * So, now in this case, we need the campground it is associted with to check the campground author
   */
  // try {
  //   //Check that the campground exists and get the campround
  //   foundCampground = await Campground.findOne({ _id: campgroundId });

  //   if (!foundCampground) {
  //     return res.status(400).json({ message: 'Campground not found!' });
  //   }
  // } catch (error) {
  //   return returnError(
  //     subprocess,
  //     error,
  //     500,
  //     'Error getting campground for deleting comment references!',
  //     res
  //   );
  // }

  try {
    const commentAuthorRequested = await Comment.findOne({
      _id: commentId,
      'author.id': userId,
    });

    // console.log('commentAuthorRequested', commentAuthorRequested);

    if (!commentAuthorRequested) {
      const campgroundAuthorRequested = await Campground.findOne({
        _id: campgroundId,
        'author.id': userId,
      });

      // console.log('campgroundAuthorRequested', campgroundAuthorRequested);

      if (!campgroundAuthorRequested) {
        return returnError(
          subprocess,
          error,
          401,
          'Unauthorized for deleting review!',
          res
        );
      }
    }
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error validating review delete request!',
      res
    );
  }

  try {
    const result = await Comment.deleteOne({ _id: commentId });

    if (result.n <= 0) {
      return res
        .status(401)
        .json({ message: 'Not authorized to delete this review!' });
    }
  } catch (error) {
    return returnError(subprocess, error, 500, 'Error deleting review!', res);
  }

  try {
    const result = await Campground.updateOne(
      { _id: campgroundId },
      { $pullAll: { comments: [commentId] } }
    );

    if (result.n > 0) {
      await Notification.deleteMany({ commentId });

      return res.status(200).json({
        message: 'Review removed and campground updated successfully!',
      });
    } else {
      return res.status(401).json({
        message: 'Review removed but campground not updated!',
      });
    }
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error updating campground for deleted review!',
      res
    );
  }
};

exports.likeComment = async (req, res) => {
  let response = await validateIdentifier(
    PROCESS_COMMENT,
    'like-comment',
    req.params.commentId,
    res
  );

  if (!response.id) {
    return res;
  }

  let commentId = response.id;

  response = await validateIdentifier(
    PROCESS_CAMPGROUND,
    'like-comment',
    req.params.campgroundId,
    res
  );

  if (!response.id) {
    return res;
  }

  let campgroundId = response.id;

  let foundComment, foundUserLike, updateObj;

  try {
    foundComment = await Comment.findById(commentId);

    if (!foundComment) {
      return res.status(404).json({ message: 'Review not found!' });
    }

    foundUserLike = foundComment.likes.some((like) => {
      return like.id.equals(req.userData.userId);
    });

    /** if found, user wish to unlike the comment */
    if (foundUserLike) {
      updateObj = {
        $pull: {
          likes: {
            id: req.userData.userId,
          },
        },
      };
    } else {
      updateObj = {
        $push: {
          likes: {
            $each: [
              {
                id: req.userData.userId,
                username: req.userData.username,
                avatar: req.body.currentUserAvatar,
              },
            ],
          },
        },
      };
    }

    const result = await Comment.updateOne({ _id: commentId }, updateObj);

    if (result.n > 0) {
      res.status(200).json({
        message: 'Review likes updated!',
      });
    } else {
      return res.status(401).json({
        message: 'Error updating review likes!',
      });
    }
  } catch (error) {
    return returnError(
      'like-comment',
      error,
      500,
      'Error liking comment!',
      res
    );
  }

  try {
    if (foundUserLike) {
      let result = await Notification.deleteMany({
        commentId: foundComment._id,
        userId: req.userData.userId,
        isCommentLike: true,
        notificationType:
          NotificationController.notificationTypes.NEW_COMMENT_LIKE,
      });
    } else {
      if (String(req.userData.userId) !== String(foundComment.author.id)) {
        const foundCampground = await Campground.findById(campgroundId);
        const commentAuthor = await User.findById(foundComment.author.id);

        // User may or may not exist
        if (commentAuthor) {
          // check that user opted to receive in-app comment notifications
          if (commentAuthor.enableNotifications.newCommentLike) {
            let notification = await NotificationController.createNotification({
              campgroundId: foundCampground._id,
              commentId: foundComment._id,
              campgroundName: foundCampground.name,
              isCommentLike: true,
              userId: req.userData.userId,
              username: req.userData.username,
              notificationType:
                NotificationController.notificationTypes.NEW_COMMENT_LIKE,
            });

            if (notification) {
              await commentAuthor.notifications.push(notification);
              await commentAuthor.save();
            }
          }
        }
      }
    }
  } catch (error) {
    //do nothing
    console.log('like-comment', 'error sending notificaiton', error);
  }
};
