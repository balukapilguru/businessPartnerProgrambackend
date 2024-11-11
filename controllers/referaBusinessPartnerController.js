
const referbusinessPartnerModel = require('../models/referbusinessPartnerModel');
// const Sequelize = require("sequelize")


const createBusiness = async (req, res) => {
    try {
        const { fullname, email, phonenumber, comment, businessPartnerId } = req.body;

  
        const existingReferralByEmail = await ReferreferbusinessPartnerModelbusinessPartnerModel.findOne({ where: { email } });
        if (existingReferralByEmail) {
            return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
        }

       
        const studentStatus = [{
            currentStatus: 'Pending', 
            status: 'Pending', 
            comment: comment || '',
            timestamp: new Date()
        }];

 
        const newReferral = await referbusinessPartnerModel.create({
            fullname,
            email,
            phonenumber,
            businessPartnerId,
            status: studentStatus 
        });

        res.status(201).json({ message: 'Refer business created successfully', data: newReferral });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};


const getReferrals = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            searchTerm = '',
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
                    ],
                },
                ...(status ? [{ status: { [Sequelize.Op.like]: `%${status}%` } }] : []),
                ...(businessPartnerId ? [{ businessPartnerId }] : []),
                filterClause, 
            ],
        };

        const referrals = await referbusinessPartnerModel.findAndCountAll({
            where: whereClause,
            order: [['id', 'DESC']],
            limit: size,
            offset: offset,
            attributes: ["id", 'fullname', 'email', 'phonenumber', 'businessPartnerId', "createdAt", "updatedAt"],
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



const getReferralsByBusinessId = async (req, res) => {
    try {
        const { id } = req.params;
        const referrals = await referbusinessPartnerModel.findAll({
            where: { 'id': id },  
            order: [['id', 'DESC']],  
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


module.exports = { createBusiness,getReferrals,getReferralsByBusinessId };


