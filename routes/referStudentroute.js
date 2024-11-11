
const express = require('express');
const router = express.Router();
const referStudentController = require('../controllers/referStudentcontroller');

// Route to create a new referral
router.post('/refer-student', referStudentController.createReferral);
router.put('/updatedstatus/:id', referStudentController.updateReferralStatus);
// Route to get all referrals
router.get('/get-refer-student', referStudentController.getReferrals);


router.get('/referrals/business/:id', referStudentController.getReferralsByBusinessId);

module.exports = router;
