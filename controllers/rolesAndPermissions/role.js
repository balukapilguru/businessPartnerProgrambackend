 
require('dotenv').config();
const db = require('../../models/db/index');
const mycon = require('../../config/db')
const { Op, Sequelize } = require('sequelize');
const Role = db.Role;
const Module = db.Module;
const Permission = db.Permission;
const Users = db.users;
 
 
// const createRoleWithPermissions = async (req, res) => {
//   try {
//     const { role, description,selectedDashboard, permissions, createdBy } = req.body;
//     // Create the role entry
//     console.log(req.body, "body")
//     const existingUser = await db.Role.findOne({ where: { name: role } });
//     if (existingUser) {
//       console.error("name already exists.");
//       return res.status(400).json({exist: "Name Already Exists"});
//     }
//     const newRole = await Role.create({
//       name: role,
//       description: description,
//       selectedDashboard: selectedDashboard,
//       createdBy: createdBy
//     });
   
//     for (const permissionData of permissions) {
//       const { module, all, canCreate, canRead, canUpdate, canDelete: del } = permissionData;
   
//       const [newModule, created] = await Module.findOrCreate({
//         where: { name: module }
//       });
 
//       const newPermission = await Permission.create({
//         all,
//         canCreate,
//         canRead,
//         canUpdate,
//         canDelete: del
//       });
   
//       await newPermission.addModule(newModule);
   
