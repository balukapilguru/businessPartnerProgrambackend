



const express = require('express');
const router = express.Router();
const courses = require('../../controllers/courses');

router.post('/add', courses.createCourse);
router.get('/getall', courses.getAllCourses);
router.put('/updatecourses/:id', courses.updateCourse);
router.delete('/deletecourse/:id', courses.deleteCourse);


module.exports = router;