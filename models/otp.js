const { DataTypes } = require('sequelize');
const sequelize = require("../config/db");
const otp = sequelize.define('otp',{
    email: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
})
module.exports = otp