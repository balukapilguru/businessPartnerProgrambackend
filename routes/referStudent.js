
const express = require('express');
const router = express.Router();
const referStudentController = require('../controllers/referStudent');
const {getReferralsByStudentId} = require('../controllers/referStudent');
router.post('/refer-student', referStudentController.createReferral);
// router.put('/updatedstatus/:id', referStudentController.updateReferralStatus);
// router.get('/get-refer-student', referStudentController.getReferrals);
// router.get('/dashboard', referStudentController. getDashboardStats );
// router.get('/referrals/business/:id', referStudentController.getReferralsByBusinessId);
router.get('/studentById/:id', getReferralsByStudentId );
module.exports = router;
