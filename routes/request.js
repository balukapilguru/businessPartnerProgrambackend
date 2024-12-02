const express = require('express');

const router = express.Router();
const {createRequest, getAllRequests, getUserRequests} = require('../controllers/request')
router.post('/add',createRequest);
router.get('/all',getAllRequests);
router.get('/allUserId/:userId',getUserRequests)
module.exports = router;