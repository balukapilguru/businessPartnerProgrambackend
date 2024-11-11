const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');


module.exports = (sequelize, DataTypes) => {
    const RolePermission = sequelize.define('RolePermission', {
        RoleId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        PermissionId: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    });
    return RolePermission
}
// module.exports = RolePermission;
