
const { DataTypes } = require('sequelize');
const sequelize = require("../config/db");
const moment = require('moment-timezone');

const ReferBusinessModel = sequelize.define("referBusinessModel",{

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
    description:{
        type: DataTypes.STRING,
        allowNull: false
    },
 
    serviceRequired:{
        type: DataTypes.STRING,
        allowNull: false

    },
    source:{
        type: DataTypes.STRING,  
    },
   
    status:{
        type: DataTypes.JSON,
        defaultValue:[]
    },
    businessPartnerId:{
        type: DataTypes.STRING,
        allowNull: false,
    },
    assignedTo:{
        type: DataTypes.INTEGER,
        allowNull:true,
        references:{
            model: 'bppUsers',
            key:'id'
        },
        onDelete: 'CASCADE'
    },
    bpbussiness: {
        type: DataTypes.INTEGER, 
        allowNull: true,
        references: {
          model: 'bppUsers', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
},{

    freezeTableName: true,
        timestamps: true,
    getterMethods: {
        createdAt() {
            return moment(this.getDataValue('createdAt')).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        },
        updatedAt() {
            return moment(this.getDataValue('updatedAt')).tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        }
    }
});
ReferBusinessModel.associate = (models) =>{
    ReferBusinessModel.belongsTo(models.bppUsers,{
        foreignKey: 'assignedTo',
        as: 'assignedUser'
    }),
    ReferBusinessModel.belongsTo(models.bppUsers,{
        foreignKey: 'bpbussiness',
        as: 'business'
    })
  }


module.exports = ReferBusinessModel