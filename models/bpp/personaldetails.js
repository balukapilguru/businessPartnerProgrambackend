

const { DataTypes } = require("sequelize")
const sequelize = require("../../config/db")

const Personaldetails = sequelize.define("personaldetails", {

    address: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    panCardNO:{
        type: DataTypes.STRING,
    },
    contactNo: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{10}$/
        }
    },


    whatapp_no: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            is: /^\d{10}$/
        }
    },

 aadharNo:{
    type: DataTypes.STRING,
 },

    businessName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    image:{
        type: DataTypes.STRING,
    },
    wallet:{
        type: DataTypes.STRING,
        allowNull: true,
    },
      cin_no: {
        type: DataTypes.STRING,
        allowNull: true,
    },

    gst_no: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    profileId: {
        type: DataTypes.INTEGER,
        references: {
            model: 'bppUsers',
            key: 'id',
        },
        allowNull: true,
        onDelete: 'CASCADE',
    },

},
{
    freezeTableName: true,
    timestamps: true
})


Personaldetails.associate = (models) => {
    Personaldetails.belongsTo(models.bppUsers, {
        foreignKey: 'profileId',
        onDelete: 'CASCADE',
    });
};
module.exports = Personaldetails



