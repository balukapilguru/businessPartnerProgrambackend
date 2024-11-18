const nodemailer = require('nodemailer');
const config = require('../config'); // Make sure to configure email settings in a config file

const sendMail = async ({ to, subject, text, html }) => {
   
    const transporter = nodemailer.createTransport({
        host: config.mailConfig.mailHost,
        port: config.mailConfig.port,
        secure: true,
        auth: {
            user: config.mailConfig.mailUser,
            pass: config.mailConfig.mailPass
        }
    });
     
     JWT_SECRET: 'your-jwt-secret'
   
    const mailOptions = {
        from:  config.mailConfig.mailUser,  // sender address
        to,  // recipient(s)
        subject,  // email subject
        text,  // plain text body
        html,  // HTML body (optional)
    };

    try {
        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
        throw new Error('Failed to send email');
    }
};

module.exports = sendMail;
