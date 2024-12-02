
const express = require('express');
const router = express.Router();
const {getStudentAllStatus,createStatus,  getAll}= require('../controllers/status');
router.post('/add',createStatus);
router.get('/getById/:studentreferId',getStudentAllStatus)
router.get('/all',getAll)
module.exports = router;
