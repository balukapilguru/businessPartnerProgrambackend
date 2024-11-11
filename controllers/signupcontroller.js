const Signup = require('../models/signup');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const emailOtpStorage = {};
const smsOtpStorage = {};


const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const signupAndVerify = async (req, res) => {
    const { name, email, phonenumber, emailOtp, smsOtp } = req.body;

    try {
        if (!emailOtp && !smsOtp) {
            
            const emailGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();
            const smsGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();

       
            emailOtpStorage[email] = emailGeneratedOtp;
            smsOtpStorage[phonenumber] = smsGeneratedOtp;

        
            const transporter = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS 
                }
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Email Verification OTP',
                text: `Your OTP for email verification is: ${emailGeneratedOtp}`
            });

            // Send SMS OTP
            await twilioClient.messages.create({
                body: `Your OTP for phone verification is: ${smsGeneratedOtp}`,
                from: process.env.TWILIO_PHONE_NUMBER,
                to: phonenumber
            });

            return res.status(200).json({ message: 'OTP sent to email and phone' });
        } else {
         
            if (emailOtpStorage[email] === emailOtp && smsOtpStorage[phonenumber] === smsOtp) {
            
                delete emailOtpStorage[email];
                delete smsOtpStorage[phonenumber];

                const user = await Signup.create({ name, email, phonenumber });

                res.status(200).json({ 
                    message: 'User registered and verified successfully',
                    user
                });
            } else {
                res.status(400).json({ message: 'Invalid OTP' });
            }
        }
    } catch (error) {
        res.status(500).json({ message: 'Error during signup or OTP verification', error });
    }
};


module.exports = signupAndVerify
