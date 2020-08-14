const chalk = require('./chalk.util');
const errorHandler = {};

errorHandler.returnError = (errorForAction, error, status, message, res) => {
  chalk.logError(errorForAction, error);
  console.log(errorForAction, error);
  return res.status(status).json({ message });
};

module.exports = errorHandler;
