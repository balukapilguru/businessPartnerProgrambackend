const bppUsers = require('../models/bpp/users');
const db = require('../models/db/index')
const { Op, where, DataTypes } = require('sequelize');
const crypto = require('crypto');
const credentialDetails = require('../models/bpp/credentialDetails');
const Personaldetails = require('../models/bpp/personaldetails')
const bankDetails = require('../models/bpp/bankdetails');
const statements = require('../models/bpp/statements')
const referBusinessModel = require('../models/referBusiness')
const referStudentsModel = require('../models/referStudent')
const statusesModel = require('../models/status/status')
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('../config');
const jwt = require('jsonwebtoken');
const upload = require('../middlewares/uploadMiddleware');
const s3 = require('../utiles/awsConfig');
const { JWT_SECRET } = require('../utiles/jwtconfig');
const { encrypt, decrypt } = require('../utiles/encryptAndDecrypt')
require('dotenv').config();
const { sequelize, fn } = require('sequelize');
const Role = db.Role;
const Module = db.Module;
const Permission = db.Permission;

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

const sendOtp = async (req, res) => {
    const { email, fullName, phonenumber } = req.body;
    try {
        const emailGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        tempOtpStorage.push({
            email,
            otp: emailGeneratedOtp,
            expiresAt: Date.now() + 9 * 60 * 1000
        });
        await transporter.sendMail({
            from: config.mailConfig.mailUser,
            to: email,
            subject: 'Email Verification OTP',
            text: `Your OTP for email verification is: ${emailGeneratedOtp}`
        });
        return res.status(200).json({
            message: 'OTP sent to your email for verification',
            user: {
                fullName,
                email,
                 phonenumber
            }
        });
    } catch (error) {
        console.error('Error details:', error);
        return res.status(500).json({ message: 'Error during OTP generation or email sending', error });
    }
};

const verifyOtpAndRegisterUser = async (req, res) => {
    const { email, emailOtp, fullName, phonenumber } = req.body;
    try {
        const storedOtpData = tempOtpStorage.find(otpData => otpData.email === email);
        if (storedOtpData) {
            if (storedOtpData.otp === emailOtp && Date.now() < storedOtpData.expiresAt) {

                tempOtpStorage = tempOtpStorage.filter(otpData => otpData.email !== email);
                const generatePassword = () => {
                    return crypto.randomBytes(8).toString('hex');
                };

                const hashPassword = async (password) => {
                    return await bcrypt.hash(password, 10);
                };

                const defaultPassword = generatePassword();
                const hashedPassword = await hashPassword(defaultPassword);
                const businessPartnerID = await generateBusinessPartnerID();
                const generateRefferal = await generateReferralLink(businessPartnerID);
                const link1 = generateRefferal.link1;
                const link2 = generateRefferal.link2;

                console.log('Referral Link 1:', link1);
                console.log('Referral Link 2:', link2);
                console.log('Link is', generateRefferal);
                const user = await bppUsers.create({
                    fullName,
                    email,
                    phonenumber,
                    roleId: 1
                }).catch(error => {
                    console.error('Error while saving user to the bppUsers table:', error.message || error);
                    throw new Error('Error while saving user to the bppUsers table');
                });
                await credentialDetails.create({
                    password: hashedPassword,
                    businessPartnerID,
                    userId: user.id,
                    createdBy: null,
                    noOfLogins: 0,
                    noOfLogouts: 0,
                    referralLink: link1,
                    businessReferralLink: link2
                }).catch(error => {
                    console.error('Error while saving business partner ID to credentialDetails:', error.message || error);
                    throw new Error('Error while saving business partner ID to credentialDetails');
                });
                await transporter.sendMail({
                    from: config.mailConfig.mailUser,
                    to: email,
                    subject: 'Verification Successful',
                    text: `Congratulations, your email has been successfully verified! Your default password is: ${defaultPassword}`
                });

                return res.status(200).json({
                    message: 'User registered and verified successfully. Check your email for the default password.',
                    user: { email, fullName, businessPartnerID, phonenumber },
                    redirectUrl: '/login',
                    // console.log("userdeatils",user)
                });
            } else {
                return res.status(400).json({ message: 'Invalid or expired OTP' });
            }
        } else {
            return res.status(400).json({ message: 'OTP not found or has expired' });
        }
    } catch (error) {
        console.error('Error during OTP verification or user registration:', error.message || error);
        return res.status(500).json({
            message: 'Error during OTP verification or user registration',
            error: error.message || 'Unknown error'
        });
    }
};

