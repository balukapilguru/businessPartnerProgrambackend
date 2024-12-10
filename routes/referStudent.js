
const express = require('express');
const router = express.Router();
const referStudentController = require('../controllers/referStudent');
const {getReferralsByStudentId} = require('../controllers/referStudent');


// const upload = require('../utiles/awsConfig');
const { processCSV } = require('../controllers/csv');
const authenticateBP = require('../middlewares/authmiddlewares');

// Define the route for file upload with authentication middleware
router.post('/upload-csv', authenticateBP,  processCSV);






router.post('/refer-student', referStudentController.createReferral);
// router.put('/updatedstatus/:id', referStudentController.updateReferralStatus);
// router.get('/get-refer-student', referStudentController.getReferrals);
// router.get('/dashboard', referStudentController. getDashboardStats );
// router.get('/referrals/business/:id', referStudentController.getReferralsByBusinessId);
router.get('/studentById/:id', getReferralsByStudentId );
module.exports = router;
