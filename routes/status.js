
const express = require('express');
const router = express.Router();
const {getStudentAllStatus,createStatus,  getAll, getDashboardDetails}= require('../controllers/status');
router.post('/add',createStatus);
router.get('/getById/:studentreferId',getStudentAllStatus)
router.post('/all/:id?',getAll)
router.get('/dashboardDetails/:id',getDashboardDetails)
module.exports = router;
