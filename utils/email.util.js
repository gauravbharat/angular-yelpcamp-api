/** 18082020 - Gaurav - Init Version
 * Added mailer utility */

const nodemailer = require('nodemailer');
const emailHandler = {};

emailHandler.PROCESS_NEW_USER = 'PROCESS_NEW_USER';
emailHandler.PROCESS_RESET_PASSWORD_TOKEN_REQUEST =
  'PROCESS_RESET_PASSWORD_TOKEN_REQUEST';
emailHandler.PROCESS_RESET_PASSWORD_CONFIRMATION =
  'PROCESS_RESET_PASSWORD_CONFIRMATION';
emailHandler.PROCESS_NEW_COMMENT = 'PROCESS_NEW_COMMENT';
emailHandler.PROCESS_NEW_CAMPGROUND = 'PROCESS_NEW_CAMPGROUND';
emailHandler.PROCESS_NEW_FOLLOWER = 'PROCESS_NEW_FOLLOWER';

emailHandler.sendEmail = async (...props) => {
  try {
    let smtpTransport = await nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAILID,
        pass: process.env.GMAILPW,
      },
    });

    let mailOptions = {
      to: props[0].emailTo,
      from: `"Angular-YelpCamp ⛺" <${process.env.GMAILID}>`,
      subject: props[0].emailSubject,
    };

    if (props[0].textOnly) {
      mailOptions.text = props[0].emailBody;
    } else {
      mailOptions.html = props[0].emailBody;
    }

    const result = await smtpTransport.sendMail(mailOptions);
    return;
  } catch (error) {
    throw new Error(`Error sending email for ${props[0].process}`);
  }
};

module.exports = emailHandler;

/**
 * 'Angular-YelpCamp: Welcome!'
 *
 */
