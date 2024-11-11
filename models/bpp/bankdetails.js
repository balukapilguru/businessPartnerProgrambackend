
const {DataTypes} = require("sequelize")
const sequelize = require("../../config/db")

const bankDetails = sequelize.define("bankDetails",{
  bankName:{
    type : DataTypes.STRING
  },
    holder_name:{
        type : DataTypes.STRING

    },
    account_no:{
        type : DataTypes.STRING
    },
    ifsc_code:{
        type:DataTypes.STRING
    },
    branch:{
        type :DataTypes.STRING
    },
    userId: {
        type: DataTypes.INTEGER,
        references:{
            model: 'bppUsers',
            key: 'id',
        },
        onDelete: 'CASCADE'
    },


})



bankDetails.associate = (models) =>{
    bankDetails.belongsTo(models.bppUsers, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
    })
}

module.exports = bankDetails