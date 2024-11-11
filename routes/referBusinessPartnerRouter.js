


const express = require('express');
const router = express.Router();
const referaBusinessPartnerController = require('../controllers/referaBusinessPartnerController');

router.post('/refer-Business-partner', referaBusinessPartnerController.createBusiness);
router.put('/updatedbusinesstatus-p/:id', referaBusinessPartnerController.updateReferralStatus);

router.get('/get-refer-business-p', referaBusinessPartnerController.getReferrals);

router.get('/referrals/business-p/:id', referaBusinessPartnerController.getReferralsByBusinessId);

module.exports = router;