// status.js
const referStudentmodel = require('../models/referStudent');
const { Op , fn, col} = require("sequelize")
const statusModel = require('../models/status/status');
const sequelize = require('../config/db');
const bppusers = require('../models/bpp/users');
const dayjs = require('dayjs');
const now = dayjs();
const statements = require('../models/bpp/statements');
const credentialDetails = require('../models/bpp/credentialDetails');
const coursesModel = require('../models/bpp/courses')


const createStatus = async (req, res) => {
  try {
      const { id, currentStatus, referStudentId, comment } = req.body;
 
      if (currentStatus === 'enroll') {
         const user = await credentialDetails.findOne({
          where :{
            userId: id
          }
         })
 console.log(user?.createdBy)
         if(user?.createdBy){
          console.log('user.id',user.createdBy);
          await statements.create({
            date: now.format('YYYY-MM-DD'),
            time: now.format('HH:mm:ss'),
            action: 'Credit',
            status: 'Successful',
            // changedBy: id,
            userId: id,
            reason: 'Enrolled student',
            studentId: referStudentId,
            amount: 800, 
            commission: 'n'
          })
          await statements.create({
            date: now.format('YYYY-MM-DD'),
            time: now.format('HH:mm:ss'),
            action: 'Credit',
            status: 'Successful',
            // changedBy: id,
            userId: user.dataValues.createdBy,
            reason: `Enrolled student - commision from ${id} `,
            studentId: referStudentId,
            amount: 200,
            commission : 'y'
          })
         }
         else{
          await statements.create({
              date: now.format('YYYY-MM-DD'),
              time: now.format('HH:mm:ss'),
              action: 'Credit',
              status: 'Successful',
              // changedBy: id,
              userId: id,
              reason: 'Enrolled student',
              studentId: referStudentId,
              amount: 1000,
              commission: 'n'
          });
        }
      }
 
      await statusModel.create({
          changedBy: id,
          currentStatus,
          referStudentId,
          comment,
          time: new Date()
      });
 
      res.status(201).json({
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
 
 
// const getAll = async (req, res) => {
//   try {
//     const { filter, search, page = 1, limit, pageSize } = req.query;
 
//     let filterStatuses = null;
//     let startDate = null;
//     let endDate = null;
  
 
//     // pageSize
//     const effectiveLimit = parseInt(pageSize || limit || 10);
 
//     if (filter) {
//       const parsedFilter = JSON.parse(filter);
//       filterStatuses = parsedFilter.statuses
//         ? parsedFilter.statuses.map((status) => status.trim())
//         : null;
//       startDate = parsedFilter.startDate ? new Date(parsedFilter.startDate) : null;
//       endDate = parsedFilter.endDate ? new Date(parsedFilter.endDate) : null;
//     }
//     const recentStatuses = await statusModel.findAll({
//       attributes: [
//         'referStudentId',
//         [fn('MAX', col('id')), 'latestId'],
//       ],
//       group: ['referStudentId'],
//       where: {
//         ...(startDate && endDate && {
//           createdAt: { [Op.between]: [startDate, endDate] },
//         }),
//       },
//     });
 
//     const latestIds = recentStatuses.map((status) => status.dataValues.latestId);
 
//     if (!latestIds.length) {
//       return res.status(200).json({
//         statuses: [],
//         count: {},
//         totalRecords: 0,
//         totalPages: 0,
//         currentPage: page,
//       });
//     }
 
//     const searchConditions = search
//       ? {
//           [Op.or]: [
//             { fullname: { [Op.like]: `%${search}%` } },
//             { phoneNumber: { [Op.like]: `%${search}%` } },
//             { email: { [Op.like]: `%${search}%` } },
//             { courseRequired: { [Op.like]: `%${search}%` } },
//           ],
//         }
//       : {};
 
//     const offset = (page - 1) * effectiveLimit;
 

   
//     const fullStatuses = await statusModel.findAll({
//       where: {
//         id: {
//           [Op.in]: latestIds,
//         },
//         ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
//         ...(startDate && endDate && {
//           createdAt: { [Op.between]: [startDate, endDate] },
//         }),
//       },

   
//       include: [
//         {
//           model: referStudentmodel,
//           as: 'referStudent',
//           attributes: [
//             'id',
//             'fullname',
//             'email',
//             'phoneNumber',
//             'assignedTo',
//             'businessPartnerId',
//             'source',
//             'courseRequired',
//             'city',
//             'bpstudents'
//           ],
//           where: {
//             ...searchConditions,
//           },
//         },
//       ],
//       offset,
//       limit: effectiveLimit,
//     });
 
//     const totalRecords = await statusModel.count({
//       where: {
//         id: {
//           [Op.in]: latestIds,
//         },
//         ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
//         ...(startDate && endDate && {
//           createdAt: { [Op.between]: [startDate, endDate] },
//         }),
//       },
//       include: [
//         {
//           model: referStudentmodel,
//           as: 'referStudent',
//           attributes: [],
//           where: {
//             ...searchConditions,
//           },
//         },
//       ],
//     });
 
//     const totalPages = Math.ceil(totalRecords / effectiveLimit);
 
//     const statusCount = await statusModel.findAll({
//       attributes: [
//         'currentStatus',
//         [fn('COUNT', col('currentStatus')), 'count'],
//       ],
//       where: {
//         id: {
//           [Op.in]: latestIds,
//         },
//         ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
//         ...(startDate && endDate && {
//           createdAt: { [Op.between]: [startDate, endDate] },
//         }),
//       },
//       include: [
//         {
//           model: referStudentmodel,
//           as: 'referStudent',
//           attributes: [],
//           where: {
//             ...searchConditions,
//           },
//         },
//       ],
//       group: ['currentStatus'],
//       raw: true,
//     });
 
//     const statusCountMapping = statusCount.reduce((acc, { currentStatus, count }) => {
//       acc[currentStatus] = count;
//       return acc;
//     }, {});
 
//     return res.status(200).json({
//       statuses: fullStatuses,
//       count: statusCountMapping,
//       totalRecords,
//       totalPages,
//       currentPage: parseInt(page),
//       pageSize: effectiveLimit,
//     });
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     return res.status(500).json({ error: 'An error occurred while fetching the records.' });
//   }
// };
 

// const { Op, fn, col } = require('sequelize');




// mycode 
const getAll = async (req, res) => {
  try {
		 const { id } = req.body;		
     const userDetails = await bppusers.findOne({
      where:{
        id
      }
     })	

     console.log('check',userDetails.dataValues.roleId) 											   
    const { filter, search, page = 1, limit, pageSize } = req.query;

    let filterStatuses = null;
    let startDate = null;
    let endDate = null;

    // pageSize
    const effectiveLimit = parseInt(pageSize || limit || 10);

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
          ],
        }
      : {};

		 
    const referStudentFilter = id ? { bpstudents: id } : {};																								
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
          ],
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

// const getDashboardDetails = async (req, res) => {
//   try {
//     const { filter, search, page = 1, limit, pageSize = 10 } = req.query; // Set a default pageSize
//     const { id } = req.params;
//     let filterStatuses = null;
//     let startDate = null;
//     let endDate = null;
//     const effectiveLimit = parseInt(pageSize);

//     if (filter) {
//       const parsedFilter = JSON.parse(filter);
//       filterStatuses = parsedFilter.statuses ? parsedFilter.statuses.map(status => status.trim()) : null;
//       startDate = parsedFilter.startDate ? new Date(parsedFilter.startDate) : null;
//       endDate = parsedFilter.endDate ? new Date(parsedFilter.endDate) : null;
//     }

//     // Fetch children records
//     const children = await credentialDetails.findAll({
//       where: { createdBy: id },
//       attributes: ['userId', 'businessPartnerID'],
//       include: [{
//         model: bppusers,
//         attributes: ['fullName', 'email', 'phoneNumber']
//       }]
//     });

//     // Create an object indexed by userId
//     const childrenObject = children.reduce((acc, child) => {
//       const childData = child.toJSON();
//       acc[childData.userId] = {
//         ...childData,
//         enrollments: 0,  // Default to 0 enrollments
//         Total: 0,
//         Income: 0,
//         Revenue: 0
//       };
//       return acc;
//     }, {});

    
//     const userIds = children.map(child => child.userId);
//     const recentStatuses = await statusModel.findAll({
//       attributes: [
//         'referStudentId',
//         [fn('MAX', col('status.id')), 'latestId'],
//       ],
//       include: [{
//         model: referStudentmodel,
//         as: 'referStudent',
//         attributes: ['bpstudents']
//       }],
//       group: ['status.referStudentId', 'referStudent.bpstudents'],
//       where: {
//         ...(startDate && endDate && { createdAt: { [Op.between]: [startDate, endDate] } }),
//         ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses.filter(status => status !== 'new lead') } }),
//       },
//       raw: true,
//     });

//     const latestIds = recentStatuses.map(status => status.latestId);

//     if (!latestIds.length) {
      
//       return res.status(200).json({
//         statuses: [],
//         uniqueBpStudentsCount: 0,
//         totalRecords: 0,
//         totalPages: 0,
//         currentPage: page,
//         pageSize: effectiveLimit
//       });
//     }

 
//     const enrollmentCounts = await statusModel.findAll({
//       attributes: [
//         [fn('COUNT', col('status.id')), 'count'],
//         [col('referStudent.bpstudents'), 'bpstudents'],
//       ],
//       where: {
//         id: { [Op.in]: latestIds },
//         currentStatus: 'enroll'
//       },
//       include: [{
//         model: referStudentmodel,
//         attributes: [],
//         as: 'referStudent'
//       }],
//       group: ['referStudent.bpstudents'],
//       raw: true,
//     });

  
//     enrollmentCounts.filter(item => userIds.includes(parseInt(item.bpstudents))).forEach(item => {
//       if (childrenObject[item.bpstudents]) {
//         childrenObject[item.bpstudents].enrollments = parseInt(item.count);
//         childrenObject[item.bpstudents].Total = childrenObject[item.bpstudents].enrollments * 1000;
//         childrenObject[item.bpstudents].Income = childrenObject[item.bpstudents].Total * 0.8;
//         childrenObject[item.bpstudents].Revenue = childrenObject[item.bpstudents].Total * 0.2;
//       }
//     });

//     // Convert object to array for pagination
//     const childrenArray = Object.values(childrenObject);
//     const paginatedChildren = childrenArray.slice((page - 1) * effectiveLimit, page * effectiveLimit);
//     const totalPages = Math.ceil(childrenArray.length / effectiveLimit);

//     return res.status(200).json({
//       refferedBusinessPartners: childrenArray.length,
//       Details: paginatedChildren,
//       totalEnrollments: childrenArray.reduce((acc, child) => acc + child.enrollments, 0),
//       totalIncome: childrenArray.reduce((acc, child) => acc + child.Total, 0),
//       totalRecords: childrenArray.length,
//       totalPages,
//       currentPage: parseInt(page),
//       pageSize: effectiveLimit
//     });
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     return res.status(500).json({ error: 'An error occurred while fetching the records.' });
//   }
// };

const getDashboardDetails = async (req, res) => { 
  try {
    const { filter, search, page = 1, limit, pageSize = 10 } = req.query; // Set a default pageSize
    const { id } = req.params;
    let filterStatuses = null;
    let startDate = null;
    let endDate = null;
    const effectiveLimit = parseInt(pageSize);

    // Handle filtering parameters
    if (filter) {
      const parsedFilter = JSON.parse(filter);
      filterStatuses = parsedFilter.statuses ? parsedFilter.statuses.map(status => status.trim()) : null;
      startDate = parsedFilter.startDate ? new Date(parsedFilter.startDate) : null;
      endDate = parsedFilter.endDate ? new Date(parsedFilter.endDate) : null;
    }

    // Handle search parameter for businessPartnerId and fullName
    const businessPartnerIdSearch = search?.businessPartnerId ? { businessPartnerID: search.businessPartnerId } : {};
    const fullNameSearch = search?.fullName ? { '$bppusers.fullName$': { [Op.iLike]: `%${search.fullName}%` } } : {};

    // Fetch children records with the new filters and search criteria
    const children = await credentialDetails.findAll({
      where: { 
        createdBy: id,
        ...businessPartnerIdSearch
      },
      attributes: ['userId', 'businessPartnerID'],
      include: [{
        model: bppusers,
        attributes: ['fullName', 'email', 'phoneNumber'],
        where: fullNameSearch
      }]
    });

    // Create an object indexed by userId
    const childrenObject = children.reduce((acc, child) => {
      const childData = child.toJSON();
      acc[childData.userId] = {
        ...childData,
        enrollments: 0,  // Default to 0 enrollments
        Total: 0,
        Income: 0,
        Revenue: 0
      };
      return acc;
    }, {});

	
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

  
    enrollmentCounts.filter(item => userIds.includes(parseInt(item.bpstudents))).forEach(item => {
      if (childrenObject[item.bpstudents]) {
        childrenObject[item.bpstudents].enrollments = parseInt(item.count);
        childrenObject[item.bpstudents].Total = childrenObject[item.bpstudents].enrollments * 1000;
        childrenObject[item.bpstudents].Income = childrenObject[item.bpstudents].Total * 0.8;
        childrenObject[item.bpstudents].Revenue = childrenObject[item.bpstudents].Total * 0.2;
      }
    });

    // Convert object to array for pagination
    const childrenArray = Object.values(childrenObject);
    const paginatedChildren = childrenArray.slice((page - 1) * effectiveLimit, page * effectiveLimit);
    const totalPages = Math.ceil(childrenArray.length / effectiveLimit);

    return res.status(200).json({
      refferedBusinessPartners: childrenArray.length,
      Details: paginatedChildren,
      totalEnrollments: childrenArray.reduce((acc, child) => acc + child.enrollments, 0),
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
 
  
module.exports = {
    createStatus,
    getStudentAllStatus,
    getAll,
    getDashboardDetails
}
 