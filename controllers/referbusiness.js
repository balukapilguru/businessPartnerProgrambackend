
const referBusinessModel = require('../models/referBusiness');
const businessStatus = require('../models/status/BusinessStatus')
const Sequelize = require("sequelize")

const {getFormattedISTDateTime} = require('../utiles/encryptAndDecrypt')
const istDateTime = getFormattedISTDateTime();
const credentialDetails = require("../models/bpp/credentialDetails");

const createBusiness = async (req, res) => {
    try {
        const { fullname, email, contactnumber, serviceRequired, description, changedBy,  businessPartnerID, } = req.body;
        const user = await credentialDetails. findOne({
            where :{
                businessPartnerID: businessPartnerID
            }
        })
		
        // const existingReferralByEmail = await referBusinessModel.findOne({ where: { email } });
        // if (existingReferralByEmail) {
        //     return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
        // }
         const newReferral = await referBusinessModel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            serviceRequired,
            description,
            businessPartnerId:businessPartnerID,
            bpbussiness: user.dataValues.userId
        });
 
       const newStatus = await businessStatus.create({
        date:`${istDateTime.date}`,
        time: `${istDateTime.time}`,
            changedBy: changedBy || null,
            currentStatus: 'new lead',
            // referId: newReferral.id,
            comment:'just created lead',
            referbusinessId: newReferral.id
        });
											  
																		  
        res.status(201).json({ message: 'Referral created successfully', data: newReferral });
					  } catch (error) {
        console.error(error);
 
     res.status(500).json({ message: 'An error occurred', error: error.message });
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

module.exports = {createBusiness, getReferralsByBusinessId}