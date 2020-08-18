/** 18082020 - Gaurav - Init Version
 * Added mailer utility */

const nodemailer = require('nodemailer');
const emailHandler = {};

emailHandler.PROCESS_NEW_USER = 'PROCESS_NEW_USER';
emailHandler.PROCESS_RESET_PASSWORD = 'PROCESS_RESET_PASSWORD';
emailHandler.PROCESS_RESET_PASSWORD_CONFIRMATION =
  'PROCESS_RESET_PASSWORD_CONFIRMATION';

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
      from: process.env.GMAILID,
      subject: props[0].emailSubject,
      html: props[0].emailBody,
    };

    await smtpTransport.sendMail(mailOptions);
  } catch (error) {
    throw new Error(`Error sending email for ${props[0].process}`);
  }
};

module.exports = emailHandler;

/**
 * 'Angular-YelpCamp: Welcome!'
 *
 */
