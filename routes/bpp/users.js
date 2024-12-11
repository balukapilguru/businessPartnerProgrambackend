const express = require('express');
const usersControllers = require('../../controllers/users');
const { changePassword, personaldetails } = require('../../controllers/users');
const authenticate = require('../../middlewares/authmiddlewares');

const router = express.Router(); 

router.post('/signup', usersControllers.sendOtp);
router.post('/verify-otp', usersControllers.verifyOtpAndRegisterUser);
router.post('/change/password',authenticate, changePassword);
router.post('/login', usersControllers.login);
router.post('/forgot-password', usersControllers.sendlinkforForgotPassword);
router.post('/resetforgot_password', usersControllers.forgotPasswordrecet);
router.post('/personalDetails/:id',personaldetails)     //the authentication should be there 
router.put('/update/personaldetails/:id',usersControllers. updatePersonalAndBankDetails)
router.get('/getallusersdetails/:id',usersControllers. getPersonalDetailsById )   //the authentication should be there
router.get('/decrypt',usersControllers.decryptfun),
router.get('/decryptFun',usersControllers.decryptfunction),
router.post('/refe-parent', usersControllers. addBusinessPartner);
router.get('/getallbecomeparents/:businessPartnerID', usersControllers. getAllBusinessPartners);
router.post('/userform', usersControllers.createUserlogin);
router.get('/getuserform', usersControllers.getUserLogin);

// router.post('/refe-bp', referaBusinessPartnerController.createBusiness);
module.exports = router;
