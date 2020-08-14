const mongoose = require('mongoose');
const chalk = require('./chalk.util');
const validator = {};

validator.PROCESS_CAMPGROUND = 'PROCESS_CAMPGROUND';
validator.PROCESS_COMMENT = 'PROCESS_COMMENT';
validator.PROCESS_USER = 'PROCESS_USER';
validator.PROCESS_NOTIFICATION = 'PROCESS_NOTIFICATION';

validator.validateIdentifier = async (
  processType,
  processSubType,
  identifier,
  res
) => {
  let id;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    id = await mongoose.Types.ObjectId(identifier);
  } else {
    let errorLog = 'Invalid ID passed';
    let message = 'Invalid request';

    switch (processType) {
      case validator.PROCESS_CAMPGROUND:
        errorLog = `${processSubType}: Invalid campgroundId passed`;
        message = 'Invalid Campground requested!';
        break;
      case validator.PROCESS_COMMENT:
        errorLog = `${processSubType}: Invalid commentId passed`;
        message = 'Invalid Comment requested!';
        break;
      case validator.PROCESS_USER:
        errorLog = `${processSubType}: Invalid userId passed`;
        message = 'Invalid User requested!';
        break;
      case validator.PROCESS_NOTIFICATION:
        errorLog = `${processSubType}: Invalid notificationId passed`;
        message = 'Invalid Notificaiton requested!';
        break;
      default:
    }

    chalk.logError(errorLog, identifier);

    res.status(400).json({ message });
  }

  return {
    id,
    res,
  };
};

module.exports = validator;
