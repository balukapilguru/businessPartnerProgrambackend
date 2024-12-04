const referBusinessModel = require('../models/referBusiness');
const { Op , fn, col} = require("sequelize")
const statusModel = require('../models/status/BusinessStatus'); 
const sequelize = require('../config/db'); 
const bppusers = require('../models/bpp/users');
const dayjs = require('dayjs');
const now = dayjs();
const statements = require('../models/bpp/statements')


const createBusinessStatus = async (req, res) => {
  try {
      const { id, currentStatus,  referbusinessId, comment } = req.body;
      if (currentStatus === 'enroll') {
         
          await statements.create({
              date: now.format('YYYY-MM-DD'),
              time: now.format('HH:mm:ss'),
              action: 'Credit',
              status: 'Successful',
              changedBy: id,
              userId: id,
              reason: 'Enrolled student',
              businessId: referbusinessId,
              amount: 1000
          });
      }
        await statusModel.create({
          changedBy: id,
          currentStatus,
          referbusinessId,
          comment,
          time: new Date()
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

// const getAll = async (req, res) => {
//   try {
//     const { filter, search } = req.query; 

//     let filterStatuses = null;
//     let startDate = null;
//     let endDate = null;

    
//     if (filter) {
//       const parsedFilter = JSON.parse(filter);
//       filterStatuses = parsedFilter.statuses
//         ? parsedFilter.statuses.split(',').map((status) => status.trim())
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
//     });

//     const latestIds = recentStatuses.map((status) => status.dataValues.latestId);

//     if (!latestIds.length) {
//       return res.status(200).json({
//         statuses: [],
//         count: {},
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

   
//     const fullStatuses = await statusModel.findAll({
//       where: {
//         id: {
//           [Op.in]: latestIds, 
//         },
//         ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }), 
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
//             'city'
//           ],
//           where: {
//             ...(startDate && endDate && {
//               createdAt: { [Op.between]: [startDate, endDate] },
//             }),
//             ...searchConditions, 
//           },
//         },
//       ],
//     });

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
//       },
//       include: [
//         {
//           model: referStudentmodel,
//           as: 'referStudent',
//           attributes: [],
//           where: {
//             ...(startDate && endDate && {
//               createdAt: { [Op.between]: [startDate, endDate] },
//             }),
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
//     });
//   } catch (error) {
//     console.error('Error fetching data:', error);
//     return res.status(500).json({ error: 'An error occurred while fetching the records.' });
//   }
// };

 
const getAllbusiness = async (req, res) => {
    try {
      const { filter, search, page = 1, limit, pageSize } = req.query;
   
      let filterStatuses = null;
      let startDate = null;
      let endDate = null;
   
      // pageSize
      const effectiveLimit = parseInt(pageSize || limit || 10);
   
      if (filter) {
        const parsedFilter = JSON.parse(filter);
        filterStatuses = parsedFilter.statuses
          ? parsedFilter.statuses.split(',').map((status) => status.trim())
          : null;
        startDate = parsedFilter.startDate ? new Date(parsedFilter.startDate) : null;
        endDate = parsedFilter.endDate ? new Date(parsedFilter.endDate) : null;
      }
   
      const recentStatuses = await statusModel.findAll({
        attributes: [
          'referbusinessId',
          [fn('MAX', col('id')), 'latestId'],
        ],
        group: ['referbusinessId'],
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
   
      const offset = (page - 1) * effectiveLimit;
   
      const fullStatuses = await statusModel.findAll({
        where: {
          id: {
            [Op.in]: latestIds,
          },
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
            where: {
              ...searchConditions,
            },
          },
        ],
        offset,
        limit: effectiveLimit,
      });
   
      const totalRecords = await statusModel.count({
        where: {
          id: {
            [Op.in]: latestIds,
          },
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
            where: {
              ...searchConditions,
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
          id: {
            [Op.in]: latestIds,
          },
          ...(filterStatuses && { currentStatus: { [Op.in]: filterStatuses } }),
          ...(startDate && endDate && {
            createdAt: { [Op.between]: [startDate, endDate] },
          }),
        },
        include: [
          {
            model: referBusinessModel,
            as:'referBusiness',
            attributes: [],
            where: {
              ...searchConditions,
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
   
   
  
// const getbusinessAllStatus = async (req, res) => {
//     try {
//         const { referbusinessId} = req.params;
//         const response = await statusModel.findOne({
//             where: { referbusinessId}, 
//             order: [['id', 'DESC']], 
//         });
//         res.status(200).json(response);
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'An error occurred while fetching the records.' });
//     }
// };

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