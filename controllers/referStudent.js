
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
        const { fullname, email, contactnumber, city, courseRequired, changedBy, businessPartnerID, encryptedParentPartnerId } = req.body;
        console.log(fullname, email, contactnumber, city, courseRequired, changedBy, businessPartnerID, encryptedParentPartnerId)
        const courseFound = await course.findOne({
            where: {
                courseName: courseRequired  // Fixed the typo from courseNmae to courseName
            }
        });
        if (!courseFound) {
            return res.status(400).json({ message: 'Course not found.' });
        }
        if(businessPartnerID){
console.log(businessPartnerID)
        const user = await credentialDetails. findOne({
            where :{
                businessPartnerID: businessPartnerID
            }
        })
    
        const newReferral = await ReferStudentmodel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            city,
              courseRequired: courseFound.id, 
            businessPartnerId:businessPartnerID || user.businessPartnerID,
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
    }
        else{																								
            const user = await credentialDetails.findOne({
                where :{
                    encryptedBPID: encryptedParentPartnerId
                }
            })
            console.log('userr',user)
				
        const newReferral = await ReferStudentmodel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            city,
              courseRequired: courseFound.id, 
            businessPartnerId:user.businessPartnerID || businessPartnerID,
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
        }

       

        // const existingReferralByEmail = await ReferStudentmodel.findOne({ where: { email } });
        // if (existingReferralByEmail) {
        //     return res.status(400).json({ message: 'Email is already taken. Please use a different one.' });
        // }

     
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error: error.message });
    }
};

const getReferralsByStudentId = async (req, res) => {
    try {
        const { id } = req.params;

        const referral = await ReferStudentmodel.findByPk(id, {
            include: [
                {
                    model: course,
                    attributes: ['courseName', 'coursePackage'] 
                }
            ],
            attributes: { exclude: ['status'] } 
        });

        if (referral) {
            res.status(200).json({
                message: 'Referrals retrieved successfully',
                data: referral
            });
        } else {
            res.status(404).json({ message: 'No referrals found for the given studentId' });
        }
    } catch (error) {
        console.error('Error retrieving referrals:', error);
        res.status(500).json({
            message: 'An error occurred while retrieving referrals',
            error: error.message
        });
    }
};






module.exports = { createReferral, getReferralsByStudentId }