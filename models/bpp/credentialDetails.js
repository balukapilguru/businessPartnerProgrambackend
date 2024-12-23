

const sequelize = require("../../config/db")
const {DataTypes} = require("sequelize")
const credentialDetails = sequelize.define(
    'credentialDetails',
    {
        password: {
            type: DataTypes.STRING,
        },
        businessPartnerID: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            references: {
                model: 'bppUsers',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        createdBy: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'bppUsers',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
        addedBy: {
            type: DataTypes.STRING,
            allowNull: true,
          
        },
        noOfLogins: {
            type: DataTypes.INTEGER,
            
        },
        noOfLogouts: {
            type: DataTypes.INTEGER,
        
        },
        referralLink: {
            type: DataTypes.STRING,
        },
        
        businessReferralLink: {
            type: DataTypes.STRING,
        },
        isParentPartner:{
            type: DataTypes.BOOLEAN
        },
        encryptedBPID:{
            type: DataTypes.STRING
        },
        BpStatus:{
            type:DataTypes.STRING,
            allowNull:true,
        },
        comment:{
            type:DataTypes.STRING,
            allowNull:true
        }
    },
    {
        freezeTableName: true,
        timestamps: true,
    }
);

credentialDetails.associate = (models) => {
    credentialDetails.belongsTo(models.bppUsers, {
        foreignKey: 'userId',
        onDelete: 'CASCADE',
    });

   
};

module.exports =  credentialDetails
   
