// status.js
const referStudentmodel = require('../models/referStudent');
const { Op , fn, col,literal} = require("sequelize")
const statusModel = require('../models/status/status');
const sequelize = require('../config/db');
const bppusers = require('../models/bpp/users');
const dayjs = require('dayjs');
const now = dayjs();
const statements = require('../models/bpp/statements');
const credentialDetails = require('../models/bpp/credentialDetails');
const coursesModel = require('../models/bpp/courses')
const db = require('../models/db/index')
const Role = db.Role;
const Module = db.Module;
const Permission = db.Permission;
const {getFormattedISTDateTime} = require('../utiles/encryptAndDecrypt')
const istDateTime = getFormattedISTDateTime();
const createStatus = async (req, res) => {
  try {
      const { id, currentStatus, referStudentId, comment } = req.body;
 console.log(req.body)
      if (currentStatus === 'enroll') {
        const referstudent = await referStudentmodel.findOne({
          where :{id: referStudentId}
        })
        console.log(referstudent)
         const user = await credentialDetails.findOne({
          where :{
            userId: referstudent.bpstudents
          }
         })
 console.log(user?.createdBy)
 console.log(user)
         if(user?.createdBy){
          console.log('user.id',user.createdBy);
          await statements.create({
            date: `${getFormattedISTDateTime().date}`,
            time: `${getFormattedISTDateTime().time}`,
            action: 'Credit',
            status: 'Successful',
            // changedBy: id,
            userId: referstudent.bpstudents,
            reason: 'Enrolled student',
            studentId: referStudentId,
            amount: 2000, 
            commission: 'n'
          })
          await statements.create({
            date: `${getFormattedISTDateTime().date}`,
            time: `${getFormattedISTDateTime().time}`,
            action: 'Credit',
            status: 'Successful',
            // changedBy: id,
            userId: user.dataValues.createdBy,
            reason: `Enrolled student - commision from ${id} `,
            studentId: referStudentId,
            amount: 400,
            commission : 'y'
          })
         }
         else{
          await statements.create({
            date: `${getFormattedISTDateTime().date}`,
            time: `${getFormattedISTDateTime().time}`,
              action: 'Credit',
              status: 'Successful',
              // changedBy: id,
              userId:referstudent.bpstudents,
              reason: 'Enrolled student',
              studentId: referStudentId,
              amount: 2000,
              commission: 'n'
          });
        }
      }
 
      await statusModel.create({
          changedBy: id,
          currentStatus,
          referStudentId,
          comment,
          date: `${getFormattedISTDateTime().date}`,
            time: `${getFormattedISTDateTime().time}`,
      });
 
      res.status(201).json({
          message: 'Status changed successfully',
          details: {
            changedBy: id,
            currentStatus,
            comment
        }
 
      });
  } catch (error) {
      console.error(error);
      res.status(500).json({
          message: 'An error occurred',
          error: error.message
      });
  }
};
 
 
const getAll = async (req, res) => {
  try {
    
      let {userId }= req.query || '';		
      let id = userId	;										   
    const { filter, search, page = 1, limit, pageSize } = req.query;
    console.log('filter is',id,search,filter,limit,pageSize)
    let filterStatuses = null;
    let startDate = null;
    let endDate = null;
    const effectiveLimit = parseInt(pageSize || limit || 10);
     const roleDetails = await Role.findAll({
      attributes: ['id'],
  });

  const userDetails = await bppusers.findOne({
      where:{
        id:userId
      },
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
      attributes: ['referStudentId', [fn('MAX', col('id')), 'latestId']],
      group: ['referStudentId'],
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
          { '$referStudent.fullname$': { [Op.like]: `%${search}%` } },
          { '$referStudent.businessPartnerId$': { [Op.like]: `%${search}%` } },
          { '$referStudent.businessPartnerName$': { [Op.like]: `%${search}%` } },
          
        ],
      }
    : {};
  
      console.log(id)
      console.log('Kavya check',roleDetails.dataValues);
      console.log(roleDetails)
      const roleIds = roleDetails.map((role) => role.dataValues.id);
      

console.log('Role IDs:', roleIds);
      const referStudentFilter = userDetails.roleId === 10 || userDetails.roleId === 9 ? {assignedTo:id}  : rolePermissions.Permissions.some(permission => permission.module === 'Refer Students' && permission.canUpdate) ? {} : id != null ? { bpstudents: id } : {};
 
      // const referStudentFilter = id != null || id === 2 ? { bpstudents: id } : {}; 		
      // const referStudentFilter = {}; 																					
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
          model: referStudentmodel,
          as: 'referStudent',
          attributes: [
            'id',
            'fullname',
            'email',
            'phoneNumber',
            'assignedTo',
            'businessPartnerId',
            'source',
            'city',
            'bpstudents',
            'businessPartnerName',
            'assignedBy'
          ],
          where: {
            ...searchConditions,
			...referStudentFilter
          },
          include: [
            {
              model: coursesModel,
              // as: 'enrolledCourses', // Use the alias defined in the association
              // attributes: ['courseName'], // Include the course name
              // through: { attributes: [] }, // Exclude junction table details
            },
            {
              model: bppusers,
              as: 'bpStudentsUser',
             
              attributes: [ 'fullName', 'email','phonenumber','roleId'], 
              // Assuming the name field is in bppusers
            },
            {
              model: bppusers,
              as: 'assignedUser'
            },
            {
              model: bppusers,
              as: 'assignedUserBy'
            }
          ],
        },
      ],
      offset,
      limit: effectiveLimit,
      order: [['id', 'DESC']],
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
          model: referStudentmodel,
          as: 'referStudent',
          attributes: [],
          where: {
            ...searchConditions,
		...referStudentFilter
          },
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
          model: referStudentmodel,
          as: 'referStudent',
          attributes: [],
          where: {
            ...searchConditions,
				...referStudentFilter				  
          },
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
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'An error occurred while fetching the records.' });
  }
};


