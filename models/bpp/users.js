
const sequelize = require("../../config/db")
const {DataTypes} = require("sequelize")


    const bppUsers = sequelize.define(
      'bppUsers',
      {
        fullName: {
          type: DataTypes.STRING,
        },
        email: {
          type: DataTypes.STRING,
        },
        phonenumber: {
          type: DataTypes.STRING,
        },
        roleId:{
          type: DataTypes.INTEGER,
        }
      },
      {
        freezeTableName: true,
        timestamps: true,
      }
    );
  
    bppUsers.associate = (models) => {
      bppUsers.hasOne(models.Personaldetails, {
        foreignKey: 'profileId',
        onDelete: 'CASCADE',
      });
  
      bppUsers.hasOne(models.credentialDetails, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
  
      bppUsers.hasOne(models.bankDetails, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      bppUsers.hasMany(models.statements, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
      });
      bppUsers.hasMany(models.statements, {
        foreignKey: 'changedBy',
        onDelete: 'CASCADE',
        as: 'changesMade',
      });
    };
  
module.exports = bppUsers