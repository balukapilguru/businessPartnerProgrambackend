const express = require('express');
const router = express.Router();
const { getAllStatements, getUserStatements}= require('../controllers/statements');

router.get('/all',getAllStatements)
router.get('/userAll/:userId',getUserStatements)
module.exports = router;