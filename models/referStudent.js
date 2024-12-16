
const { DataTypes } = require('sequelize');
const sequelize = require("../config/db");



const ReferStudentmodel = sequelize.define("referStudentmodel", {

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
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },

    courseRequired: {
        type: DataTypes.STRING,
        allowNull: false

    },
    source: {
        type: DataTypes.STRING,
    },
    status: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    businessPartnerId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    assignedTo: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'bppUsers',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    bpstudents: {
        type: DataTypes.INTEGER, 
        allowNull: true,
        references: {
          model: 'bppUsers', 
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    time: {
        type: DataTypes.STRING,
        allowNull: false,
    },
}, {

    freezeTableName: true,
    timestamps: true,
}
);
ReferStudentmodel.associate = (models) => {
    ReferStudentmodel.belongsTo(models.bppUsers, {
        foreignKey: 'assignedTo',
        as: 'assignedUser'
    }),


        console.log(models)

        ReferStudentmodel.belongsTo(models.bppUsers, {
            foreignKey: 'bpstudents',
            as: 'bpStudentsUser',
            onDelete: 'CASCADE',
          });


    // ReferStudentmodel.hasMany(models.status, {
    //     foreignKey: 'referStudentId',
       
    // })

}



module.exports = ReferStudentmodel