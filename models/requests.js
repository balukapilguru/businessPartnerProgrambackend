const sequelize = require("../config/db")
const {DataTypes} = require("sequelize")
const request = sequelize.define('request',{
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
})
module.exports = request