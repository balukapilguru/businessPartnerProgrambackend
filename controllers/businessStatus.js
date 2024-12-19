const referBusinessModel = require('../models/referBusiness');
const { Op , fn, col} = require("sequelize")
const statusModel = require('../models/status/BusinessStatus'); 
const Sequelize = require('../config/db'); 
const bppusers = require('../models/bpp/users');
const dayjs = require('dayjs');
const now = dayjs();
const statements = require('../models/bpp/statements')
const {getFormattedISTDateTime} = require('../utiles/encryptAndDecrypt')
const istDateTime = getFormattedISTDateTime();
const db = require('../models/db/index')
const Role = db.Role;
const Module = db.Module;
const Permission = db.Permission;
const createBusinessStatus = async (req, res) => {
  try {
      const { id, currentStatus,  referbusinessId, comment } = req.body;
        await statusModel.create({
          changedBy: id,
          currentStatus,
          referbusinessId,
          comment,
          date: `${istDateTime.date}`,
          time: `${istDateTime.time}`,

      });

      res.status(200).json({
          message: 'Status changed successfully'
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: 'An error occurred',
          error: error.message
      });
  }
};

const getAllbusiness = async (req, res) => {
  try {
    let { userId } = req.query || '';
    let id = userId;
    const { filter, search, page = 1, limit, pageSize } = req.query;

    let filterStatuses = null;
    let startDate = null;
    let endDate = null;

    const effectiveLimit = parseInt(pageSize || limit || 10);
 const userDetails = await bppusers.findOne({
    where:{
      id:userId
    }
  })
  const role = await Role.findOne({
    where: { id: userDetails.roleId },
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
  console.log(userDetails)
    if (filter) {
      const parsedFilter = JSON.parse(filter);
      filterStatuses = parsedFilter.statuses
        ? parsedFilter.statuses.map((status) => status.trim())
        : null;
      startDate = parsedFilter.startDate ? new Date(parsedFilter.startDate) : null;
      endDate = parsedFilter.endDate ? new Date(parsedFilter.endDate) : null;
    }

    const recentStatuses = await statusModel.findAll({
      attributes: ['referBusinessId', [fn('MAX', col('id')), 'latestId']],
      group: ['referBusinessId'],
      where: {
        ...(startDate && endDate && {
          createdAt: { [Op.between]: [startDate, endDate] },
        }),
      },
    });

    const latestIds = recentStatuses.map((status) => status.dataValues.latestId);

    if (!latestIds.length) {
      return res.status(200).json({
        statuses: [],
        count: {},
        totalRecords: 0,
        totalPages: 0,
        currentPage: page,
      });
    }

    const searchConditions = search
      ? {
          [Op.or]: [
            { fullname: { [Op.like]: `%${search}%` } },
            { phoneNumber: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
            { serviceRequired: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};
      const referStudentFilter =  rolePermissions.Permissions.some(permission => permission.module === 'Refer Business' && permission.canUpdate) ? {} : id != null ? { bpbussiness: id } : {};
      const offset = (page - 1) * effectiveLimit;

    const fullStatuses = await statusModel.findAll({
      where: {
        id: { [Op.in]: latestIds },
        ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
        ...(startDate && endDate && {
          createdAt: { [Op.between]: [startDate, endDate] },
        }),
      },
      include: [
        {
          model: referBusinessModel,
          as: 'referBusiness',
          attributes: [
            'id',
            'fullname',
            'email',
            'phoneNumber',
            'assignedTo',
            'businessPartnerId',
            'description',
            'source',
            'serviceRequired',
          ],
          where: {...searchConditions,
          ...referStudentFilter},
        },
      ],
      offset,
      limit: effectiveLimit,
    });

    const totalRecords = await statusModel.count({
      where: {
        id: { [Op.in]: latestIds },
        ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
        ...(startDate && endDate && {
          createdAt: { [Op.between]: [startDate, endDate] },
        }),
      },
      include: [
        {
          model: referBusinessModel,
          as: 'referBusiness',
          attributes: [],
          where:{ ...searchConditions,
          ...referStudentFilter}
        },
      ],
    });

    const totalPages = Math.ceil(totalRecords / effectiveLimit);

    const statusCount = await statusModel.findAll({
      attributes: [
        'currentStatus',
        [fn('COUNT', col('currentStatus')), 'count'],
      ],
      where: {
        id: { [Op.in]: latestIds },
        ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
        ...(startDate && endDate && {
          createdAt: { [Op.between]: [startDate, endDate] },
        }),
      },
      include: [
        {
          model: referBusinessModel,
          as: 'referBusiness',
          attributes: [],
          where:{ ...searchConditions,
            ...referStudentFilter},
        },
      ],
      group: ['currentStatus'],
      raw: true,
    });

    const statusCountMapping = statusCount.reduce((acc, { currentStatus, count }) => {
      acc[currentStatus] = count;
      return acc;
    }, {});

    return res.status(200).json({
      statuses: fullStatuses,
      count: statusCountMapping,
      totalRecords,
      totalPages,
      currentPage: parseInt(page),
      pageSize: effectiveLimit,
    });
  } catch (error) {
    console.log(error)
    console.error('Database Error:', error);
    return res.status(500).json({ error: 'Database error occurred.' });
  }
};


const getbusinessAllStatus = async (req, res) => {
  try {
      console.log(req.params); 
      const { referbusinessId } = req.params;
      if (!referbusinessId) {
          throw new Error('referbusinessId is undefined');
      }
      const response = await statusModel.findAll({
          where: { referbusinessId },
          order: [['id', 'DESC']],
      });
      res.status(200).json(response);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message || 'An error occurred while fetching the records.' });
  }
};



module.exports = {
  createBusinessStatus,
    getbusinessAllStatus,
    getAllbusiness
}