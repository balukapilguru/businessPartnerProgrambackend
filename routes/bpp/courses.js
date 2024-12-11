



const express = require('express');
const router = express.Router();
const courses = require('../../controllers/courses');

router.post('/add', courses.createCourse);
router.get('/getall', courses.getAllCourses);
router.get('/getcoursesby/:id', courses.getCourseById);
router.get('/getAllCoursesPagination',courses.getAllCoursesPagination)
router.put('/updatecourses/:id', courses.updateCourse);
router.delete('/deletecourse/:id', courses.deleteCourse);


module.exports = router;