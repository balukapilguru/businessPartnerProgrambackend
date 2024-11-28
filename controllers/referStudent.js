
const referStudentmodel = require('../models/referStudent');
const { Op } = require("sequelize")
const statusModel = require('../models/status/status'); 




const createReferral = async (req, res) => {
    try {
        const { fullname, email, phonenumber:contactnumber, city, courseRequired, changedBy, businessPartnerId } = req.body;

        
        const existingReferralByEmail = await referStudentmodel.findOne({ where: { email } });
        if (existingReferralByEmail) {
            return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
        }

     
        const newReferral = await referStudentmodel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            city,
            courseRequired,
            businessPartnerId,
        });


        const newStatus = await statusModel.create({
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










const getReferrals = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            searchTerm = '',
            status = '',
            courseRequired='',
          
            businessPartnerId = '',
            filterField = '',  
            filterValue = '',  
            startDate = '',    
            endDate = '',     
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const size = pageSize === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(pageSize, 10);
        const offset = pageSize === 'all' ? 0 : (pageNumber - 1) * size;

      
        const searchCondition = searchTerm ? {
            [Sequelize.Op.and]: [
                                {
                                    [Sequelize.Op.or]: [
                                        { fullname: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                                        { email: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                                        { contactnumber: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                                        { courseRequired: { [Sequelize.Op.like]: `%${courseRequired}%` } },
                                        { city: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                                    ],
                                },

                                ...(businessPartnerId ? [{ businessPartnerId }] : []),
                            ],
        } : {};

   
        const statusCondition = status ? { status: { [Op.like]: `%${status}%` } } : {};

        const businessPartnerCondition = businessPartnerId ? { businessPartnerId } : {};

       
        const filterClause = filterField && filterValue ? {
            [filterField]: {
                [Op.like]: `%${filterValue}%`
            }
        } : {};

       
        const dateFilter = startDate && endDate ? {
            createdAt: {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            }
        } : {};

       
        const whereClause = {
            [Op.and]: [
                searchCondition,
                statusCondition,
                businessPartnerCondition,
                filterClause,
                dateFilter,
            ]
        };

   
        const { count: referralCount, rows: referrals } = await  referStudentmodel.findAndCountAll({
            where: whereClause,
            limit: size,
            offset: offset,
            attributes: [
                "id", 
                'fullname', 
                'email', 
                'phonenumber', 
                'city', 
                'courseRequired', 
                'status', 
                'businessPartnerId', 
                "createdAt"
            ],
            order: [['createdAt', 'DESC'],
            ['status', 'DESC'], ], 
           
        });

        if (referrals.length === 0) {
            return res.status(404).json({ message: 'No referrals found' });
        }

        const totalPages = Math.ceil(referralCount / size);
        return res.status(200).json({
            page: pageNumber,
            pageSize: size,
            totalPages,
            totalReferrals: referralCount,
            referrals,
            message: 'Referrals fetched successfully'
        });

    } catch (error) {
        console.error('Error fetching referrals:', error);
        return res.status(500).json({ error: 'An error occurred while fetching referrals.' });
    }
};




const getReferralsByBusinessId = async (req, res) => {
    try {
        const { id } = req.params;
        const referrals = await referStudentmodel.findAll({
            where: { 'id': id },  
            order: [['id', 'DESC']
        ,['status','DESC']],  
          });

        if (referrals.length > 0) {
            res.status(200).json({ message: 'Referrals retrieved successfully', data: referrals });
        } else {
            res.status(404).json({ message: 'No referrals found for the given businessPartnerId' });
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
 
       
        const referral = await referStudentmodel.findByPk(id);
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
 
      
        await referStudentmodel.update(
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
        const enrollCount = await referStudentmodel.count({
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

        const pipelineCount = await referStudentmodel.count({
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




module.exports = { createReferral, getReferrals, getReferralsByBusinessId, getDashboardStats , updateReferralStatus }