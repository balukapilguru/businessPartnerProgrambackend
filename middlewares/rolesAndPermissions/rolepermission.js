const { Role, Module, Permission } = require('../../models/db/index'); // Assuming your models are exported from a file named 'models'

const hasPermission = (moduleName, permissionName) => {
    return async (req, res, next) => {
        try {
            const id = +req?.params?.id ?? null;
            console.log(req.user, id, "checkin", req.body);

            const { userId, roleId } = req.user;

            if (!roleId) {
                return res.status(403).json({ message: 'Role not found' });
            }

            if (id === userId) {
                return next();
            }

            const role = await Role.findOne({
                where: { id: roleId },
                include: [{
                    model: Permission,
                    as: 'permissions', 
                    include: [{
                        model: Module,
                        as: 'modules',
                    }],
                }],
            });

            if (!role) {
                return res.status(403).json({ message: 'Role not found' });
            }

            let permissionFound = false;

            console.log("Role permissions and modules:", role.permissions);

            for (const permission of role.permissions) {
                if (permission[permissionName]) {
                    if (permission.modules && permission.modules.some(module => module.name === moduleName)) {
                        permissionFound = true;
                        break;
                    } else {
                        console.log(`Module "${moduleName}" not accessible.`);
                    }
                } else {
                    console.log(`Permission "${permissionName}" not found.`);
                }
            }

            console.log(permissionFound, "permission found");

            if (!permissionFound) {
                return res.status(403).json({ message: `Permission '${permissionName}' or module '${moduleName}' not found for this role` });
            }

            // If permission is found, proceed to the next middleware
            next();
        } catch (error) {
            console.error('Error in hasPermission middleware:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
};

module.exports = hasPermission;
