const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require("../../config/db"); // Update this path if necessary

// Initialize the database object
const db = {};

// Attach Sequelize instance to the database object
db.sequelize = sequelize;

// Import models
db.Role = require('../rolesAndPermissions/Role')(sequelize, DataTypes);
db.Module = require('../rolesAndPermissions/Module')(sequelize, DataTypes);
db.Permission = require('../rolesAndPermissions/Permission')(sequelize, DataTypes);
db.RoleModule = require('../rolesAndPermissions/RolePermission')(sequelize, DataTypes);
db.PermissionModule = require('../rolesAndPermissions/PermissionModule')(sequelize, DataTypes);

db.ReferStudentmodel = require('../referStudent'); // Refer Student model
db.Status = require('../status/status'); // Status model
db.Statements = require('../bpp/statements');
db.bppUsers = require('../bpp/users');
db.request = require('../requests')
// Define associations for roles and permissions
db.Role.belongsToMany(db.Permission, { through: 'RolePermission', as: 'permissions' });
db.Permission.belongsToMany(db.Role, { through: 'RolePermission', as: 'roles' });

db.Permission.belongsToMany(db.Module, { through: db.PermissionModule, as: 'modules' });
db.Module.belongsToMany(db.Permission, { through: db.PermissionModule, as: 'permissions' });
db.Statements .belongsTo(db.bppUsers, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});
db.bppUsers.hasMany(db.Statements , {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
// Define associations for ReferStudentmodel and Status
db.ReferStudentmodel.hasMany(db.Status, {
    foreignKey: 'referStudentId',
    as: 'statuses',
});
db.Status.belongsTo(db.ReferStudentmodel, {
    foreignKey: 'referStudentId',
    as: 'referStudent',
});
db.bppUsers.hasMany(db.request, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
  db.request .belongsTo(db.bppUsers, {
    foreignKey: 'userId',
    as: 'user',
    onDelete: 'CASCADE',
});
db.bppUsers.hasMany(db.request, {
    foreignKey: 'changedBy',
    onDelete: 'CASCADE',
  });
  db.request .belongsTo(db.bppUsers, {
    foreignKey: 'changedBy',
    as: 'changedByUser',
    onDelete: 'CASCADE',
});
// Export the database object with models and Sequelize instance
module.exports = db;
