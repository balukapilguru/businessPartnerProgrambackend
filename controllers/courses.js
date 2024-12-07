
const courses = require('../models/bpp/courses'); 
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
        const { search, page = 1, limit = 10 } = req.query;

        // Parse page and limit as integers
        const pageNumber = parseInt(page, 10);
        const pageSize = parseInt(limit, 10);

        // Calculate offset
        const offset = (pageNumber - 1) * pageSize;

        // Build the where clause for search
        const whereClause = search
            ? {
                  [Op.or]: [
                      { courseName: { [Op.like]: `%${search}%` } },
                      { coursePackage: { [Op.like]: `%${search}%` } },
                  ],
              }
            : {};

        // Fetch courses with pagination, search, and descending order
        const { rows: coursesget, count: totalCourses } = await courses.findAndCountAll({
            where: whereClause,
            limit: pageSize,
            offset,
            order: [["createdAt", "DESC"]], // Order by createdAt in descending order
        });

        // Number of courses retrieved in the current page
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



module.exports = { createCourse,getAllCourses, updateCourse };
