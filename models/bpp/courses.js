const { DataTypes } = require("sequelize");
const { sequelize } = require("../db");

const courses = sequelize.define('courses',{
   

courseName:{
    type:DataTypes.STRING,
    defaultValue:true
    
},
coursePackage:{
    type:DataTypes.STRING,
    defaultValue:true
}


},{
    freezeTableName:true,
})

module.exports= courses;