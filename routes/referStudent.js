
const express = require('express');
const router = express.Router();
const referStudentController = require('../controllers/referStudent');
const {getReferralsByStudentId, addCSV} = require('../controllers/referStudent');

const upload = require('../middlewares/csvmiddleware'); 

router.post('/addcsv', upload.single('file'),addCSV);
router.post('/refer-student', referStudentController.createReferral);
router.get('/studentById/:id', getReferralsByStudentId );
module.exports = router;
