const sequelize = require("../../config/db");
const { DataTypes } = require("sequelize");

const statements = sequelize.define(
    'statements',
    {
        date: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        time: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        action: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        changedBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'bppUsers',
                key: 'id',
            },
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'bppUsers',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        reason: {
            type: DataTypes.STRING,
        },
        studentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'referStudentmodel',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        businessId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'referBusinessModel',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        amount:{
            type:DataTypes.INTEGER,

        },
        commission:{
            type: DataTypes.STRING,
        }
    },
    {
        freezeTableName: true,
        timestamps: true,
    }
);


statements.associate = (models) => {
  
    statements.belongsTo(models.bppUsers, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
    });

  
    statements.belongsTo(models.bppUsers, {
        foreignKey: 'changedBy',
        as: 'changer',
        onDelete: 'CASCADE',
    });

 
    statements.belongsTo(models.referStudentmodel, {
        foreignKey: 'studentId',
        as: 'student',
        onDelete: 'CASCADE',
    });

   
    statements.belongsTo(models.referBusinessModel, {
        foreignKey: 'businessId',
        as: 'business',
        onDelete: 'CASCADE',
    });
};

module.exports = statements;
