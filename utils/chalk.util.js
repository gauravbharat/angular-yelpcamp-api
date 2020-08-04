const chalk = require('chalk');

const logColors = Object.freeze({
  errorColorBG: chalk.bgRed,
  errorColor: chalk.red,
  successColorBG: chalk.black.bgGreen,
  successColor: chalk.green,
  warningColor: chalk.yellow,
});

exports.logSuccess = (...parms) => {
  console.log(logColors.successColorBG(...parms));
};

exports.logError = (...parms) => {
  console.log(logColors.errorColorBG(...parms));
};
