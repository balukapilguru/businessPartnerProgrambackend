
const { DataTypes } = require('sequelize');
const sequelize = require("../config/db");
const moment = require('moment-timezone');

const ReferbusinessPartnerModel = sequelize.define("referbusinessPartnerModel",{

    fullname: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
 
        validate: {
          isEmail: true
        }
    },
    phonenumber: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{10}$/
        }
    },
   
    parentbusinessPartnerId:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    source:{
        type: DataTypes.STRING,  
    },
    assignedTo:{
        type: DataTypes.INTEGER,
    }
},{

    timestamps: true,
    getterMethods: {
        createdAt() {
            return moment(this.getDataValue('createdAt')).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        },
        updatedAt() {
            return moment(this.getDataValue('updatedAt')).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        }
    }
})

module.exports = ReferbusinessPartnerModel