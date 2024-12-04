
const referBusinessModel = require('../models/referBusiness');
const businessStatus = require('../models/status/BusinessStatus')
const Sequelize = require("sequelize")



const createBusiness = async (req, res) => {
    try {
        const { fullname, email, contactnumber, serviceRequired, description, changedBy,  businessPartnerID, } = req.body;
 
		
        const existingReferralByEmail = await referBusinessModel.findOne({ where: { email } });
        if (existingReferralByEmail) {
            return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
        }
         const newReferral = await referBusinessModel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            serviceRequired,
            description,
            businessPartnerId:businessPartnerID
        });
 
       const newStatus = await businessStatus.create({
            time: new Date(),
            changedBy: changedBy || null,
            currentStatus: 'new lead',
            referId: newReferral.id,
            comment:'just created lead',
        });
											  
																		  
        res.status(201).json({ message: 'Referral created successfully', data: newReferral });
					  } catch (error) {
        console.error(error);
 
     res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};

// const createBusiness = async (req, res) => {
//     try {
//         const { fullname, email, phonenumber, serviceRequired,comment, description, status, changedBy,  businessPartnerID, } = req.body;
 
//         const existingReferralByEmail = await referBusinessModel.findOne({ where: { email } });
//         if (existingReferralByEmail) {
//             return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
//         }
 
//         const studentStatus = [{
//             currentStatus: status,
//             previousStatus: null, 
//             changedBy: changedBy || '',
//             comment: comment || 'Initial status',
//             timestamp: new Date()
//         }];
 
  
//         const newReferral = await referBusinessModel.create({
//             fullname,
//             email,
//             phonenumber,
//             serviceRequired,
//             description,
//             changedBy,
//             status: studentStatus,
//             businessPartnerId:businessPartnerID,
//         });
 
    
//         res.status(201).json({ message: 'Referral created successfully', data: newReferral });
//     } catch (error) {
//         console.error(error);
 
      
//         if (error.name === 'SequelizeUniqueConstraintError' && error.errors[0].path === 'email') {
//             return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
//         }
 
//         res.status(500).json({ message: 'An error occurred', error: error.message });
//     }
// };




const getReferrals = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            searchTerm = '',
            serviceRequired = '',
            status = '',
            businessPartnerId = '',
            filterField = '', 
            filterValue = '',
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const size = pageSize === 'all' ? Number.MAX_SAFE_INTEGER : parseInt(pageSize, 10);
        const offset = pageSize === 'all' ? 0 : (pageNumber - 1) * size;

      
        const filterClause = filterField && filterValue ? {
            [filterField]: {
                [Sequelize.Op.like]: `%${filterValue}%`
            }
        } : {};

        const whereClause = {
            [Sequelize.Op.and]: [
                {
                    [Sequelize.Op.or]: [
                        { fullname: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                        { email: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                        { phonenumber: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                        { serviceRequired: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                        { description: { [Sequelize.Op.like]: `%${searchTerm}%` } },
                    ],
                },
                ...(serviceRequired ? [{ serviceRequired: { [Sequelize.Op.like]: `%${serviceRequired}%` } }] : []),
                ...(status ? [{ status: { [Sequelize.Op.like]: `%${status}%` } }] : []),
                ...(businessPartnerId ? [{ businessPartnerId }] : []),
                filterClause, 
            ],
        };

        const referrals = await referBusinessModel.findAndCountAll({
            where: whereClause,
            order: [['id', 'DESC']],
            limit: size,
            offset: offset,
            attributes: ["id", 'fullname', 'email', 'phonenumber', 'description', 'serviceRequired', 'status', 'businessPartnerId', "createdAt"],
        });

        const totalPages = pageSize === 'all' ? 1 : Math.ceil(referrals.count / size);

        res.status(200).json({
            message: 'Referrals retrieved successfully',
            data: referrals.rows,
            pagination: pageSize === 'all' ? {} : {
                totalRecords: referrals.count,
                totalPages: totalPages,
                currentPage: pageNumber,
                pageSize: size,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};




const  getReferralsByBusinessId = async (req, res) => {
    try {
        const { id } = req.params;
        const referrals = await referBusinessModel.findOne({
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
        const { status, comment } = req.body;

      
        const referral = await referBusinessModel.findByPk(id);
        if (!referral) {
            return res.status(404).json({ message: "Referral doesn't exist!" });
        }

        const newStatusEntry = {
            status: status || "", 
            comment: comment || "status changed",
            date: new Date().toLocaleString()
        };

       
        const updatedStatusCollection = [...(referral.status || []), newStatusEntry];

      
        await referBusinessModel.update(
            { status: updatedStatusCollection },
            { where: { id } }
        );

       
        res.status(200).json({
            message: 'Status updated successfully',
            data: {
                id: referral.id,
                fullname: referral.fullname,
                status: updatedStatusCollection 
            }
        });
    } catch (error) {
        console.error('Error updating referral status:', error);
        res.status(500).json({ message: 'An error occurred while updating status', error: error.message || error });
    }
};


module.exports = {createBusiness, getReferrals, getReferralsByBusinessId, updateReferralStatus}