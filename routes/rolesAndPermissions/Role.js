const express = require('express');
const router = express.Router();
const roleController = require('../../controllers/rolesAndPermissions/role');

const authenticate = require('../../middlewares/authenticateuser');

// Apply authentication middleware to protect the routes


router.post('/create-role', roleController.createRoleWithPermissions);

router.put('/update-role/:roleId', roleController.updateRoleWithPermissions)
router.post('/getroles', roleController.getAllRoles)
router.delete('/deleteRole/:roleId', roleController.deleteRoleById)
router.get('/getrolebyid/:roleId', roleController.getRolePermissionsById)
module.exports = router;
