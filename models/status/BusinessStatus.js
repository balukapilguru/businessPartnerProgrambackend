const sequelize = require("../../config/db")
const {DataTypes} = require("sequelize")
 
const businessStatus = sequelize.define('businessStatus',{
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
    referbusinessId:{
        type:DataTypes.INTEGER,
        references: {
            model: 'referBusinessModel',
            key: 'id',
        },
    },
    comment:{
        type:DataTypes.STRING
    }
 
})

module.exports = businessStatus
 