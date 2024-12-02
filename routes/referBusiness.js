


const express = require('express');
const router = express.Router();
const referbusinessController = require('../controllers/referbusiness');
router.post('/refer-Business', referbusinessController.createBusiness);
router.put('/updatedbusinesstatus/:id', referbusinessController.updateReferralStatus);
router.get('/get-refer-business', referbusinessController.getReferrals);
router.get('/referrals/business/:id', referbusinessController.getReferralsByBusinessId);

module.exports = router;