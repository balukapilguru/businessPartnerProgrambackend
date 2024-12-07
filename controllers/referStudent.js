
// const referStudentmodel = require('../models/db/index');
const { Op } = require("sequelize")
// const statuses = require('../models/db/index'); 
const { ReferStudentmodel, Status, Sequelize } = require('../models/db/index'); 
const credentialDetails = require("../models/bpp/credentialDetails");
const course = require("../models/bpp/courses")
const studentCourses = require("../models/bpp/studentcourses")
// console.log(statuses)



const createReferral = async (req, res) => {
    try {
        const { fullname, email, contactnumber, city, courseRequired, changedBy, businessPartnerID } = req.body;
        const user = await credentialDetails. findOne({
            where :{
                businessPartnerID: businessPartnerID
            }
        })

        const courseFound = await course.findOne({
            where: {
                courseName: courseRequired  // Fixed the typo from courseNmae to courseName
            }
        });
        if (!courseFound) {
            return res.status(400).json({ message: 'Course not found.' });
        }

        // const existingReferralByEmail = await ReferStudentmodel.findOne({ where: { email } });
        // if (existingReferralByEmail) {
        //     return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
        // }

     
        const newReferral = await ReferStudentmodel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            city,
              courseRequired: courseFound.id, 
            businessPartnerId:businessPartnerID,
            bpstudents: user.dataValues.userId
        });



        await studentCourses.create({
            studentId: newReferral.id,
            courseId: courseFound.id  // Linking the course ID here
        });
        // await newReferral.addCourse(courseFound);
        const newStatus = await Status.create({
            time: new Date(),
            changedBy: changedBy || null,
            currentStatus: 'new lead',
            referStudentId: newReferral.id,
            comment:'just created lead',
        });

        // Fetch the referral with associated statuses
        // const referralWithStatus = await referStudentmodel.findOne({
        //     where: { id: newReferral.id },
        //     include: [{
        //         model: statusModel,
        //         as: 'statuses',
        //     }],
        // });

       
        res.status(201).json({
            message: 'Referral created successfully',
            referal :newReferral
            // data: {
            //     referral: referralWithStatus,
            //     // status: referralWithStatus.statuses
            // }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};



// notusing

const getReferrals = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, searchTerm = "", status = "", courseRequired = "", businessPartnerId = "", filterField = "", filterValue = "", startDate = "", endDate = "" } = req.query;

        const pageNumber = parseInt(page, 10);
        const size = pageSize === "all" ? Number.MAX_SAFE_INTEGER : parseInt(pageSize, 10);
        const offset = pageSize === "all" ? 0 : (pageNumber - 1) * size;

       
        const referrals = await ReferStudentmodel.findAll({
            limit: size,
            offset: offset,
            attributes: ['id', 'fullname', 'email', 'phonenumber', 'city', 'courseRequired', 'status', 'businessPartnerId', 'createdAt'],
            include: [
                {
                    model: Status,
                    as: 'statuses',
                    attributes: ['currentStatus', 'comment', 'time'],
                    required: false,
                    order: [['time', 'DESC']],
                },
            ],
            order: [['createdAt', 'DESC'],
         ]

        });

      
        const filteredReferrals = referrals.filter(referral => {
            let isValid = true;

            
            if (searchTerm) {
                isValid = isValid && (referral.fullname.includes(searchTerm) || 
                                      referral.email.includes(searchTerm) || 
                                      referral.phonenumber.includes(searchTerm) || 
                                      referral.courseRequired.includes(searchTerm) || 
                                      referral.city.includes(searchTerm));
            }

            
            if (status && referral.status && referral.status !== status) {
                isValid = isValid && false;
            }

            
            if (courseRequired && referral.courseRequired !== courseRequired) {
                isValid = isValid && false;
            }

          
            if (businessPartnerId && referral.businessPartnerId !== businessPartnerId) {
                isValid = isValid && false;
            }

           
            if (startDate && endDate) {
                const createdAt = new Date(referral.createdAt);
                const start = new Date(startDate);
                const end = new Date(endDate);

                isValid = isValid && createdAt >= start && createdAt <= end;
            }

            return isValid;
        });

        const referralCount = filteredReferrals.length; 
        const totalPages = Math.ceil(referralCount / size);

       
        const paginatedReferrals = filteredReferrals.slice(offset, offset + size);

        return res.status(200).json({
            page: pageNumber,
            pageSize: size,
            totalPages,
            totalReferrals: referralCount,
            referrals: paginatedReferrals,
            message: 'Referrals fetched successfully',
        });
    } catch (error) {
        console.error('Error fetching referrals:', error);
        return res.status(500).json({ error: 'An error occurred while fetching referrals.' });
    }
};





