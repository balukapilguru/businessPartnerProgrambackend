const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');


module.exports = (sequelize, DataTypes) => {
    const Role = sequelize.define('Role', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false
        },
        selectedDashboard: {
            type: DataTypes.STRING,
            allowNull: true
        },
        createdBy: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });
    Role.associate = (models) => {
        Role.hasMany(models.bppUsers,{
            foreignKey:'roleId',
            
    
          });
        Role.belongsToMany(models.Permission, { through: 'RolePermission' })
    }
    return Role
}
// module.exports = Role;
