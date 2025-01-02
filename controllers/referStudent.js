// const referStudentmodel = require('../models/db/index');
const { Op } = require("sequelize")
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const courses = require("../models/bpp/courses")
// const statuses = require('../models/db/index'); 
const { ReferStudentmodel, Status, Sequelize } = require('../models/db/index'); 
const credentialDetails = require("../models/bpp/credentialDetails");
const course = require("../models/bpp/courses")
const studentCourses = require("../models/bpp/studentcourses")
const bppUsers = require("../models/bpp/users")
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
        const existingContact = await ReferStudentmodel.findOne({
            where: { phonenumber: contactnumber }
        });

        if (existingContact) {
            return res.status(400).json({
                message: 'The contact number is already taken. Please use a different one.'
            });
        }
        if(businessPartnerID){
console.log(businessPartnerID)
        const user = await credentialDetails. findOne({
            where :{
                businessPartnerID: businessPartnerID
            }
        })
		console.log('checking',user.userId)
    const bpuserdetails = await bppUsers.findOne({
            where :{
                id: user.userId
            }
        })
        console.log( bpuserdetails.fullName,'vcheck')
        const newReferral = await ReferStudentmodel.create({
            fullname,
            email,
            phonenumber:contactnumber,
            city,
              courseRequired: courseFound.id, 
            businessPartnerId:businessPartnerID || user.businessPartnerID,
            bpstudents: user.dataValues.userId,
			businessPartnerName : bpuserdetails.fullName
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
			console.log('checking2',user.userId)
    const bpuserdetails = await bppUsers.findOne({
            where :{
                id: user.userId
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
            bpstudents: user.dataValues.userId,
			
			businessPartnerName : bpuserdetails.fullName
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



const addCSV = async (req, res) => {
    const { businessPartnerID } = req.body;
    const filePath = req.file?.path;
 
    if (!businessPartnerID) {
        return res.status(400).json({ error: 'Business Partner ID is required.' });
    }
 
    try {
        if (!filePath) {
            return res.status(400).json({ error: 'File is required.' });
        }
 
        const resolvedPath = path.resolve(filePath);
        console.log('Resolved file path:', resolvedPath);
 
        const results = [];
        const errors = [];
        let successfulRecords = 0;
 
        fs.createReadStream(resolvedPath)
            .pipe(csv())
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', async () => {
                console.log('Finished reading file.');
 
                for (const row of results) {
                    try {
                        // Check if the student already exists
                        const existingStudent = await ReferStudentmodel.findOne({
                            where: { phonenumber: row.phonenumber },
                        });
 
                        if (existingStudent) {
                            errors.push({
                                row,
                                error: `Duplicate record: Student with phone number ${row.phonenumber} already exists.`,
                            });
                            continue; // Skip duplicate record
                        }
 
                        // Process the row as a new referral
                        const user = await credentialDetails.findOne({
                            where: { businessPartnerID: businessPartnerID },
                        });
                        if (!user) {
                            throw new Error(`No user found with businessPartnerID: ${businessPartnerID}`);
                        }
 
                        const course = await courses.findOne({
                            where: { courseName: row.courseRequired },
                        });
                        if (!course) {
                            throw new Error(`No course found with name: ${row.courseRequired}`)
                        }
 
                        const bpuserdetails = await bppUsers.findOne({
                            where: { id: user.userId },
                        });
 
                        const newReferral = await ReferStudentmodel.create({
                            fullname: row.fullname,
                            email: row.email,
                            phonenumber: row.phonenumber,
                            city: row.city,
                            courseRequired: course.id,
                            businessPartnerId: businessPartnerID || user.businessPartnerID,
                            bpstudents: user.dataValues.userId,
                            businessPartnerName: bpuserdetails.fullName,
                        });
 
                        await studentCourses.create({
                            studentId: newReferral.id,
                            courseId: course.id,
                        });
 
                        await Status.create({
                            date: `${istDateTime.date}`,
                            time: `${istDateTime.time}`,
                            changedBy: null,
                            currentStatus: 'new lead',
                            referStudentId: newReferral.id,
                            comment: 'just created lead',
                        });
 
                        console.log(`Saved record: ${JSON.stringify(newReferral)}`);
                        successfulRecords++;
                    } catch (err) {
                        console.error(`Error processing row: ${JSON.stringify(row)}`, err.message);
                        errors.push({ row, error: err.message });
                    }
                }
 
                fs.unlink(resolvedPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting file:', unlinkErr.message);
                    } else {
                        console.log('File deleted successfully.');
                    }
                });
 
                if (successfulRecords === 0 && errors.length > 0) {
                    // If no records were successfully saved and there are errors
                    res.status(404).json({
                        message: 'All records in the CSV were duplicates or invalid.',
                        errors,
                    });
                } else if (errors.length > 0) {
                    // If some records were saved but some failed
                    res.status(200).json({
                        message: 'CSV processed with some errors.',
                        successfulRecords,
                        errors,
                    });
                } else {
                    // If all records were successfully saved
                    res.status(200).json({
                        message: 'CSV processed successfully.',
                        successfulRecords,
                    });
                }
            })
            .on('error', (err) => {
                res.status(500).json({ error: 'Error reading the CSV file.', details: err.message });
            });
    } catch (error) {
        res.status(500).json({
            error: 'An error occurred while processing the file.',
            details: error.message,
        });
    }
}; 








module.exports = { createReferral, getReferralsByStudentId , addCSV}