// const getReferrals = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             searchTerm = '',
//             status = '',
//             courseRequired='',
          
//             businessPartnerId = '',
//             filterField = '',  
//             filterValue = '',  
//             startDate = '',    
//             endDate = '',     
//         } = req.query;

//         const pageNumber = parseInt(page, 10);
//         const size = pageSize === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(pageSize, 10);
//         const offset = pageSize === 'all' ? 0 : (pageNumber - 1) * size;

      
//         const searchCondition = searchTerm ? {
//             [Sequelize.Op.and]: [
//                                 {
//                                     [Sequelize.Op.or]: [
//                                         { fullname: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                                         { email: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                                         { contactnumber: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                                         { courseRequired: { [Sequelize.Op.like]: `%${courseRequired}%` } },
//                                         { city: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                                     ],
//                                 },

//                                 ...(businessPartnerId ? [{ businessPartnerId }] : []),
//                             ],
//         } : {};

   
//         const statusCondition = status ? { status: { [Op.like]: `%${status}%` } } : {};

//         const businessPartnerCondition = businessPartnerId ? { businessPartnerId } : {};

       
//         const filterClause = filterField && filterValue ? {
//             [filterField]: {
//                 [Op.like]: `%${filterValue}%`
//             }
//         } : {};

       
//         const dateFilter = startDate && endDate ? {
//             createdAt: {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             }
//         } : {};

       
//         const whereClause = {
//             [Op.and]: [
//                 searchCondition,
//                 statusCondition,
//                 businessPartnerCondition,
//                 filterClause,
//                 dateFilter,
//             ]
//         };

   
//         const { count: referralCount, rows: referrals } = await  referStudentmodel.findAndCountAll({
//             where: whereClause,
//             limit: size,
//             offset: offset,
//             attributes: [
//                 "id", 
//                 'fullname', 
//                 'email', 
//                 'phonenumber', 
//                 'city', 
//                 'courseRequired', 
//                 'status', 
//                 'businessPartnerId', 
//                 "createdAt"
//             ],
//             order: [['createdAt', 'DESC'],
//             ['status', 'DESC'], ], 
           
//         });

//         if (referrals.length === 0) {
//             return res.status(404).json({ message: 'No referrals found' });
//         }

//         const totalPages = Math.ceil(referralCount / size);
//         return res.status(200).json({
//             page: pageNumber,
//             pageSize: size,
//             totalPages,
//             totalReferrals: referralCount,
//             referrals,
//             message: 'Referrals fetched successfully'
//         });

//     } catch (error) {
//         console.error('Error fetching referrals:', error);
//         return res.status(500).json({ error: 'An error occurred while fetching referrals.' });
//     }
// };

// const getReferrals = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             pageSize = 10,
//             searchTerm = '',
//             status = '',
//             courseRequired = '',
//             businessPartnerId = '',
//             filterField = '',
//             filterValue = '',
//             startDate = '',
//             endDate = '',
//         } = req.query;

//         const pageNumber = parseInt(page, 10);
//         const size = pageSize === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(pageSize, 10);
//         const offset = pageSize === 'all' ? 0 : (pageNumber - 1) * size;

//         const searchCondition = searchTerm ? {
//             [Sequelize.Op.or]: [
//                 { fullname: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                 { email: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                 { contactnumber: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//                 { courseRequired: { [Sequelize.Op.like]: `%${courseRequired}%` } },
//                 { city: { [Sequelize.Op.like]: `%${searchTerm}%` } },
//             ]
//         } : {};

//         const statusCondition = status ? { status: { [Op.like]: `%${status}%` } } : {};
//         const businessPartnerCondition = businessPartnerId ? { businessPartnerId } : {};
//         const filterClause = filterField && filterValue ? {
//             [filterField]: {
//                 [Op.like]: `%${filterValue}%`
//             }
//         } : {};
//         const dateFilter = startDate && endDate ? {
//             createdAt: {
//                 [Op.between]: [new Date(startDate), new Date(endDate)]
//             }
//         } : {};

//         const whereClause = {
//             [Op.and]: [
//                 searchCondition,
//                 statusCondition,
//                 businessPartnerCondition,
//                 filterClause,
//                 dateFilter,
//             ]
//         };

//         const { count: referralCount, rows: referrals } = await referStudentmodel.findAndCountAll({
//             where: whereClause,
//             limit: size,
//             offset: offset,
//             attributes: [
//                 "id", 
//                 "fullname", 
//                 "email", 
//                 "phonenumber", 
//                 "city", 
//                 "courseRequired", 
//                 "status", 
//                 "businessPartnerId", 
//                 "createdAt"
//             ],
//             include: [{
//                 model:statuses,
//                 // as: 'statuses', // Alias must match the association
//                 // attributes: ['currentStatus', 'comment', 'time'],
//                 // required: false,
//             }],
//             order: [
//                 ['createdAt', 'DESC'],
//                 ['status', 'DESC'],
//             ],
//         });

