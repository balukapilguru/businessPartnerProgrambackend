

const { DataTypes } = require('sequelize');
const sequelize = require("../../config/db");

const db = {}

db.sequelize = sequelize;




db.Role = require('../rolesAndPermissions/Role')(sequelize, DataTypes);
db.Module = require('../rolesAndPermissions/Module')(sequelize, DataTypes);
db.Permission = require('../rolesAndPermissions/Permission')(sequelize, DataTypes);
db.RoleModule = require('../rolesAndPermissions/RolePermission')(sequelize, DataTypes);
db.PermissionModule = require('../rolesAndPermissions/PermissionModule')(sequelize, DataTypes);



// Define associations
const Role = db.Role;
const Module = db.Module;
const Permission = db.Permission
const PermissionModule = db.PermissionModule


// Define associations
Role.belongsToMany(Permission, { through: 'RolePermission' });
Permission.belongsToMany(Role, { through: 'RolePermission' });


Permission.belongsToMany(Module, { through: db.PermissionModule });
Module.belongsToMany(Permission, { through: db.PermissionModule });





module.exports = db;

