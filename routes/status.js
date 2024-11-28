
const express = require('express');
const router = express.Router();
const {getStudentAllStatus,createStatus}= require('../controllers/status');
router.post('/add',createStatus);
router.get('/getById/:studentreferId',getStudentAllStatus)

module.exports = router;
