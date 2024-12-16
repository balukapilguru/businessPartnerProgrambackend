const sequelize = require("../config/db")
const {DataTypes} = require("sequelize")
const request = sequelize.define('request',{
    date: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    time: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    updatedDate: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    updatedTime: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    amount:{
        type: DataTypes.INTEGER
    },
    userId:{
        type: DataTypes.INTEGER,
        references:{
            model: 'bppUsers',
            key: 'id',
        },
    },
    status:{
        type: DataTypes.STRING,
    },
    changedBy:{
        type:DataTypes.INTEGER,
        references: {
            model: 'bppUsers',
            key: 'id',
        },
        allowNull:true
    },
    commission:{
        type: DataTypes.STRING,
        allowNull: true
    }
})
module.exports = request