//         if (referrals.length === 0) {
//             return res.status(404).json({ message: 'No referrals found' });
//         }

//         const totalPages = Math.ceil(referralCount / size);
//         return res.status(200).json({
//             page: pageNumber,
//             pageSize: size,
//             totalPages,
//             totalReferrals: referralCount,
//             referrals,
//             message: 'Referrals fetched successfully'
//         });

//     } catch (error) {
//         console.error('Error fetching referrals:', error);
//         return res.status(500).json({ error: 'An error occurred while fetching referrals.' });
//     }
// };


// this is using
const getReferralsByStudentId = async (req, res) => {
    try {
        const { id } = req.params;
        const referrals = await ReferStudentmodel.findOne({
            where: { id: id },  
            attributes: { exclude: ['status'] } 
        });

        if (referrals) {  
            res.status(200).json({ message: 'Referrals retrieved successfully', data: referrals });
        } else {
            res.status(404).json({ message: 'No referrals found for the given studentId' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};



const updateReferralStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comment , changedBy } = req.body;
 
       
        const referral = await ReferStudentmodel.findByPk(id);
        if (!referral) {
            return res.status(404).json({ message: "Referral doesn't exist!" });
        }
 
       
        const existingStatusCollection = [...referral.status];
        const previousStatus = existingStatusCollection.length > 0 
            ? existingStatusCollection[0].currentStatus 
            : null;
 
        const newStatusEntry = {
            currentStatus: status,
            previousStatus: previousStatus,
            changedBy: changedBy,
            comment: comment || "Status changed",
            timestamp: new Date().toLocaleString()
        };
 
        existingStatusCollection.unshift(newStatusEntry); 
 
      
        await ReferStudentmodel.update(
            { status: existingStatusCollection },
            { where: { id } }
        );
 
        res.status(200).json({
            message: 'Status updated successfully',
            data: {
                id: referral.id,
                fullname: referral.fullname,
                status: existingStatusCollection,
            }
        });
    } catch (error) {
        console.error('Error updating referral status:', error);
        res.status(500).json({ message: 'An error occurred while updating status', error: error.message || error });
    }
};



const getDashboardStats = async (req, res) => {
    try {
        const {
            searchTerm = '',
            startDate = '',
            endDate = '',
            businessPartnerId = '',
        } = req.query;

        // Step 1: Build common filters
        const dateFilter = startDate && endDate ? {
            createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)],
            },
        } : {};

        const searchFilter = searchTerm ? {
            [Op.or]: [
                { fullname: { [Op.like]: `%${searchTerm}%` } },
                { email: { [Op.like]: `%${searchTerm}%` } },
                { contactnumber: { [Op.like]: `%${searchTerm}%` } },
            ],
        } : {};

        const businessPartnerFilter = businessPartnerId ? { businessPartnerId } : {};

        const commonFilters = {
            [Op.and]: [dateFilter, searchFilter, businessPartnerFilter],
        };

        // Step 2: Define status groups
        const enrollStatuses = ['enroll'];
        const pipelineStatuses = ['contact', 'pending', 'maybe'];
        const discardStatuses = ['not allowed'];

        // Step 3: Count leads in each group
        const enrollCount = await ReferStudentmodel.count({
            where: {
                ...commonFilters,
                [Op.and]: [
                    Sequelize.json('status'), // Access the JSON field
                    Sequelize.where(
                        Sequelize.json('status'),
                        {
                            [Op.contains]: JSON.stringify([{ currentStatus: 'enroll' }]),
                        }
                    ),
                ],
            },
        });

        const pipelineCount = await ReferStudentmodel.count({
            where: {
                ...commonFilters,
                [Op.and]: [
                    Sequelize.json('status'),
                    Sequelize.where(
                        Sequelize.json('status'),
                        {
                            [Op.contains]: JSON.stringify([{ currentStatus: 'contact' }]),
                        }
                    ),
                ],
            },
        });

        const discardCount = await referStudentmodel.count({
            where: {
                ...commonFilters,
                [Op.and]: [
                    Sequelize.json('status'),
                    Sequelize.where(
                        Sequelize.json('status'),
                        {
                            [Op.contains]: JSON.stringify([{ currentStatus: 'not allowed' }]),
                        }
                    ),
                ],
            },
        });

        // Step 4: Send the data
        res.json({
            enroll: enrollCount,
            pipeline: pipelineCount,
            discard: discardCount,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
};




module.exports = { createReferral, getReferrals,getReferralsByStudentId , getDashboardStats , updateReferralStatus }