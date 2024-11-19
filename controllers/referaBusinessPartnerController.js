const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config');
const jwt = require('jsonwebtoken');
const users = require('../models/bpp/users');
const nodemailer = require('nodemailer');
const referbusinessPartnerModel = require('../models/referbusinessPartnerModel');
const credentialDetails = require('../models/bpp/credentialDetails');
const Sequelize = require("sequelize")
// const Sequelize = require("sequelize")
let tempOtpStorage = [];

const transporter = nodemailer.createTransport({
    host: config.mailConfig.mailHost,
    port: config.mailConfig.port,
    secure: true,
    auth: {
        user: config.mailConfig.mailUser,
        pass: config.mailConfig.mailPass
    }
});

const generateBusinessPartnerID = async () => {
    try {
        const lastPartner = await credentialDetails.findOne({
            order: [['businessPartnerID', 'DESC']],
            attributes: ['businessPartnerID'],
        });

        if (!lastPartner) {
            return 'BP001';
        }

        const lastID = lastPartner.businessPartnerID;
        const numberPart = parseInt(lastID.replace('BP', ''), 10);

        if (isNaN(numberPart)) {
            throw new Error('Invalid business partner ID format');
        }

        const newID = `BP${(numberPart + 1).toString().padStart(3, '0')}`;
        return newID;

    } catch (error) {
        console.error('Error generating Business Partner ID:', error);
        throw new Error('Could not generate Business Partner ID');
    }
};

// const createBusiness = async (req, res) => {
//     try {
//         const { fullname, email, phonenumber, comment, businessPartnerId } = req.body;

  
//         const existingReferralByEmail = await ReferreferbusinessPartnerModelbusinessPartnerModel.findOne({ where: { email } });
//         if (existingReferralByEmail) {
//             return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
//         }

       
//         const studentStatus = [{
//             currentStatus: 'Pending', 
//             status: 'Pending', 
//             comment: comment || '',
//             timestamp: new Date()
//         }];

 
//         const newReferral = await referbusinessPartnerModel.create({
//             fullname,
//             email,
//             phonenumber,
//             businessPartnerId,
//             status: studentStatus 
//         });

//         res.status(201).json({ message: 'Refer business created successfully', data: newReferral });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'An error occurred', error });
//     }
// };
const createBusinessParent = async (req, res) => {
    try {
        const { fullName, email, phonenumber, parentbusinessPartnerId} = req.body;

        // Log incoming data
        console.log('Request body:', req.body);

        // Check if businessPartnerId is provided
        // if (!businessPartnerID) {
        //     return res.status(400).json({ message: 'businessPartnerId is required' });
        // }

        // Generate default password
        const generatePassword = () => {
            return crypto.randomBytes(8).toString('hex'); // 8 bytes = 16 characters
        };

        const defaultPassword = generatePassword();

        // Function to hash the password
        const hashPassword = async (password) => {
            return await bcrypt.hash(password, 10);
        };

        const hashedPassword = await hashPassword(defaultPassword);
        const businessPartnerID = await generateBusinessPartnerID();
        // Prepare the studentStatus array with the current status and comment
        const studentStatus = [{
            currentStatus: 'Pending',
            status: 'Pending',
            comment: comment || '',
            timestamp: new Date()
        }];

        // Log the data that will be sent to the referbusinessPartnerModel
        console.log('Creating new referral with:', {
            fullName,
            email,
            phonenumber,
            parentbusinessPartnerId,
            status: studentStatus
        });

        // Create a new user record in the users table
        const newUser = await users.create({
            fullName,
            email,
            phonenumber, // You can include additional fields as needed
            password: hashedPassword, // Save the hashed password directly to the users table
            status: 'active', // Set user status as active or any default status
            businessPartnerID // Associate the user with the businessPartnerId
        });

        // Create a new referral business partner record in the referbusinessPartnerModel
        // const newReferral = await referbusinessPartnerModel.create({
        //     fullname:fullName,
        //     email,
        //     phonenumber,
        //     parentbusinessPartnerId,
        //     businessPartnerID,
        //     status: studentStatus
        // });

        // Create a credential entry for the business partner in credentialDetails table
        await credentialDetails.create({
            password: hashedPassword,
            businessPartnerID: newReferral.businessPartnerID,
            userId: newUser.id, // Link the credential details to the user created above
            createdBy: ne.id,
            noOfLogins: 0,
            noOfLogouts: 0,
            referralLink: ''
        });

        // Send email to the business partner with the default password
        await transporter.sendMail({
            from: config.mailConfig.mailUser,
            to: email,
            subject: 'Your Default Password',
            text: `Congratulations, your referral business account has been created successfully. Your default password is: ${defaultPassword}`
        });

        // Return a success response
        res.status(201).json({
            message: 'Referral business created successfully and email with default password sent.',
            data: newReferral
        });
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


module.exports = { createBusinessParent,getReferrals,getReferralsByBusinessId };


