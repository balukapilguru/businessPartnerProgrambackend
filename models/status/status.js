const sequelize = require("../../config/db")
const {DataTypes} = require("sequelize")
 
const status = sequelize.define('status',{
    time:{
        type: DataTypes.DATE
    },
    changedBy:{
        type:DataTypes.INTEGER,
        references: {
            model: 'bppUsers',
            key: 'id',
        },
    },
    currentStatus:{
        type:DataTypes.STRING,
     
 
    },
    referStudentId:{
        type:DataTypes.INTEGER,
        references: {
            model: 'referStudentmodel',
            key: 'id',
        },
    },
    comment:{
        type:DataTypes.STRING
    }
 
})
// status.associate = (models) =>{
//     status.belongsTo(models.referstudentmodel,{
//         foreignKey:'referStudentId',
       
//     })
// }
module.exports = status
 