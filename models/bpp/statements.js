const sequelize = require("../../config/db");
const { DataTypes } = require("sequelize");

const statements = sequelize.define(
    'statements',
    {
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        time: {
            type: DataTypes.TIME,
            allowNull: false,
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
                model: 'ReferStudentmodel',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        businessId: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'ReferBusinessModel',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
    },
    {
        freezeTableName: true,
        timestamps: true,
    }
);

// Correcting associations
statements.associate = (models) => {
    // Associate with bppUsers for userId
    statements.belongsTo(models.bppUsers, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
    });

    // Associate with bppUsers for changedBy with alias
    statements.belongsTo(models.bppUsers, {
        foreignKey: 'changedBy',
        as: 'changer',
        onDelete: 'CASCADE',
    });

    // Associate with referStudentmodel
    statements.belongsTo(models.referStudentmodel, {
        foreignKey: 'studentId',
        as: 'student',
        onDelete: 'CASCADE',
    });

    // Associate with referBusinessModel
    statements.belongsTo(models.referBusinessModel, {
        foreignKey: 'businessId',
        as: 'business',
        onDelete: 'CASCADE',
    });
};

module.exports = statements;
