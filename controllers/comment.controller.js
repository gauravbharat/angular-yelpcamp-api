const Campground = require('../models/campground.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');

const {
  PROCESS_CAMPGROUND,
  PROCESS_COMMENT,
  validateIdentifier,
  PROCESS_USER,
} = require('../utils/validations.util');
const { returnError } = require('../utils/error.util');

exports.getCampgroundComments = async (req, res) => {
  //
};

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
      'Error getting campground for creating comment!',
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
    return returnError(subprocess, error, 500, 'Error creating comment!', res);
  }

  try {
    foundCampground.comments.push(newComment);
    await foundCampground.save();

    return res.status(200).json({ message: 'Comment added successfully!' });
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error updating campground for new comment!',
      res
    );
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
      return res.status(200).json({ message: 'Comment updated successfully!' });
    } else {
      return res
        .status(401)
        .json({ message: 'Unauthorized to change comment!' });
    }
  } catch (error) {
    return returnError(subprocess, error, 500, 'Error editing comment!', res);
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
          404,
          'Unauthorized for deleting comment!',
          res
        );
      }
    }
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error validating comment delete request!',
      res
    );
  }

  try {
    const result = await Comment.deleteOne({ _id: commentId });

    if (result.n <= 0) {
      return res
        .status(401)
        .json({ message: 'Not authorized to delete this comment!' });
    }
  } catch (error) {
    return returnError(subprocess, error, 500, 'Error deleting comment!', res);
  }

  try {
    const result = await Campground.updateOne(
      { _id: campgroundId },
      { $pullAll: { comments: commentId } }
    );

    if (result.n > 0) {
      return res.status(200).json({
        message: 'Comment removed and campground updated successfully!',
      });
    } else {
      return res.status(401).json({
        message: 'Comment removed but campground not updated!',
      });
    }
  } catch (error) {
    return returnError(
      subprocess,
      error,
      500,
      'Error updating campground for deleted comment!',
      res
    );
  }
};
