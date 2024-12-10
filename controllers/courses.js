
const courses = require('../models/bpp/courses'); 
const studentcourses = require('../models/bpp/studentcourses')
const { Op } = require("sequelize");

const createCourse = async (req, res) => {
    try {
        const { courseName, coursePackage } = req.body;

       
        if (!courseName || !coursePackage) {
            return res.status(400).json({ message: 'courseName and coursePackage are required.' });
        }

        // Create the course
        const newCourse = await courses.create({
            courseName,
            coursePackage,
        });

        return res.status(201).json({
            message: 'Course created successfully.',
            data: newCourse,
        });
    } catch (error) {
        console.error('Error creating course:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};


const getAllCourses = async (req, res) => {
    try {
        const { search, page = 1, pageSize  } = req.query;

    
        const pageNumber = parseInt(page, 10);
        const pagelimit = parseInt(pageSize, 10);

       
        const offset = (pageNumber - 1) * pageSize;

   
        const whereClause = search
            ? {
                  [Op.or]: [
                      { courseName: { [Op.like]: `%${search}%` } },
                      { coursePackage: { [Op.like]: `%${search}%` } },
                  ],
              }
            : {};

       
        const { rows: coursesget, count: totalCourses } = await courses.findAndCountAll({
            where: whereClause,
            limit: pagelimit,
            offset,
            order: [["createdAt", "DESC"]], 
        });


        const numberOfCourses = coursesget.length;

        return res.status(200).json({
            message: "Courses retrieved successfully.",
            data: coursesget,
            pagination: {
                totalCourses,
                pageSize,
                numberOfCourses,
                totalPages: Math.ceil(totalCourses / pageSize),
                currentPage: pageNumber,
            },
        });
    } catch (error) {
        console.error("Error retrieving courses:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};




const getCourseById = async (req, res) => {
    try {
        
        const { id } = req.params;

        
        const course = await courses.findOne({
            where: { id }, 
        });

       
        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        
        return res.status(200).json({
            message: "Course retrieved successfully",
            data: course,
        });
    } catch (error) {
        console.error("Error retrieving course by ID:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};


const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const { courseName, coursePackage } = req.body;

      
        const courseupdate = await courses.findByPk(id);

        if (!courseupdate) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        courseupdate.courseName = courseName || course.courseName;
        courseupdate.coursePackage = coursePackage || course.coursePackage;

        await courseupdate.save();

        return res.status(200).json({
            message: 'Course updated successfully.',
            data: courseupdate,
        });
    } catch (error) {
        console.error('Error updating course:', error);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
};

const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await courses.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found." });
        }
        const deletedStudentCourses = await studentcourses.destroy({
            where: { courseId: id }
        });

        if (deletedStudentCourses === 0) {
            return res.status(400).json({
                message: "No student-course records found to delete for this course."
            });
        }

        await course.destroy();

        return res.status(200).json({ message: "Course and associated student-course records deleted successfully." });
    } catch (error) {
        console.error("Error deleting course:", error);
        return res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};




module.exports = { createCourse,getAllCourses, updateCourse ,deleteCourse, getCourseById};