const getDashboardDetails = async (req, res) => {
  try {
    const { filter, search, page = 1, limit, pageSize = 10 } = req.query; // Set a default pageSize
    const { id } = req.params;
    let filterStatuses = null;
    let startDate = null;
    let endDate = null;
    const effectiveLimit = parseInt(pageSize);
 
    if (filter) {
      const parsedFilter = JSON.parse(filter);
      filterStatuses = parsedFilter.statuses ? parsedFilter.statuses.map(status => status.trim()) : null;
      startDate = parsedFilter.startDate ? new Date(parsedFilter.startDate) : null;
      endDate = parsedFilter.endDate ? new Date(parsedFilter.endDate) : null;
    }
 
    const children = await credentialDetails.findAll({
      where: {
        createdBy: id,
        ...(search && {
          [Op.or]: [
            { businessPartnerID: { [Op.like]: `%${search}%` } }, 
            { '$bppUser.fullName$': { [Op.like]: `%${search}%` } } 
          ]
        }),
      },
      attributes: ['userId', 'businessPartnerID'],
      include: [{
        model: bppusers,
        attributes: ['fullName', 'email', 'phoneNumber']
      }]
    });
 
    const createdByCount = await credentialDetails.count({
      where: { createdBy: id },
    });
 
    const isParentPartner = createdByCount > 0 ? true : false;
 
    const childrenObject = children.reduce((acc, child) => {
      const childData = child.toJSON();
      acc[childData.userId] = {
        ...childData,
        enrollments: 0,
        referrals: 0,
        Total: 0,
        Income: 0,
        Revenue: 0,
		childUserCount: 0,
        childuserIds: []
      };
      return acc;
    }, {});
  const childUsers = await credentialDetails.findAll({
      where: { createdBy: { [Op.in]: Object.keys(childrenObject) } },
      attributes: ['createdBy', 'userId'],
      raw: true
    });

    childUsers.forEach(child => {
      if (childrenObject[child.createdBy]) {
        childrenObject[child.createdBy].childUserCount++;
        childrenObject[child.createdBy].childuserIds.push(child.userId);
      }
    });
    const userIds = children.map(child => child.userId);
    const recentStatuses = await statusModel.findAll({
      attributes: [
        'referStudentId',
        [fn('MAX', col('status.id')), 'latestId'],
      ],
      include: [{
        model: referStudentmodel,
        as: 'referStudent',
        attributes: ['bpstudents']
      }],
      group: ['status.referStudentId', 'referStudent.bpstudents'],
      where: {
        ...(startDate && endDate && { createdAt: { [Op.between]: [startDate, endDate] } }),
        ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses.filter(status => status !== 'new lead') } }),
      },
      raw: true,
    });

    const latestIds = recentStatuses.map(status => status.latestId);

    if (!latestIds.length) {
      return res.status(200).json({
        statuses: [],
        uniqueBpStudentsCount: 0,
        totalRecords: 0,
        totalPages: 0,
        currentPage: page,
        pageSize: effectiveLimit
      });
    }
    const enrollmentCounts = await statusModel.findAll({
      attributes: [
        [fn('COUNT', col('status.id')), 'count'],
        [col('referStudent.bpstudents'), 'bpstudents'],
      ],
      where: {
        id: { [Op.in]: latestIds },
        currentStatus: 'enroll'
      },
      include: [{
        model: referStudentmodel,
        attributes: [],
        as: 'referStudent'
      }],
      group: ['referStudent.bpstudents'],
      raw: true,
    });

    const referralCounts = await statusModel.findAll({
      attributes: [
        [fn('COUNT', col('status.id')), 'count'],
        [col('referStudent.bpstudents'), 'bpstudents'],
      ],
      where: {
        id: { [Op.in]: latestIds },
      },
      include: [{
        model: referStudentmodel,
        attributes: [],
        as: 'referStudent'
      }],
      group: ['referStudent.bpstudents'],
      raw: true,
    });

    referralCounts.filter(item => userIds.includes(parseInt(item.bpstudents))).forEach(item => {
      if (childrenObject[item.bpstudents]) {
        childrenObject[item.bpstudents].referrals = parseInt(item.count);
      }
    });

    enrollmentCounts.filter(item => userIds.includes(parseInt(item.bpstudents))).forEach(item => {
      if (childrenObject[item.bpstudents]) {
        childrenObject[item.bpstudents].enrollments = parseInt(item.count);
        childrenObject[item.bpstudents].Total = childrenObject[item.bpstudents].enrollments * 2000;
        childrenObject[item.bpstudents].Income = childrenObject[item.bpstudents].Total;
        childrenObject[item.bpstudents].Revenue = childrenObject[item.bpstudents].Total * 0.2;
      }
    });
    
    const childrenArray = Object.values(childrenObject);
    const paginatedChildren = childrenArray.slice((page - 1) * effectiveLimit, page * effectiveLimit);
    const totalPages = Math.ceil(childrenArray.length / effectiveLimit);

    return res.status(200).json({
      isParentPartner,
      refferedBusinessPartners: childrenArray.length,
      Details: paginatedChildren,
      totalEnrollments: childrenArray.reduce((acc, child) => acc + child.enrollments, 0),
      totalReferrals: childrenArray.reduce((acc, child) => acc + child.referrals, 0),
      totalIncome: childrenArray.reduce((acc, child) => acc + child.Total, 0),
      totalRecords: childrenArray.length,
      totalPages,
      currentPage: parseInt(page),
      pageSize: effectiveLimit
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'An error occurred while fetching the records.' });
  }
};

 
const getStudentAllStatus = async (req, res) => {
    try {
        const { studentreferId } = req.params;
        const response = await statusModel.findAll({
            where: { referStudentId: studentreferId },
            order: [['id', 'DESC']],
        });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the records.' });
    }
};
 

