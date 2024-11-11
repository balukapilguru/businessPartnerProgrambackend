const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');



module.exports = (sequelize, DataTypes) => {
  // Define Permission model
  const Permission = sequelize.define('Permission', {
    // name:DataTypes.STRING,
    all: DataTypes.BOOLEAN,
    canCreate: DataTypes.BOOLEAN,
    canRead: DataTypes.BOOLEAN,
    canUpdate: DataTypes.BOOLEAN,
    canDelete: DataTypes.BOOLEAN
  });
  Permission.associate = (models) => {

    Permission.belongsToMany(models.Module, { through: 'PermissionModule' })
    Permission.belongsToMany(models.Role, { through: 'RolePermission' })
    Permission.belongsToMany(models.Module, { through: 'PermissionModule' })
  }
  return Permission
}

// module.exports = Permission;