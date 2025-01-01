
const express = require('express');
const router = express.Router();
const {getStudentAllStatus,createStatus,  getAll, getDashboardDetails,getAllBpAndStudents,getBusinessPartnersCount}= require('../controllers/status');
router.post('/add',createStatus);
router.get('/getById/:studentreferId',getStudentAllStatus)
router.get('/all',getAll)
router.get('/dashboardDetails/:id',getDashboardDetails)
router.get('/getbpp/:userId', getAllBpAndStudents)
router.get('/getbppcount', getBusinessPartnersCount)
 
 
module.exports = router;