const getAllBpAndStudents = async (req, res) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
 const {search} = req.query
  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  try {
    const { rows: credentialDetailsList, count: totalCredentialDetails } = await credentialDetails.findAndCountAll({
      where: {
        createdBy: userId
      },
      attributes: ['userId'] 
    });

    if (!credentialDetailsList.length) {
      return res.status(404).json({
        success: false,
        message: "No child business partners found for this user"
      });
    }




    const searchConditions = search
    ? {
        [Op.or]: [
          { fullname: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          {businessPartnerId :{[Op.like]: `%${search}%`}},
          {businessPartnerName :{[Op.like]: `%${search}%`}}
        ],
      }
    : {};

    const userIds = credentialDetailsList.map(row => row.userId);

    const offset = (page - 1) * pageSize;
    const { rows: studentList, count: totalStudentCount } = await referStudentmodel.findAndCountAll({
      attributes: ["id", "fullname", "email", "phonenumber", "city","businessPartnerId","businessPartnerName"],
      where: {
        bpstudents: {
          [Op.in]: userIds
        },
        ...searchConditions
      },
      include: [
        {
          model: statusModel,
          as: "statuses",
          attributes: ["currentStatus", "updatedAt"],
          separate: true,
          order: [["updatedAt", "DESC"]],
          limit: 1
        }
      ],
      order: [['id', 'DESC']],
      limit: pageSize,
      offset: offset
    });

    if (!studentList.length) {
      return res.status(404).json({
        success: false,
        message: "No students found for these business partners"
      });
    }

    const totalPages = Math.ceil(totalStudentCount / pageSize);

    return res.status(200).json({
      success: true,
      students: studentList,
      totalRecords: totalStudentCount,
      pageSize: pageSize,
      totalPages: totalPages,
      currentPage: page
    });
  } catch (error) {
    console.error("Error fetching business partners and students:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching details",
      error: error.message
    });
  }
};


const getBusinessPartnersCount = async (req, res) => {
  try {
    const { count: totalRecords, rows: businessPartners, parentCount } = await credentialDetails.findAndCountAll({
      include: [
        {
          model: bppusers,
          where: { roleId: 2 }
        }
      ],
      attributes: [
        [literal(`(
          SELECT COUNT(DISTINCT createdBy)
          FROM credentialDetails
          WHERE createdBy IS NOT NULL
        )`), 'parentCount'],
      ],
      order: [['id', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      message: 'Business partners count and details retrieved successfully',
      data: {
        count: totalRecords,
        parentCount,
        details: businessPartners,
      },
    });
  } catch (error) {
    console.error('Error fetching business partners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve business partners count and details',
      error: error.message,
    });
  }
};

module.exports = {
    createStatus,
    getStudentAllStatus,
    getAll,
    getDashboardDetails,
    getAllBpAndStudents,
    getBusinessPartnersCount
}
 