//       await newRole.addPermission(newPermission);
//     }
//     return res.status(201).json({ message: 'Role created successfully' });
//   } catch (error) {
//     console.error('Error creating role:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };
// createRoleWithPermissions function
const createRoleWithPermissions = async (req, res) => {
  try {
      const { role, description, selectedDashboard, permissions, createdBy } = req.body;
      console.log(req.body, "body");
     
      // Check if the role already exists
      const existingUser = await db.Role.findOne({ where: { name: role } });
      if (existingUser) {
          console.error("Name already exists.");
          return res.status(400).json({ exist: "Name Already Exists" });
      }
 
      // Create the new role
      const newRole = await Role.create({
          name: role,
          description: description,
          selectedDashboard: selectedDashboard,
          createdBy: createdBy
      });
 
      // Loop through permissions and associate them
      for (const permissionData of permissions) {
          const { module, all, canCreate, canRead, canUpdate, canDelete: del } = permissionData;
         
          // Find or create the module
          const [newModule, created] = await Module.findOrCreate({
              where: { name: module }
          });
 
          // Create new permission
          const newPermission = await Permission.create({
              all,
              canCreate,
              canRead,
              canUpdate,
              canDelete: del
          });
         
          // Associate permission with module and role
          await newPermission.addModule(newModule);
          await newRole.addPermission(newPermission);
      }
 
      return res.status(201).json({ message: 'Role created successfully' });
  } catch (error) {
      console.error('Error creating role:', error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};
 
 
 
const getAllRoles = async (req, res) => {
  try {
      const { page, pageSize, search, filter } = req.body;
      const parsedPage = parseInt(page, 10) || 1;
      const parsedPageSize = parseInt(pageSize, 10) || 10;
      const searchQuery = search || '';
      // const { fromDate, toDate } = filter || {};
 
      const whereClause = {
          [Op.or]: [
              { name: { [Op.like]: `%${searchQuery}%` } },
              { description: { [Op.like]: `%${searchQuery}%` } }
          ]
      };
 
      // if (fromDate && toDate) {
      //     whereClause.date = {
      //         [Op.between]: [fromDate, toDate]
      //     };
      // }
      const roleDate = await Role.findAll({
        attributes: ['name'], // Include 'date' attribute
      });
 
      const roleNames = roleDate.map(role => role.name)
      // console.log("roleNames", roleNames)
      const { count, rows: searchres } = await Role.findAndCountAll({
          // attributes: ['id', 'name', 'email', 'phone', 'city', 'date'], // Include 'date' attribute
          where: whereClause,
          offset: (parsedPage - 1) * parsedPageSize,
          limit: parsedPageSize
      });
 
      const roles = searchres.reverse();
      const totalRoles = await Role.count();
      const totalPages = Math.ceil(count / parsedPageSize);
      const startLead = (parsedPage - 1) * parsedPageSize + 1;
      const endLead = Math.min(parsedPage * parsedPageSize, count);
 
      return res.status(200).json({
          roles,
          totalRoles,
          searchResultStudents: count,
          totalPages,
          currentPage: parsedPage,
          pageSize: parsedPageSize,
          startLead,
          endLead,
          roleNames
         
      });
  } catch (error) {
      console.error('Error fetching students:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
  }
};
 
 
const List_Pub = async (req, res) => {
  const { search = '', page = 1, pageSize = 5, sortBy = 'createdAt', ...restQueries } = req.query;
  const filters = {};
  for (const key in restQueries) {
    filters[key] = restQueries[key];
 
  }
  const offset = (parseInt(page) - 1) * (parseInt(pageSize));
 
  // MySQL query to fetch paginated users
 
  let sql = `SELECT * FROM Roles WHERE (name LIKE '%${search}%')`;
 
  // Add conditions for additional filter fields
 
  for (const [field, value] of Object.entries(filters)) {
 
    if (value !== '') {
 
      sql += ` AND ${field} LIKE '%${value}%'`; // Add the condition
 
    }
 
  }
  mycon.query(sql, [offset, pageSize], (err, result) => {
 
    if (err) {
 
      console.error('Error executing MySQL query: ' + err.stack);
 
      res.status(500).json({ error: 'Internal server error' });
 
      return;
    }
 
    // Execute the count query to get the total number of users
 
    let sqlCount = `SELECT COUNT(*) as total FROM Roles WHERE (name LIKE '%${search}%')`;
 
    // Add conditions for additional filter fields
 
    for (const [field, value] of Object.entries(filters)) {
 
      if (value !== '') {
 
        sqlCount += ` AND ${field} LIKE '%${value}%'`;
 
      }
 
    }
 
    mycon.query(sqlCount, (err, countResult) => {
 
      if (err) {
 
        console.error('Error executing MySQL count query: ' + err.stack);
 
        res.status(500).json({ error: 'Internal server error' });
 
        return;
 
      }
 
      const totalUsers = countResult[0].total;
 
      const totalPages = Math.ceil(totalUsers / pageSize);
 
      const final = result.map(item => { return { name: item.name, id: item.id } });
      res.json({
 
        roles: final,
 
        totalPages: totalPages,
 
        currentPage: page,
 
        pageSize: pageSize,
 
        totalRoles: totalUsers,
 
        startRoles: offset,
 
        endRoles: offset + pageSize,
 
        search
 
      });
 
    });
 
  });
 
};
 
 
const getRolePermissionsById = async (req, res) => {
  try {
    const { roleId } = req.params;
 
    const role = await Role.findOne({
      where: { id: roleId },
      include: [{
        model: Permission,
        as: 'permissions',
        include: [{
          model: Module,
          as: 'modules',
          attributes: ['name']
        }],
        attributes: ['all', 'canCreate', 'canRead', 'canUpdate', 'canDelete']
      }]
    });
 
    if (!role) {
      return res.status(404).json({ error: "Role not found." });
    }
 
    const rolePermissions = {
      id: role.id,
      name: role.name,
      description: role.description,
      selectedDashboard: role.selectedDashboard,
      Permissions: role.permissions.map(permission => ({
        module: permission.modules.length ? permission.modules[0].name : null,
        all: permission.all,
        canCreate: permission.canCreate,
        canRead: permission.canRead,
        canUpdate: permission.canUpdate,
        canDelete: permission.canDelete,
      }))
    };
 
    res.status(200).json({ role: rolePermissions });
  } catch (error) {
    console.error('Error getting role permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
 
 
 
 
const notifyUserLogout = async (userId, message) => {
  try {
    // Here, you would implement the logic to send a notification to the user with the given userId
    // This could be sending an email, a push notification, or any other form of notification
    console.log(`Sending notification to user ${userId}: ${message}`);
    // Example: sendEmail(userId, 'Logout Notification', message);
    // Example: sendPushNotification(userId, message);
  } catch (error) {
    console.error(`Error notifying user ${userId} about logout:`, error);
  }
};
 
// Function to invalidate user session or token
const invalidateUserSession = async (userId) => {
  try {
    // Here, you would implement the logic to invalidate the session or token for the user with the given userId
    // This could involve deleting the user's session data, blacklisting their token, etc.
    console.log(`Invalidating session or token for user ${userId}`);
    // Example: deleteSessionData(userId);
    // Example: blacklistToken(userId);
  } catch (error) {
    console.error(`Error invalidating session or token for user ${userId}:`, error);
  }
};
 
 
 
const updateRoleWithPermissions = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { role, description,selectedDashboard, permissions } = req.body;
 
    // Find the role to update
    const existingRole = await Role.findOne({
      where: { id: roleId },
      include: [{
        model: Permission,
    as: 'permissions',                    
        include: [{
          model: Module,
    as: 'modules',                        
          attributes: ['name']
        }],
        attributes: ['id', 'all', 'canCreate', 'canRead', 'canUpdate', 'canDelete']
      }]
    });
 
    if (!existingRole) {
      return res.status(200).json({ error: 'Role not found' });
    }
 
    const roleName = existingRole.name;
    const roleidd = existingRole.id;
    console.log(roleidd)
console.log(existingRole.Permissions)
console.log(existingRole.permissions)
    // Check if any permissions have been updated
    const permissionsUpdated = permissions.some(permissionData => {
      const existingPermission = existingRole.permissions.find(permission => {
        // Ensure modules array exists and has elements before accessing modules[0].name
        return permission.modules && permission.modules.length > 0 && permission.modules[0].name === permissionData.module;
      });
   
      if (existingPermission) {
        return (
          existingPermission.all !== permissionData.all ||
          existingPermission.canCreate !== permissionData.canCreate ||
          existingPermission.canRead !== permissionData.canRead ||
          existingPermission.canUpdate !== permissionData.canUpdate ||
          existingPermission.canDelete !== permissionData.canDelete
        );
      }
   
      return true; // New permission detected
    });
   
    // If permissions have been updated, find users with the updated role
    if (permissionsUpdated) {
      const usersWithUpdatedRole = await db.bppUsers.findAll({ where: { roleId: roleidd } });
 
      // Invalidate sessions or tokens for users with the updated role
      usersWithUpdatedRole.forEach(async user => {
        await invalidateUserSession(user.id);
      });
 
      // Notify users about the logout due to role update
      usersWithUpdatedRole.forEach(user => {
        notifyUserLogout(user.id, 'Your role permissions have been updated. Please log in again.');
      });
    }
 
    // Update role details
    existingRole.name = role;
    existingRole.description = description;
    existingRole.selectedDashboard = selectedDashboard;
    await existingRole.save();
 
    // Process each permission
    for (const permissionData of permissions) {
      const { module, all, canCreate, canRead, canUpdate, canDelete: del } = permissionData;
   
      // Find existing module or create a new one
      const [newModule] = await Module.findOrCreate({
        where: { name: module }
      });
   
      // Find existing permission if it exists
      const existingPermission = existingRole.permissions.find(permission => {
        // Check if modules exist and have at least one element
        return permission.modules && permission.modules.length > 0 && permission.modules[0].name === module;
      });
   
      if (existingPermission) {
        // Update existing permission
        existingPermission.all = all;
        existingPermission.canCreate = canCreate;
        existingPermission.canRead = canRead;
        existingPermission.canUpdate = canUpdate;
        existingPermission.canDelete = del;
        await existingPermission.save();
      } else {
        // Create a new permission and associate it with the module and role
        const newPermission = await Permission.create({
          all,
          canCreate,
          canRead,
          canUpdate,
          canDelete: del
        });
        await newPermission.addModule(newModule);
        await existingRole.addPermission(newPermission);
      }
    }
   
    res.status(200).json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
 
 
 
 
// const updateRoleWithPermissions = async (req, res) => {
//   try {
//     const { roleId } = req.params;
//     const { role, description,selectedDashboard, permissions } = req.body;
 
//     // Find the role to update
//     const existingRole = await Role.findOne({
//       where: { id: roleId },
//       include: [{
//         model: Permission,
//         as: 'permissions', // Specify the alias explicitly
//         include: [{
//           model: Module,
//           as: 'modules', // Specify the alias explicitly
//           attributes: ['name']
//         }],
//         attributes: ['id', 'all', 'canCreate', 'canRead', 'canUpdate', 'canDelete']
//       }]
//     });
 
//     if (!existingRole) {
//       return res.status(200).json({ error: 'Role not found' });
//     }
 
//     // Update role details
//     existingRole.name = role;
//     existingRole.description = description;
//     existingRole.selectedDashboard = selectedDashboard;
//     await existingRole.save();
 
//     // Process permissions
//     for (const permissionData of permissions) {
//       const { module, all, canCreate, canRead, canUpdate, canDelete: del } = permissionData;
 
//       // Find or create the module
//       const [newModule] = await Module.findOrCreate({
//         where: { name: module }
//       });
 
//       // Check if permission exists
//       const existingPermission = existingRole.permissions.find(
//         permission => permission.modules[0]?.name === module
//       );
 
//       if (existingPermission) {
//         // Update existing permission
//         existingPermission.all = all;
//         existingPermission.canCreate = canCreate;
//         existingPermission.canRead = canRead;
//         existingPermission.canUpdate = canUpdate;
//         existingPermission.canDelete = del;
//         await existingPermission.save();
//       } else {
//         // Create new permission and associate it
//         const newPermission = await Permission.create({
//           all,
//           canCreate,
//           canRead,
//           canUpdate,
//           canDelete: del
//         });
//         await newPermission.addModule(newModule);
//         await existingRole.addPermission(newPermission);
//       }
//     }
 
//     res.status(200).json({ message: 'Role updated successfully' });
//   } catch (error) {
//     console.error('Error updating role:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };
 
 
const deleteRoleById = async (req, res) => {
  try {
    const { roleId } = req.params;
 
    // Check if the role exists
    const role = await Role.findByPk(roleId);
 
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }
 
    // Find all permissions associated with the role
    const permissions = await role.getPermissions();
 
    // Delete all permissions associated with the role
    await role.removePermissions(permissions);
 
    // Delete permissions themselves
    await Promise.all(permissions.map(permission => permission.destroy()));
 
    // Finally, delete the role
    await role.destroy();
 
    res.status(200).json({ message: 'Role and associated permissions deleted successfully' });
  } catch (error) {
    console.error('Error deleting role and associated permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
 
 
module.exports = { createRoleWithPermissions, updateRoleWithPermissions, getAllRoles, deleteRoleById, getRolePermissionsById, List_Pub };
 
 