const express = require('express');
const usersControllers = require('../../controllers/usersControllers');
const { changePassword } = require('../../controllers/usersControllers');
const authenticate = require('../../middlewares/authmiddlewares');

const router = express.Router(); // Ensure that this line initializes the router correctly

router.post('/signup', usersControllers.sendOtp);
router.post('/verify-otp', usersControllers.verifyOtpAndRegisterUser);
router.post('/change/password',authenticate, changePassword);
router.post('/login', usersControllers.login);
router.post('/forgot-password', usersControllers.sendlinkforForgotPassword);
router.post('/resetforgot_password', usersControllers.forgotPasswordrecet);
router.post('/personalDetails', authenticate,usersControllers. personaldetails)
router.put('/update/personaldetails/:id', authenticate,usersControllers. updatePersonalAndBankDetails)

module.exports = router;