// const generateBusinessPartnerID = async () => {
//     try {
//         const lastPartner = await credentialDetails.findOne({
//             order: [['businessPartnerID', 'DESC']],
//             attributes: ['businessPartnerID'],
//         });

//         if (!lastPartner) {
//             return 'BP001';
//         }
//         const lastID = lastPartner.businessPartnerID;
//         const numberPart = parseInt(lastID.replace('BP', ''), 10);

//         if (isNaN(numberPart)) {
//             throw new Error('Invalid business partner ID format');
//         }
//         const newID = `BP${(numberPart + 1).toString().padStart(3, '0')}`;
//         return newID;
//         } catch (error) {
//         console.error('Error generating Business Partner ID:', error);
//         throw new Error('Could not generate Business Partner ID');
//     }
// };

// new function



const generateBusinessPartnerID = async () => {
    try {
        // Query the last business partner record
        const lastPartner = await credentialDetails.findOne({
            order: [['businessPartnerID', 'DESC']],
            attributes: ['businessPartnerID'],
        });

        // Default starting point for the new ID format
        let newID = 'KKHBP511';

        // If there are existing partners, generate the next ID
        if (lastPartner) {
            const lastID = lastPartner.businessPartnerID;

            // If the old ID format (BPXXX), start the new sequence with KKHBP501
            if (lastID.startsWith('BP')) {
                newID = 'KKHBP511';  // Starting point for the new format
            } else if (lastID.startsWith('KKHBP5')) {
                // For the new format IDs (KKHBPXXX), extract the numeric part and increment
                const numberPart = parseInt(lastID.replace('KKHBP5', ''), 10);
                if (isNaN(numberPart)) {
                    throw new Error('Invalid business partner ID format');
                }

                newID = `KKHBP5${(numberPart + 1).toString()}`;
            }
        }

        return newID;
    } catch (error) {
        console.error('Error generating Business Partner ID:', error);
        throw new Error('Could not generate Business Partner ID');
    }
};











const generateReferralLink = async (businessPartnerID) => {
    const baseURL = 'http://localhost:3050/api/auth/decrypt';
    const baseURL2 = 'http://localhost:3050/api/auth/decryptFun';
    const encrypted = encrypt(businessPartnerID);
    const res = encrypted?.encryptedData;
    // const iv = encrypted?.iv;
    // const encodedKey = encrypted?.key; 

    // console.log('iv is ', iv);
    // console.log('key is', encodedKey);

    // return `${baseURL}/${iv}/${res}/${encodedKey}`; 
    const link1 = `${baseURL}/?search=${res}`;
    const link2 = `${baseURL2}/?search=${res}`;

    return {
        link1,
        link2
    };
};

// const generateToken = (userId) => {
//     const secretKey = process.env.JWT_SECRET || 'your-secret-key';  
//     return jwt.sign({ userId }, secretKey, { expiresIn: '3h' });  
// };

const generateToken = (user) => {
    const payload = { id: user.id, email: user.email, roleId: user.roleId };
    const secret = process.env.JWT_SECRET || 'secret';
    const options = { expiresIn: '24h' };
    const token = jwt.sign(payload, secret, options);
    return token;
};

