

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');


module.exports = (sequelize, DataTypes) => {
    const Module = sequelize.define('Module', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
    });
    Module.associate = (models) => {

        Module.belongsToMany(models.Permission, { through: 'PermissionModule' })
        Module.belongsToMany(models.Permission, { through: 'PermissionModule' })
    }
    return Module
}
// module.exports = Module;
