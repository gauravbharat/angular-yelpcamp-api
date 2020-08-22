/*
  Notification Types:
  Action                      Value
  New Campground              0
  New Comment                 1
  User Admin Request          2
  New Follower                3
 */

const Notification = require('../models/notification.model');
const notificationTypeText = [
  'NEW_CAMPGROUND',
  'NEW_COMMENT',
  'USER_ADMIN_REQUEST',
  'NEW_FOLLOWER',
];

exports.notificationTypes = {
  NEW_CAMPGROUND: 0,
  NEW_COMMENT: 1,
  USER_ADMIN_REQUEST: 2,
  NEW_FOLLOWER: 3,
};

exports.createNotification = async (newNotification) => {
  try {
    return await Notification.create(newNotification);
  } catch (error) {
    console.log(
      `Error adding new notification for request type ${notificationTypeText[notificationType]}`
    );
    return;
  }
};

exports.updateNotification = async (req) => {
  try {
    await Notification.updateMany(
      {
        _id: {
          $in: [req.body.notificationIdArr],
        },
      },
      { isRead: req.body.isSetRead }
    );

    return;
  } catch (error) {
    console.log('notifications update error', error);
    throw new Error('Error updating notifications on the server!');
  }
};

exports.deleteNotification = async (req) => {
  try {
    await Notification.deleteMany({
      _id: {
        $in: [req.body.notificationIdArr],
      },
    });

    return;
  } catch (error) {
    console.log('notifications delete error', error);
    throw new Error('Error deleting notifications from the server!');
  }
};