const login = async (req, res) => {
    const { email, password, } = req.body;
     
    try {
        console.log("Received email:", email);
        console.log("Received password:", password);
        const user = await bppUsers.findOne({ where: { email } });

       console.log(user.dataValues.roleId)
       const roleDetails = await Role.findOne({
        where:{
            id:user.dataValues.roleId
        },
        include: [{
            model: Permission,
            as: 'permissions',
            include: [{
              model: Module,
              as: 'modules',
              attributes: ['name']
            }],
            attributes: ['all', 'canCreate', 'canRead', 'canUpdate', 'canDelete']
          }]
       })
       console.log(roleDetails)
       const simplifiedRole = {
        id: roleDetails.id,
        name: roleDetails.name,
        description: roleDetails.description,
        selectedDashboard: roleDetails.selectedDashboard,
        Permissions: roleDetails.permissions.map(permission => ({
            module: permission.modules.length ? permission.modules[0].name : null,
            all: permission.all,
            canCreate: permission.canCreate,
            canRead: permission.canRead,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
          }))
    };
        if (!user) {
            console.error("User not found for email:", email);
            return res.status(400).json({ message: 'User not found' });
        }
        const credential = await credentialDetails.findOne({ where: { userId: user.id } });

        if (!credential || !credential.password) {
            console.error("No credentials or password found for user ID:", user.id);
            return res.status(400).json({ message: 'No credentials found or password missing' });
        }
        const isPasswordValid = await bcrypt.compare(password, credential.password);

        if (!isPasswordValid) {
            console.error("Invalid password for email:", email);
            return res.status(400).json({ message: 'Invalid password' });
        }
        await credentialDetails.increment('noOfLogins', { by: 1, where: { userId: user.id } });
        const updatedCredential = await credentialDetails.findOne({ where: { userId: user.id } });
        const token = generateToken(user);
        console.log({
            message: 'Login successful',
            role:simplifiedRole,
            user: {
                id: user.id,
                fullName: user.dataValues.fullName,
                phonenumber: user.phonenumber,
               
                businessPartnerID: updatedCredential.businessPartnerID,
                referralLink: updatedCredential.referralLink,
                businessReferralLink: updatedCredential.businessReferralLink,
                email,
                noOfLogins: updatedCredential.noOfLogins,
                isParentPartner: updatedCredential.isParentPartner,
            },
            token
        });
        return res.status(200).json({
            message: 'Login successful',
            role:simplifiedRole,
            user: {
                id: user.id,
                fullName:user.dataValues.fullName,
                phonenumber: user.phonenumber,
               
                businessPartnerID: updatedCredential.businessPartnerID,
                referralLink: updatedCredential.referralLink,
                businessReferralLink: updatedCredential.businessReferralLink,
                email,
                noOfLogins: updatedCredential.noOfLogins,
                isParentPartner: updatedCredential.isParentPartner,
            },
            token
        });
    } catch (error) {
        console.error("Error during login:", error.message);
        console.error("Error stack:", error.stack);
        return res.status(500).json({ message: 'Error during login', error: error.message });
    }
};

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const userId = req.user.id;
        const user = await bppUsers.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const credentials = await credentialDetails.findOne({ where: { userId: user.id } });
        if (!credentials) {
            return res.status(404).json({ message: 'Credentials not found' });
        }
        const isMatch = await bcrypt.compare(currentPassword, credentials.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        credentials.password = hashedPassword;
        await credentials.save();
        return res.status(200).json({ message: 'Password has been successfully updated' });
    } catch (error) {
        console.error('Error during change password', error);
        return res.status(500).json({ message: 'Error during change password', error });
    }
};

const decryptfun = async (req, res) => {
    try {
        // const { url } = req.body;
        // console.log('url is', url);

        // const parts = url.split('/');
        // const iv = parts[3];
        const encryptedData = req.query.search;
        // const encodedKey = parts[5];

        // console.log('iv is', iv);
        console.log('encryptedData is', encryptedData);
        // console.log('encodedKey is', encodedKey);

        // const decryptionKey = Buffer.from(encodedKey, 'hex');

        const decryptedData = decrypt({
            // iv,
            encryptedData,
            // key: decryptionKey,
        });
        console.log('Decrypted Data:', decryptedData);
        res.render('referStudent', { decryptedData });

    } catch (error) {
        console.error('Error during decryption:', error.message);
        return res.status(500).json({ error: 'Decryption failed' });
    }
};

const decryptfunction = async (req, res) => {
    try {
       
        const encryptedData = req.query.search;
        console.log('encryptedData is', encryptedData);
        const decryptedData = decrypt({
            encryptedData,
        });
        console.log('Decrypted Data:', decryptedData);
        res.render('referBusiness', { decryptedData });

    } catch (error) {
        console.error('Error during decryption:', error.message);
        return res.status(500).json({ error: 'Decryption failed' });
    }
};
const sendMail = require('../utiles/sendmailer');

// const credentialDetails = require('../models/bpp/credentialDetails');

const sendlinkforForgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        console.log('Received email:', email);
        const user = await bppUsers.findOne({ where: { email } });
        console.log('User found:', user);
        if (!user) {
            return res.status(404).json({ message: 'User not found with this email.' });
        }
        const resetToken = jwt.sign(
            { email: user.email },
            config.jwtConfig.jwtSecret,
            { expiresIn: '1h' }
        );
        console.log('Generated reset token:', resetToken);
        await bppUsers.update(
            { passwordResetToken: resetToken, passwordResetExpires: Date.now() + 3600000 },
            { where: { email: email } }
        );
        console.log('Token saved to database');
        const resetLink = `${config.config.frontendUrl}/auth/resetpassword?token=${resetToken}`;
        console.log('Reset link:', resetLink);
        await sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>Click the link below to reset your password:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
            `
        });
        console.log('Password reset email sent');
        return res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error in forgot password:', error);
        return res.status(500).json({ message: 'Error processing your request.', error: error.message });
    }
};
const passwordResetStore = {};

const forgotPasswordrecet = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;
    try {
        const decoded = jwt.verify(token, config.jwtConfig.jwtSecret);
        const user = await bppUsers.findOne({ where: { email: decoded.email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await credentialDetails.update(
            { password: hashedPassword },
            { where: { userId: user.id } }
        );

        return res.status(200).json({ message: 'Password successfully updated' });
    } catch (error) {
        console.error('Error in resetting password:', error);
        return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
}

const sendPasswordResetToken = async (userEmail) => {
    const token = generateResetToken();
    const expires = Date.now() + 3600000;
    passwordResetStore[token] = { email: userEmail, expires };
    return token;
};

const personaldetails = async (req, res) => {
    upload.single('image')(req, res, async (err) => {
        if (err) {
            console.error('Error during file upload:', err);
            return res.status(400).json({ error: 'Error during file upload', details: err.message });
        }
        try {
            const {
                address,
                panCardNO,
                contactNo,
                whatapp_no,
                aadharNo,
                businessName,
                cin_no,
                gst_no,
                bankName,
                holder_name,
                account_no,
                ifsc_code,
                branch
            } = req.body;
            if (!address || !contactNo || !whatapp_no) {
                return res.status(400).json({ error: 'Required fields are missing' });
            }
            const { id } = req.user;
            const imageUrl = req.file
                ? req.uploadedFileKey
                : null;

            const newDetails = await Personaldetails.create({
                address,
                panCardNO,
                contactNo,
                whatapp_no,
                aadharNo,
                businessName: businessName || null,
                cin_no: cin_no || null,
                gst_no: gst_no || null,
                profileId: id,
                image: imageUrl,
            });

            let newBankDetails = null;
            if (bankName || holder_name || account_no || ifsc_code || branch) {
                newBankDetails = await bankDetails.create({
                    bankName,
                    holder_name,
                    account_no,
                    ifsc_code,
                    branch,
                    userId: id,
                });
            }

            return res.status(201).json({
                message: 'Personal details and bank details saved successfully',
                personalDetails: newDetails,
                bankDetails: newBankDetails,
            });
        } catch (error) {
            console.error('Error while saving personal details:', error);
            return res.status(500).json({
                error: 'An error occurred while saving personal details',
                details: error.message,
            });
        }
    });
};

const updatePersonalAndBankDetails = async (req, res) => {
    try {
        upload.single('image')(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ error: err.message });
            }
            const { id } = req.params;
            const {
                address,
                panCardNO,
                contactNo,
                whatapp_no,
                aadharNo,
                businessName,
                cin_no,
                gst_no,
                bankName,
                holder_name,
                account_no,
                ifsc_code,
                branch,
            } = req.body;
            const personalDet = await Personaldetails.findOne({
                where: { profileId: id },
            });

            if (!personalDet) {
                return res.status(404).json({ error: 'User not found' });
            }


            const personalDetailsUpdate = await Personaldetails.update(
                {
                    address: address || personalDet.address,
                    panCardNO: panCardNO || personalDet.panCardNO,
                    contactNo: contactNo || personalDet.contactNo,
                    whatapp_no: whatapp_no || personalDet.whatapp_no,
                    aadharNo: aadharNo || personalDet.aadharNo,
                    businessName: businessName || personalDet.businessName,
                    cin_no: cin_no || personalDet.cin_no,
                    gst_no: gst_no || personalDet.gst_no,
                },
                {
                    where: { profileId: id },
                    returning: true,
                }
            );


            const bankDetailsUpdate = await bankDetails.update(
                {
                    bankName: bankName || personalDet.bankName,
                    holder_name: holder_name || personalDet.holder_name,
                    account_no: account_no || personalDet.account_no,
                    ifsc_code: ifsc_code || personalDet.ifsc_code,
                    branch: branch || personalDet.branch,
                },
                {
                    where: { userId: id },
                    returning: true,
                }
            );


            if (req.file) {
                const updatedProfileImage = await Personaldetails.update(
                    { image: req.uploadedFileKey },
                    { where: { profileId: id } }
                );
            }

            return res.status(200).json({
                message: 'Personal and bank details updated successfully',
                //   personalDetails: personalDetailsUpdate[1],
                //   bankDetails: bankDetailsUpdate[1],
                userId: personalDet.profileId,
                address,
                image: req.uploadedFileKey,
                panCardNO,
                contactNo,
                whatapp_no,
                aadharNo,
                businessName,
                cin_no,
                gst_no,
                bankName,
                holder_name,
                account_no,
                ifsc_code,
                branch,
            });
        });
    } catch (error) {
        console.error('Error while updating details:', error);
        return res.status(500).json({
            error: 'An error occurred while updating the details',
            details: error.message,
        });
    }
};

const getPersonalDetailsById = async (req, res) => {
    try {
        const { id } = req.params;
        const personalDetails = await Personaldetails.findOne({
            where: { profileId: id },
            attributes: [
                ['profileId', 'id'],
                'gst_no',
                'cin_no',
                'wallet',
                'image',
                'businessName',
                'aadharNo',
                'whatapp_no',
                'contactNo',
                'panCardNO',
                'address'
            ]
        });

        if (!personalDetails) {
            return res.status(404).json({ error: 'No personal details found for the given ID' });
        }
        const userDetails = await bppUsers.findOne({
            where: { id: personalDetails.id },
            attributes: ['fullName', 'email', 'phonenumber'],
        });
        const credentialDetailsofusers = await credentialDetails.findOne({
            where: { userId: personalDetails.id },
            attributes: [
                'createdBy',
                'addedBy',
                'noOfLogins',
                'referralLink',
                'businessPartnerID',
            ],
        });
        const bankDetailsRecord = await bankDetails.findOne({
            where: { userId: personalDetails.id },
            attributes: ['bankName', 'holder_name', 'account_no', 'ifsc_code', 'branch'],
        });
        const combinedDetails = {
            personalDetails: personalDetails.toJSON(),
            userDetails,
            credentialDetails: credentialDetailsofusers,
            bankDetails: bankDetailsRecord,
        };

        return res.status(200).json({
            message: 'Personal details retrieved successfully',
            data: combinedDetails,
        });
    } catch (error) {
        console.error('Error while retrieving personal details:', error);
        return res.status(500).json({
            error: 'An error occurred while retrieving personal details',
            details: error.message,
        });
    }
};


// become a parent partner
const addBusinessPartner = async (req, res) => {
    try {
        const { fullName, email, phonenumber, ParentbusinessPartnerId } = req.body;
        console.log('Request body:', req.body);
        const referringBusinessPartner = await credentialDetails.findOne({
            where: { businessPartnerID: ParentbusinessPartnerId }
        });
        console.log(referringBusinessPartner.dataValues.isParentPartner,'opopop')
        if (!referringBusinessPartner) {
            return res.status(400).json({ message: 'Invalid parent business partner ID.' });
        }
        const generatePassword = () => {
            return crypto.randomBytes(8).toString('hex');
        };

        const defaultPassword = generatePassword();
        const hashPassword = async (password) => {
            return await bcrypt.hash(password, 10);
        };

        const hashedPassword = await hashPassword(defaultPassword);
        const businessPartnerID = await generateBusinessPartnerID();
        const generateRefferal = await generateReferralLink(businessPartnerID);
        console.log(generateRefferal)
        const link1 = generateRefferal.link1;
        const link2 = generateRefferal.link2;

        console.log('Referral Link 1:', link1);
        console.log('Referral Link 2:', link2);
        // const studentStatus = [{
        //     currentStatus: 'Pending',
        //     status: 'Pending',
        //     comment: '',
        //     timestamp: new Date()
        // }];

        console.log('Creating new referral with:', {
            fullName,
            email,
            phonenumber,
            // parentbusinessPartnerId,
            // status: studentStatus
        });


        const newUser = await bppUsers.create({
            fullName,
            email,
            phonenumber,
            // password: hashedPassword,
            // status: 'active',
            roleId: 1
        });


        await credentialDetails.create({
            password: hashedPassword,
            businessPartnerID: businessPartnerID,
            userId: newUser.id,
            createdBy: referringBusinessPartner.userId,
            addedBy: ParentbusinessPartnerId,
            noOfLogins: 0,
            noOfLogouts: 0,
            referralLink: link1,
            businessReferralLink: link2,
        });


        await transporter.sendMail({
            from: config.mailConfig.mailUser,
            to: email,
            subject: 'Your Default Password',
            text: `Congratulations, your referral business account has been created successfully. Your default password is: ${defaultPassword}`
        });
        await credentialDetails.update({
            // businessPartnerID: ParentbusinessPartnerId,
            isParentPartner: true
        }, {
            where: { id: referringBusinessPartner.id || referringBusinessPartner.dataValues.id}
        });
        res.status(201).json({
            message: 'Referral business created successfully and email with default password sent.',
            data: newUser,
            isParentPartner:referringBusinessPartner.dataValues.isParentPartner
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};



// const getAllBusinessPartners = async (req, res) => {
//     try {
//         const { businessPartnerID } = req.params;  


//         if (!businessPartnerID) {
//             return res.status(400).json({ message: 'businessPartnerID is required.' });
//         }


//         const totalEnrollments = await credentialDetails.count({
//             where: { addedBy: businessPartnerID }  
//         });

//         if (totalEnrollments === 0) {
//             return res.status(404).json({ message: 'No enrollments found for this business partner.' });
//         }

//         const enrollmentAmount = 1000;  
//         const totalIncome = totalEnrollments * enrollmentAmount;

//         const revenueSharePercentage = 0.2;  
//         const revenueShare = totalIncome * revenueSharePercentage;



//         res.status(200).json({
//             message: 'Total enrollments retrieved successfully.',
//             businessPartnerID,
//             totalEnrollments, 
//             totalIncome,
//             revenueShare
//         });
//     } catch (error) {
//         console.error('Error in getTotalEnrollments:', error);  
//         res.status(500).json({
//             message: 'An error occurred',
//             error: error.message || error,  
//         });
//     }
// };



const getAllBusinessPartners = async (req, res) => {
    try {
        const { businessPartnerID } = req.params;
        if (!businessPartnerID) {
            return res.status(400).json({ message: 'businessPartnerID is required.' });
        }

        const totalReferrals = await referStudentsModel.count({
            where: { bpstudents: businessPartnerID }
        });
        if (totalReferrals === 0) {
            return res.status(404).json({ message: 'No students referred by this business partner.' });
        }
        const enrollmentAmount = 1000;
        const totalIncome = totalReferrals * enrollmentAmount;
        const revenueSharePercentage = 0.2;
        const revenueShare = totalIncome * revenueSharePercentage;
        const existingCredentials = await credentialDetails.findOne({ where: { userId: businessPartnerID }})
            res.status(200).json({
                message: 'Total referrals retrieved successfully.',
                businessPartnerID: existingCredentials.businessPartnerID,
                totalReferrals,
                totalIncome,
                revenueShare
            });
    } catch (error) {
        console.error('Error in getAllBusinessPartners:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message || error,
        });
    }
};












// users api  for sales 


//   createUserlogin = async (req, res) => {
//     try {
//       const { fullName, emailId, phoneNumber, roleId } = req.body;
  
  

//       const rolersDetails = await Role.findOne({
//         where :{
//           name: roleId
//         }
//       })

//       const roleuser = await bppUsers.create({
//          fullName,
//           emailId,
//            phoneNumber,
//            roleId:rolersDetails.id
//          });


// const rolesusers = await credentialDetails.create({
//     fullName,
//     emailId,
//      phoneNumber,
//      roleId:rolersDetails.id
// })

//       res.status(201).json({ message: 'User created successfully!', data: user });
//     } catch (error) {
//       res.status(500).json({ message: 'Error creating user', error: error.message });
//     }
//   };

// const createUserlogin = async (req, res) => {
//     try {
//         const { fullName, emailId, phoneNumber, rolename } = req.body;

//         // Ensure Role.findOne works
//         const roleDetails = await Role.findOne({
//             where: { name: rolename },
//         });

//         if (!roleDetails) {
//             return res.status(400).json({ message: 'Invalid role provided' });
//         }

//         // const existingUser = await bppUsers.findOne({ where: { emailId } });
//         // if (existingUser) {
//         //     return res.status(400).json({ message: 'User already exists with this email' });
//         // }

//         const defaultPassword = crypto.randomBytes(8).toString('hex');
//         const hashedPassword = await bcrypt.hash(defaultPassword, 10);

//         const user = await bppUsers.create({
//             fullName,
//             emailId,
//             phoneNumber,
//             roleId: roleDetails.id,
//         });

//         await credentialDetails.create({
//             password: hashedPassword,
//             emailId,
//             userId: user.id,
//             noOfLogins: 0,
//             noOfLogouts: 0,
//         });

//         await transporter.sendMail({
//             from: config.mailConfig.mailUser,
//             to: emailId,
//             subject: 'Welcome! Your Account Has Been Created',
//             text: `Hi ${fullName},\n\nYour account has been created successfully. Your default password is: ${defaultPassword}.\n\nPlease log in and change your password immediately.\n\nBest regards,\nTeam`,
//         });

//         return res.status(201).json({ message: 'User created successfully!', user });
//     } catch (error) {
//         console.error('Error creating user:', error.message || error);
//         return res.status(500).json({ message: 'Error creating user', error: error.message });
//     }
// };

const createUserlogin = async (req, res) => {
    try {
        const { fullName, email, phonenumber, rolename } = req.body;

       
        if (!fullName || !email || !phonenumber || !rolename) {
            return res.status(400).json({ message: 'All fields are required.' });
        }
        
        const roleDetails = await Role.findOne({
            where: { name: rolename },
        });

        if (!roleDetails) {
            return res.status(400).json({ message: 'Invalid role name provided.' });
        }

       
        const existingUser = await bppUsers.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }
        const defaultPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);
        const user = await bppUsers.create({
            fullName,
            email,
            phonenumber,
            roleId: roleDetails.id, 
        });

        await credentialDetails.create({
            password: hashedPassword,
            email,
            userId: user.id,
            noOfLogins: 0,
            noOfLogouts: 0,
        });

        await transporter.sendMail({
            from: config.mailConfig.mailUser,
            to: email,
            subject: 'Welcome! Your Account Has Been Created',
            text: `Hi ${fullName},\n\nYour account has been created successfully. Your default password is: ${defaultPassword}.\n\nPlease log in and change your password immediately.\n\nBest regards,\nTeam`,
        });

        return res.status(201).json({
            message: 'User created successfully!',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                roleId: roleDetails.id,
            },
        });
    } catch (error) {
        console.error('Error creating user:', error.message || error);
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};


const getUserLogin = async (req, res) => {
    try {
     const users = await bppUsers.findAndCountAll({
            include: [
                {
                    model: Role,
                    as: 'Role', 
                    attributes: ['id', 'name'], 
                },
            ],
       
        });
        
        return res.status(200).json({
            message: 'Users retrieved successfully!',
            data: users.rows,
            totalUsers: users.count,
            currentPage: page,
            totalPages: Math.ceil(users.count / limit),
        });
    } catch (error) {
        console.error('Error retrieving users:', error.message || error);
        return res.status(500).json({ message: 'Error retrieving users', error: error.message });
    }
};






module.exports = {
    login,
    sendOtp,
    verifyOtpAndRegisterUser,
    changePassword,
    sendlinkforForgotPassword,
    forgotPasswordrecet,
    sendPasswordResetToken,
    personaldetails,
    updatePersonalAndBankDetails,
    decryptfun,
    decryptfunction,
    addBusinessPartner,
    getPersonalDetailsById,
    getAllBusinessPartners,
    createUserlogin,getUserLogin
};
























































































































































