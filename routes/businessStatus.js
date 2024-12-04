const express = require('express');
const router = express.Router();
const { createBusinessStatus, getAllbusiness,getbusinessAllStatus } = require('../controllers/businessStatus');

router.post('/create', createBusinessStatus,); 
router.get('/all', getAllbusiness);
router.get('/getById/:referbusinessId',getbusinessAllStatus)

module.exports = router;
