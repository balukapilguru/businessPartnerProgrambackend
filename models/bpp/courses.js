const { DataTypes } = require("sequelize");
const sequelize = require("../../config/db")

const courses = sequelize.define('courses',{
   courseName:{
    type:DataTypes.STRING,
    allowNull:false
    
},
coursePackage:{
    type:DataTypes.STRING,
    allowNull:false
}


},{
    freezeTableName:true,
})







module.exports= courses;