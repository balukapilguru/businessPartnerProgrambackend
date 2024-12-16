
// const referStudentmodel = require('../models/db/index');
const { Op } = require("sequelize")
// const statuses = require('../models/db/index'); 
const { ReferStudentmodel, Status, Sequelize } = require('../models/db/index'); 
const credentialDetails = require("../models/bpp/credentialDetails");
const course = require("../models/bpp/courses")
const studentCourses = require("../models/bpp/studentcourses")
// console.log(statuses)
const {getFormattedISTDateTime} = require('../utiles/encryptAndDecrypt')
const istDateTime = getFormattedISTDateTime();


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
            date:`${istDateTime.date}`,
            time: `${istDateTime.time}`,
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

const createReferral1 = async (req, res) => {
    try {
        const { fullname, email, contactnumber, city, courseRequired, changedBy, businessPartnerID } = req.body;
        const user = await credentialDetails.findOne({
            where: {
                businessPartnerID: businessPartnerID
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Business Partner not found.' });
        }

        const courseFound = await course.findOne({
            where: {
                courseName: courseRequired
            }
        });

        if (!courseFound) {
            return res.status(400).json({ message: 'Course not found.' });
        }

        const newReferral = await ReferStudentmodel.create({
            fullname,
            email,
            phonenumber: contactnumber,
            city,
            courseRequired: courseFound.id,
            businessPartnerId: businessPartnerID,
            bpstudents: user.dataValues.userId
        });

        await studentCourses.create({
            studentId: newReferral.id,
            courseId: courseFound.id
        });

        await Status.create({
            date:`${istDateTime.date}`,
            time: `${istDateTime.time}`,
            changedBy: changedBy || null,
            currentStatus: 'new lead',
            referStudentId: newReferral.id,
            comment: 'just created lead',
        });

        res.render('thankYou');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};

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





module.exports = { createReferral, getReferralsByStudentId,createReferral1 }