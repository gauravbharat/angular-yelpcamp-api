const mongoose = require('mongoose');

/** userId and and username, the top level fields, corresponds to the one creating this notification */
let notificationSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    campgroundId: { type: String },
    isRead: { type: Boolean, default: false },
    created: { type: Date, default: Date.now },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    campgroundName: { type: String },
    notificationType: { type: Number, required: true },
    follower: {
      id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      followerAvatar: String,
      followingUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    isCommentLike: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/*
  Notification Types:
  Action                      Value
  New Campground              0
  New Comment                 1
  User Admin Request          2
  New Follower                3
 */

module.exports = mongoose.model('Notification', notificationSchema);
