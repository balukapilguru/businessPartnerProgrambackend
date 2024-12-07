
const sequelize = require("../../config/db")
const {DataTypes} = require("sequelize")
const ReferStudentmodels = require('../referStudent')

const StudentCourses = sequelize.define('StudentCourses', {
    studentId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'referStudentmodel', // Your ReferStudentmodel table name
            key: 'id'
        }
    },
    courseId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'courses', // Your courses table name
            key: 'id'
        }
    }
},{
    freezeTableName:true
});

module.exports = StudentCourses

