
const express = require('express');
const router = express.Router();
const {getStudentAllStatus,createStatus, updateStatus, getAll}= require('../controllers/status');
router.post('/add',createStatus);
router.get('/getById/:studentreferId',getStudentAllStatus)
router.put('/updateById/:studentreferId',updateStatus)
router.get('/all',getAll)
module.exports = router;
