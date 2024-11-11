const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');


module.exports = (sequelize, DataTypes) => {
    const PermissionModule = sequelize.define('PermissionModule', {
        PermissionId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        ModuleId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
    return PermissionModule
}
// module.exports = PermissionModule;

