const bppUsers = require('../models/bpp/users');
const db = require('../models/db/index')
const { Op, where, DataTypes,literal, models, query,QueryTypes } = require('sequelize');
const seq = require('../config/db');
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
const OTP = db.otp
const coursesModel = require('../models/bpp/courses')
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
    const { email, fullName, phonenumber,contactnumber } = req.body;
    
    try {
        const user = await bppUsers.findOne({ where: { email } });

        if (user) {
            return res.status(400).json({
                message: 'Email is already in use.',
                user: {
                    fullName,
                    email,
                    phonenumber,
                    contactnumber
                }
            });
        }

        const emailGeneratedOtp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 3 * 60 * 1000);  


        
        const [otpEntry, created] = await OTP.findOrCreate({
            where: { email: email },
            defaults: { otp: emailGeneratedOtp, expiresAt: otpExpiresAt }
        });

        if (!created) {
           await otpEntry.update({ otp: emailGeneratedOtp, expiresAt: otpExpiresAt });
        }
    await transporter.sendMail({
    from: config.mailConfig.mailUser,
    to: email,
    subject: 'OTP for Teks Academy Business Partner Account',
    html: `<h1>OTP Verification</h1>
           <p>Dear <b>${fullName}</b>,</p>
           <p>A one-time password (OTP) for verifying your Teks Academy business partner account is:</p>
           <p><b>OTP: ${emailGeneratedOtp}</b></p>
           <p>This OTP is valid for the next 1 minute. Please complete the verification process promptly.</p>
           <p>If you did not request this, please contact our support team immediately.</p>
           <p>Support Team: <b> 9133308351 </b> / <a href='mailto:support@teksacademy.com'>support@teksacademy.com</a></p>
           <p>Thank you,</p>
           <p><b>Teks Academy</b></p>`
});

        return res.status(200).json({
            message: 'OTP sent to your email for verification',
            user: {
                fullName,
                email,
                 phonenumber,
                 contactnumber
            }
        });
    } catch (error) {
        console.error('Error details:', error);
        return res.status(500).json({ message: 'Error during OTP generation or email sending', error });
    }
};

const verifyOtpAndRegisterUser = async (req, res) => {
    const { email, emailOtp, fullName, phonenumber,contactnumber } = req.body;
    try {
        const user = await bppUsers.findOne({ where: { email } });

        if (user) {
         
            return res.status(200).json({
                message: 'Email is already in use.',
                user: {
                    fullName,
                    email,
                    phonenumber,
                    contactnumber
                }
            });
        }
        const storedOtpData = await OTP.findOne({ where: { email: email } });
        if (storedOtpData) {
            if (storedOtpData.otp === emailOtp && Date.now() < storedOtpData.expiresAt) {

                tempOtpStorage = tempOtpStorage.filter(otpData => otpData.email !== email);
                const generatePassword = () => {
                    return crypto.randomBytes(8).toString('hex');
                };

                const hashPassword = async (password) => {
                    return await bcrypt.hash(password, 10);
                };

                // const defaultPassword = generatePassword();
                const defaultPassword = email.split('@')[0];
                const hashedPassword = await hashPassword(defaultPassword);
                const businessPartnerID = await generateBusinessPartnerID();
                const encryptedID = encrypt(businessPartnerID).encryptedData;
                // const generateRefferal = await generateReferralLink(businessPartnerID);
                
                // const link1 = generateRefferal.link1;
                // const link2 = generateRefferal.link2;
                const loginPageUrl = `https://www.partners.teksacademy.com/auth/login`
                const link1 = `https://www.partners.teksacademy.com/auth/studentForm/${encryptedID}`
                const link2 = `https://www.partners.teksacademy.com/auth/businessForm/${encryptedID}`
                console.log('Referral Link 1:', link1);
                console.log('Referral Link 2:', link2);
                const roleDetails = await Role.findOne({
                    where: { name: 'Business Partner' },
                });
                
                const user = await bppUsers.create({
                    fullName,
                    email,
                    phonenumber:phonenumber||contactnumber,
                    roleId: roleDetails.id || 2
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
                    businessReferralLink: link2,
                    encryptedBPID: encryptedID,
                    BpStatus: "New Business Partner"
                }).catch(error => {
                    console.error('Error while saving business partner ID to credentialDetails:', error.message || error);
                    throw new Error('Error while saving business partner ID to credentialDetails');
                });
                await transporter.sendMail({
                    from: config.mailConfig.mailUser,
                    to: email,
                    subject: 'Welcome to Teks Academy Business Partner Account',
                    html: `<p>Dear <b>${fullName}</b>,</p>
                           <p>Congratulations! Your Business Partner Account has been successfully created.</p>
                           <p>Below are your account credentials:</p>
                           <ul>
                               <li>Email: <b>${email}</b></li>
                               <li>Default Password: <b>${defaultPassword}</b></li>
                           </ul>
                               <p>You can log in to your account using the below link:</p>
         <p><b><a href="${loginPageUrl}" target="_blank">${loginPageUrl}</a></b></p>
                           <p>Below are the personalised Referal links to Refer Students and to Add Business Partner</p>
                           <ul>
                                <li>Student Referral Link:<b>${link1}</b></li>
                                <li>Add Business Partner Link:<b>${link2}</b>  </li>
                           </ul>
                           <p>For security reasons, we recommend updating your password and personal details when you first log in.</p>
                           <p>Please feel free to contact us with any questions or need help.</p>
                           <p>Support Team: <b> 9133308351 </b> / <a href='mailto:support@teksacademy.com'>support@teksacademy.com</a></p>
                            <p>Thank you,</p>
           <p><b>Teks Academy</b></p>`
                });
                

                return res.status(200).json({
                    message: 'User registered and verified successfully. Check your email for the default password.',
                    user: { email, fullName, businessPartnerID, phonenumber, contactnumber },
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


const generateBusinessPartnerID = async () => {
    try {
        const lastPartner = await credentialDetails.findOne({
            order: [['businessPartnerID', 'DESC']],
            attributes: ['businessPartnerID'],
        });
        let newID;
        if (!lastPartner || !lastPartner.businessPartnerID) {
            newID = 'KKHBP001';
        } else {
            const lastID = lastPartner.businessPartnerID;
            const numberPart = parseInt(lastID.replace('KKHBP', ''), 10);
            if (isNaN(numberPart)) {
                throw new Error('Invalid business partner ID format');
            }
            newID = `KKHBP${(numberPart + 1).toString()}`;
        }
        return newID;
    } catch (error) {
        console.error('Error generating business partner ID:', error);
        throw new Error('Error generating business partner ID');
    }
};





// const generateToken = (userId) => {
//     const secretKey = process.env.JWT_SECRET || 'your-secret-key';  
//     return jwt.sign({ userId }, secretKey, { expiresIn: '3h' });  
// };

const generateToken = (user) => {
    // console.log("Business Partner ID in user:", user.businessPartnerID);
    // console.log("User object:", user);

    const payload = { id: user.id, email: user.email, roleId: user.roleId, businessPartnerId: user.businessPartnerID};
    const secret = process.env.JWT_SECRET || 'secret';
    const options = { expiresIn: '24h' };
    const token = jwt.sign(payload, secret, options);
    return token;
};

const login = async (req, res) => {
    const { email, password,phoneNumber } = req.body;
     
    try {
        console.log("Received email:", email);
        console.log("Received password:", password);
        const user = await bppUsers.findOne({ where: { email } });
        console.log('Userrr',user)
       console.log(user?.dataValues?.roleId)
       const roleDetails = await Role.findOne({
        where:{
            id:user?.dataValues?.roleId
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
        // console.log(updatedCredential); 
        const token = generateToken(user);
        console.log({
            message: 'Login successful',
            role:simplifiedRole,
            user: {
                id: user.id,
                fullName: user.dataValues.fullName,
                phonenumber: user.phonenumber || user.contactnumber,
               
                businessPartnerID: updatedCredential.dataValues.businessPartnerID,
                referralLink: updatedCredential.referralLink,
                businessReferralLink: updatedCredential.businessReferralLink,
                email,
                noOfLogins: updatedCredential.noOfLogins,
                isParentPartner: updatedCredential.isParentPartner,
                encryptedBPID: updatedCredential.encryptedBPID
            },
            token
        });
        return res.status(200).json({
            message: 'Login successful',
            role:simplifiedRole,
            user: {
                id: user.id,
                fullName:user.dataValues.fullName,
                phonenumber: user.phonenumber || user.contactnumber,
                // businessPartnerID: updatedCredential.dataValues.businessPartnerID,
                businessPartnerID: updatedCredential.businessPartnerID,
                referralLink: updatedCredential.referralLink,
                businessReferralLink: updatedCredential.businessReferralLink,
                email,
                noOfLogins: updatedCredential.noOfLogins,
                isParentPartner: updatedCredential.isParentPartner,
                encryptedBPID: updatedCredential.encryptedBPID
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

const sendMail = require('../utiles/sendmailer');

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
            subject: 'Reset Your Teks Academy Business Partner Account Password',
            html: `
                <p>We received a request to reset your Teks Academy business partner account password. Use the below link to reset your password securely:</p>
                <p><a href="${resetLink}">Click Here to Reset Password</a></p>
                <p>If you didn’t make this request, please contact our support team immediately.</p>
                <p>Support Team:  9133308351  / <a href='mailto:support@teksacademy.com'>support@teksacademy.com</a></p>
                
                <p>Thank you,</p>
                <p>Teks Academy Team</p>
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
        // const {id} = req.params;
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
                branch,
                phonenumber
            } = req.body;
            // if (!address || !contactNo || !whatapp_no) {
            //     return res.status(400).json({ error: 'Required fields are missing' });
            // }
            const { id } = req.params;
            const imageUrl = req.file
                ? req.uploadedFileKey
                : null;

            const newDetails = await Personaldetails.create({
                address,
                panCardNO,
                contactNo: phonenumber || contactNo,
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
            console.log('Checking....',id)
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
        const { fullName, email, phonenumber, ParentbusinessPartnerId,encryptedParentPartnerId } = req.body;
        const existingUser = await bppUsers.findOne({ where: { email } });
        if (existingUser) {
            return res.status(404).json({ message: 'User already exists with this email.' });
        }

        console.log('Request body:', req.body, fullName, email, phonenumber, ParentbusinessPartnerId,encryptedParentPartnerId);
        const whereCondition = {
            [Op.or]: []
        };
        
        // Add conditions only if values are defined and not null
        if (ParentbusinessPartnerId) {
            whereCondition[Op.or].push({ businessPartnerID: ParentbusinessPartnerId });
        }
        if (encryptedParentPartnerId) {
            whereCondition[Op.or].push({ encryptedBPID: encryptedParentPartnerId });
        }
        
        // Check if we have valid conditions to query
        if (whereCondition[Op.or].length === 0) {
            return res.status(400).json({ message: 'No valid business partner IDs provided.' });
        }
        
        // Query the referring business partner
        const referringBusinessPartner = await credentialDetails.findOne({
            where: whereCondition
        });
        
        if (!referringBusinessPartner) {
            return res.status(404).json({ message: 'No matching business partner found.' });
        }
        
        console.log('Referring Business Partner:', referringBusinessPartner);
        
        console.log(referringBusinessPartner.dataValues.isParentPartner,'opopop')
        if (!referringBusinessPartner) {
            return res.status(400).json({ message: 'Invalid parent business partner ID.' });
        }
        const generatePassword = () => {
            return crypto.randomBytes(8).toString('hex');
        };

        // const defaultPassword = generatePassword();
        const defaultPassword = email.split('@')[0];
        const hashPassword = async (password) => {
            return await bcrypt.hash(password, 10);
        };

        const hashedPassword = await hashPassword(defaultPassword);
        const businessPartnerID = await generateBusinessPartnerID();
        
        const encryptedID = encrypt(businessPartnerID).encryptedData;
        // const generateRefferal = await generateReferralLink(businessPartnerID);
        // console.log(generateRefferal)
        // const link1 = generateRefferal.link1;
        // const link2 = generateRefferal.link2;
       const loginPageUrl = `https://www.partners.teksacademy.com/auth/login`
        const link1 = `https://www.partners.teksacademy.com/auth/studentForm/${encryptedID}`
        const link2 = `https://www.partners.teksacademy.com/auth/businessForm/${encryptedID}`
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
        const roleDetails = await Role.findOne({
            where: { name: 'Business Partner' },
        });
        

        const newUser = await bppUsers.create({
            fullName,
            email,
            phonenumber,
            // password: hashedPassword,
            // status: 'active',
            roleId: roleDetails.id || 1
        });


        await credentialDetails.create({
            password: hashedPassword,
            businessPartnerID: businessPartnerID,
            userId: newUser.id,
            createdBy: referringBusinessPartner.userId,
            addedBy: referringBusinessPartner.businessPartnerID,
            noOfLogins: 0,
            noOfLogouts: 0,
            referralLink: link1,
            businessReferralLink: link2,
            encryptedBPID: encryptedID
        });


        await transporter.sendMail({
            from: config.mailConfig.mailUser,
            to: email,
            subject: 'Welcome to Teks Academy Business Partner Account',
            html: `<p>Dear <b>${fullName}</b>,</p>
                   <p>Congratulations! Your Business Partner Account has been successfully created.</p>
                   <p>Below are your account credentials:</p>
                   <ul>
                       <li>Email: <b>${email}</b></li>
                       <li>Default Password: <b>${defaultPassword}</b></li>
                   </ul>
                       <p>You can log in to your account using the below link:</p>
         <p><b><a href="${loginPageUrl}" target="_blank">${loginPageUrl}</a></b></p>
         <p>Below are the personalised Referal links to Refer Students and to Add Business Partner</p>
                           <ul>
                                <li>Student Referral Link:<b>${link1}</b></li>
                                <li>Add Business Partner Link:<b>${link2}</b>  </li>
                           </ul>          
         <p>For security reasons, we recommend updating your password and personal details when you first log in.</p>
                   <p>Please feel free to contact us with any questions or need help.</p>
                   <p>Support Team: <b> 9133308351 </b> / <a href='mailto:support@teksacademy.com'>support@teksacademy.com</a></p>
                    <p>Thank you,</p>
   <p><b>Teks Academy</b></p>`
        });
        // await credentialDetails.update({
        //     // businessPartnerID: ParentbusinessPartnerId,
        //     isParentPartner: true
        // }, {
        //     where: { id: referringBusinessPartner.id || referringBusinessPartner.dataValues.id}
        // });
        res.status(201).json({
            message: 'Referral business created successfully and email with default password sent.',
            data: newUser,
            // isParentPartner:true
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};

// const getAllBusinessPartnersall2 = async (req, res) => {
//     try {
//         const { count: totalRecords, rows: businessPartners } = await credentialDetails.findAndCountAll({
//             include: [
//                 {
//                     model: bppUsers,
//                     as: 'Creator', 
//                     required: true,
//                     where: {
//                         roleId: 2  
//                     }
//                 },
//                 {
//                     model: bppUsers,
                    
//                 }
//             ],
//             attributes:['businessPartnerID','userId'],
//             order: [['id', 'DESC']], 
//             limit: req.query.limit ? parseInt(req.query.limit) : 10, 
//             offset: req.query.offset ? parseInt(req.query.offset) : 0 
//         });

//         // Check if any records were found
//         if (!businessPartners.length) {
//             return res.status(404).json({ message: 'No business partners found.' });
//         }

//         // Responding with the business partners and pagination details
//         res.status(200).json({
//             message: 'Business partners retrieved successfully.',
//             data: businessPartners,
//             pagination: {
//                 totalRecords,
//                 currentPage: req.query.page ? parseInt(req.query.page) : 1,
//                 pageSize: req.query.limit ? parseInt(req.query.limit) : 10,
//                 totalPages: Math.ceil(totalRecords / (req.query.limit ? parseInt(req.query.limit) : 10))
//             }
//         });
//     } catch (error) {
//         console.error('Error fetching business partners:', error);
//         res.status(500).json({
//             message: 'An error occurred while retrieving business partners.',
//             error: error.message || error
//         });
//     }
// };
const getAllBusinessPartnersall2 = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const { search } = req.query;
        const searchCondition = search ? {
            [Op.or]: [
                { businessPartnerID: { [Op.like]: `%${search}%` } },
                { '$Creator.fullName$': { [Op.like]: `%${search}%` } },
                { '$bppUser.fullName$': { [Op.like]: `%${search}%` } },
                { '$bppUser.email$': { [Op.like]: `%${search}%` } },
                { '$bppUser.phoneNumber$': { [Op.like]: `%${search}%` } }
            ],
        } : {};

        const { count: totalRecords, rows: businessPartners } = await credentialDetails.findAndCountAll({
            include: [
                {
                    model: bppUsers,
                    as: 'Creator',
                    required: false,
                    attributes: [
                        'id', 'fullName', 'email', 'phoneNumber',
                        // [literal(`(
                        //     SELECT COUNT(*)
                        //     FROM referStudentmodel
                        //     WHERE bpstudents = credentialDetails.userId AND
                        //     (SELECT currentStatus FROM statuses WHERE referStudentId = referStudentmodel.id ORDER BY id DESC LIMIT 1) = 'enroll'
                        // )`), 'enrolledCount'],
                        // [literal(`(
                        //     SELECT COUNT(*)
                        //     FROM referStudentmodel
                        //     WHERE bpstudents = credentialDetails.userId
                        // )`), 'referredCount'],
                        // [literal(`(
                        //     SELECT GROUP_CONCAT(userId)
                        //     FROM credentialDetails AS subCred
                        //     WHERE subCred.createdBy = credentialDetails.userId
                        // )`), 'childUserIds'],
                    ]
                },
                {
                    model: bppUsers,
                    as: 'bppUser',
                    attributes: ['id', 'fullName', 'email', 'phoneNumber', 'roleId',[literal(`(
                        SELECT COUNT(*)
                        FROM referStudentmodel
                        WHERE bpstudents = credentialDetails.userId AND
                        (SELECT currentStatus FROM statuses WHERE referStudentId = referStudentmodel.id ORDER BY id DESC LIMIT 1) = 'enroll'
                    )`), 'enrolledCount'],
                    [literal(`(
                        SELECT COUNT(*)
                        FROM referStudentmodel
                        WHERE bpstudents = credentialDetails.userId
                    )`), 'referredCount'],
                    [literal(`(
                        SELECT GROUP_CONCAT(DISTINCT userId)
                        FROM credentialDetails AS subCred
                        WHERE subCred.createdBy = credentialDetails.userId
                    )`), 'childUserIds'],
                    
                    [literal(`(
                        SELECT COUNT(DISTINCT userId)
                        FROM credentialDetails AS subCred
                        WHERE subCred.createdBy = credentialDetails.userId
                    )`), 'addedPartners']
                ],
                    where:{roleID:2}
                }
            ],
            attributes:['businessPartnerID','BpStatus'],
            where: searchCondition,
            order: [['id', 'DESC']],
            limit: pageSize,
            offset: offset
        });

        if (businessPartners.length === 0) {
            return res.status(404).json({ message: 'No business partners found.' });
        }

        res.status(200).json({
            message: 'Business partners retrieved successfully.',
            data: businessPartners,
            pagination: {
                totalRecords,
                currentPage: page,
                pageSize: pageSize,
                totalPages: Math.ceil(totalRecords / pageSize)
            }
        });
    } catch (error) {
        console.error('Error fetching business partners:', error);
        res.status(500).json({
            message: 'An error occurred while retrieving business partners.',
            error: error.message || error
        });
    }
};



const getAllBusinessPartnersall = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = (page - 1) * pageSize;
        const limit = pageSize;
        const { search } = req.query;

     
        const searchCondition = search
            ? {
                  [Op.or]: [
                      { fullName: { [Op.like]: `%${search}%` } },
                      { email: { [Op.like]: `%${search}%` } },
                      { phoneNumber: { [Op.like]: `%${search}%` } },
                      { '$credentialDetail.businessPartnerID$': { [Op.like]: `%${search}%` } }, 
                  ],
              }
            : {};

            const { count: totalRecords, rows: businessPartners } = await bppUsers.findAndCountAll({
                distinct: true,
            col: 'id',
                where: {
                    roleId: 2,
                    ...searchCondition,
                },
                attributes: [
                    'id',
                    'fullName',
                    'email',
                    'phoneNumber',
                    [literal(`(
                        SELECT COUNT(*)
                        FROM referStudentmodel AS students
                        WHERE students.bpstudents = bppUsers.id
                        AND (
                            SELECT statuses.currentStatus
                            FROM statuses
                            WHERE statuses.referStudentId = students.id
                            ORDER BY statuses.id DESC
                            LIMIT 1
                        ) = 'enroll'
                    )`), 'enrolledCount'],
                    [literal(`(
                        SELECT COUNT(*)
                        FROM referStudentmodel AS students
                        WHERE students.bpstudents = bppUsers.id
                        
                    )`), 'referredCount'],
                    [literal(`(
                        SELECT GROUP_CONCAT(userId)
                        FROM credentialDetails
                        WHERE createdBy = bppUsers.id
                    )`), 'childUserIds'],
                    [literal(`(
                        SELECT COUNT(*)
    FROM referStudentmodel AS students
    WHERE students.bpstudents = bppUsers.id
    AND (
      SELECT statuses.currentStatus
      FROM statuses
      WHERE statuses.referStudentId = students.id
      ORDER BY statuses.id DESC
      LIMIT 1
    ) IN ('invalid','Not_Interested')
                    )`), 'disqualifiedCount'],
                    [literal(`(
                        SELECT COUNT(*)
    FROM referStudentmodel AS students
    WHERE students.bpstudents = bppUsers.id
    AND (
      SELECT statuses.currentStatus
      FROM statuses
      WHERE statuses.referStudentId = students.id
      ORDER BY statuses.id DESC
      LIMIT 1
    ) IN ('Demo_Scheduled', 'Demo_Completed', 'follow_up_one', 'follow_up_two', 'Prospect', 'Call_Back', 'Not_Answering')
  
                    )`), 'pipelineCount']],
                
                include: [
                    {
                        model: credentialDetails,
                        attributes: ['businessPartnerID', 'BpStatus',
                            // 'userId',
                             [literal(`(
                            SELECT COUNT(*)
                            FROM credentialDetails AS credentials
                            WHERE credentials.createdBy = bppUsers.id
    
                        )`), 'addedPartners'],
                      ],
                    },
                    // {
                    //     model: referStudentsModel,
                    //     as: 'bpStudentReferences',
                    //     attributes: { exclude: ['status'] },
                    //     include: [
                    //         {
                    //             model: statusesModel,
                    //             as: 'statuses',
                    //             order: [['id','DESC']],
                    //             separate: true,
                    //             limit: 1
                    //         },
                    //     ],
                    // },
                ],
                offset,
                limit,
                order: [['id', 'DESC']], 
                
            });
                   
        if (!businessPartners || businessPartners.length === 0) {
            return res.status(404).json({ message: 'No business partners found.' });
        }

        const totalPages = Math.ceil(totalRecords / pageSize);

        res.status(200).json({
            message: 'Business partners retrieved successfully.',
            businessPartners,
            pagination: {
                totalRecords,
                currentPage: page,
                pageSize,
                totalPages,
            },
        });
    } catch (error) {
        console.error('Error in getAllBusinessPartners:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message || error,
        });
    }
};
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
            return res.status(404).json({ message: 'User already exists with this email.' });
        }
        const defaultPassword = email.split('@')[0];
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        const user = await bppUsers.create({
            fullName,
            email,
            phonenumber,
            roleId: roleDetails.id,
        });

        let BpStatus = null; 
        const loginPageUrl = `https://www.partners.teksacademy.com/auth/login`;

        if (roleDetails.id === 2) { 
            BpStatus = "New Business Partner"; 
            const businessPartnerID = await generateBusinessPartnerID();
            const encryptedID = encrypt(businessPartnerID).encryptedData;

            const link1 = `https://www.partners.teksacademy.com/auth/studentForm/${encryptedID}`;
            const link2 = `https://www.partners.teksacademy.com/auth/businessForm/${encryptedID}`;

            await credentialDetails.create({
                password: hashedPassword,
                businessPartnerID,
                userId: user.id,
                createdBy: null,
                noOfLogins: 0,
                noOfLogouts: 0,
                referralLink: link1,
                businessReferralLink: link2,
                encryptedBPID: encryptedID,
                BpStatus, 
            });

            await transporter.sendMail({
                from: config.mailConfig.mailUser,
                to: email,
                subject: 'Welcome to Teks Academy Business Partner Account',
                html: `<p>Dear <b>${fullName}</b>,</p>
                       <p>Congratulations! Your Business Partner Account has been successfully created.</p>
                       <p>Below are your account credentials:</p>
                       <ul>
                           <li>Email: <b>${email}</b></li>
                           <li>Default Password: <b>${defaultPassword}</b></li>
                       </ul>
                    <p>You can log in to your account using the below link:</p>
         <p><b><a href="${loginPageUrl}" target="_blank">${loginPageUrl}</a></b></p>
                           <p>Below are the personalised Referal links to Refer Students and to Add Business Partner</p>
                           <ul>
                                <li>Student Referral Link:<b>${link1}</b></li>
                                <li>Add Business Partner Link:<b>${link2}</b>  </li>
                           </ul>
                           <p>For security reasons, we recommend updating your password and personal details when you first log in.</p>
                           <p>Please feel free to contact us with any questions or need help.</p>
                           <p>Support Team: <b> 9133308351 </b> / <a href='mailto:support@teksacademy.com'>support@teksacademy.com</a></p>
                       <p>Thank you,</p>
                       <p><b>Teks Academy</b></p>`
            });
        } else {
             
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
                subject: 'Welcome to Teks Academy Business Partner Account',
                html: `<p>Dear <b>${fullName}</b>,</p>
                       <p>Congratulations! Your Business Partner Account has been successfully created.</p>
                       <p>Below are your account credentials:</p>
                       <ul>
                           <li>Email: <b>${email}</b></li>
                           <li>Default Password: <b>${defaultPassword}</b></li>
                       </ul>
                           <p>You can log in to your account using the below link:</p>
                           <p><b><a href="${loginPageUrl}" target="_blank">${loginPageUrl}</a></b></p>
                       <p>For security reasons, we recommend updating your password and personal details when you first log in.</p>
                       <p>Please feel free to contact us with any questions or need help.</p>
                       <p>Support Team: <b> 9133308351 </b> / <a href='mailto:support@teksacademy.com'>support@teksacademy.com</a></p>
                        <p>Thank you,</p>
                         <p><b>Teks Academy</b></p>`
            });
        }

        return res.status(201).json({
            message: 'User created successfully!',
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                roleId: roleDetails.id,
                BpStatus, 
            },
        });
    } catch (error) {
        console.error('Error creating user:', error.message || error);
        return res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};


const deleteUser = async (req, res) => {

    try {

        const { userId } = req.params;
 
        if (!userId) {

            return res.status(400).json({ message: 'User ID is required.' });

        }

         const user = await bppUsers.findOne({ where: { id: userId } });

        if (!user) {

            return res.status(404).json({ message: 'User not found.' });

        }

        const credentialDetailsRecord = await credentialDetails.findOne({ where: { userId } });

        if (credentialDetailsRecord) {

            await credentialDetailsRecord.destroy(); 

        }

        const personalDetails = await Personaldetails.findOne({ where: { profileId: userId } });

        if (personalDetails) {

            await personalDetails.destroy();

        }

        const BankDetail = await bankDetails.findOne({ where: { userId } });

        if (BankDetail) {

            await bankDetails.destroy({ where: { userId } });

        }

        await bppUsers.destroy({ where: { id: userId } });
 
        return res.status(200).json({ message: 'User and associated details deleted successfully' });

    } catch (error) {

        console.error('Error deleting user:', error.message || error);

        return res.status(500).json({ message: 'Error deleting user', error: error.message });

    }

};
 

const getUserLogin = async (req, res) => {
    try {
        const { page = 1, pageSize , search = '', filter = null } = req.query;

       
        const effectiveLimit = parseInt(pageSize, 10);
        const offset = (parseInt(page, 10) - 1) * effectiveLimit;

       
        let filterConditions = {};
        if (filter) {
            const parsedFilter = JSON.parse(filter);
            if (parsedFilter.roles) {
                filterConditions['$Role.name$'] = { [Op.in]: parsedFilter.roles };
            }
            if (parsedFilter.startDate && parsedFilter.endDate) {
                filterConditions.createdAt = {
                    [Op.between]: [new Date(parsedFilter.startDate), new Date(parsedFilter.endDate)],
                };
            }
        }

        
        const searchConditions = search
            ? {
                  [Op.or]: [
                      { fullname: { [Op.like]: `%${search}%` } },
                      { email: { [Op.like]: `%${search}%` } },
                      { '$Role.name$': { [Op.like]: `%${search}%` } },
                  ],
              }
            : {};

      
        const whereConditions = {
            ...searchConditions,
            ...filterConditions,
        };

        
        const users = await bppUsers.findAndCountAll({
            where: whereConditions,
            include: [
                {
                    model: Role,
                    as: 'Role',
                },
            ],
            limit: effectiveLimit,
            offset,
            distinct: true,
        });

        const totalPages = Math.ceil(users.count / effectiveLimit);

      
        // Response
        return res.status(200).json({
            message: 'Users retrieved successfully!',
            data: users.rows.reverse(),
            totalUsers: users.count,
            totalPages,
            currentPage: parseInt(page, 10),
            pageSize: effectiveLimit,
        });
    } catch (error) {
        console.error('Error retrieving users:', error.message || error);
        return res.status(500).json({
            message: 'Error retrieving users',
            error: error.message,
        });
    }
};

const updateBppUserStatus = async (req, res) => {
    try {
        const { userId, BpStatus ,comment} = req.body;
        if (!userId || !BpStatus) {
            return res.status(400).json({ message: 'User ID and status are required.' });
        }
        const user = await bppUsers.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const updatedCredential = await credentialDetails.update(
            { BpStatus , comment},
            { where: { userId } }
        );

        if (updatedCredential[0] === 0) {
            return res.status(400).json({ message: 'Status update failed. Please check the user ID and try again.' });
        }

        return res.status(200).json({
            message: 'Status updated successfully!',
            user: {
                id: userId,
                BpStatus,
                comment
            },
        });
    } catch (error) {
        console.error('Error updating status:', error.message || error);
        return res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};

const assignOwner = async(req,res)=>{
    try{
        const{id,referStudentId,assignedUserId} = req.body;
        if(!id || !referStudentId || !assignedUserId){
            return res.status(400).json({
                message: 'Few fields are missing need to add them',
            })
        }
        const assigningUserTo = await referStudentsModel.update(
            {
                assignedTo:assignedUserId,
                assignedBy:id
            },
            {
                where: {id:referStudentId}
            }
        )
    return res.status(200).json({
        message: 'Assigned  Lead Successfully',
        
    })
    }catch(error){
        console.error('Error occured During Assigning the lead',error.message || error);
        return res.status(500).json({
            message: 'Error occured During Assigning the lead'
        })
    }
    }
    const getUsersForLeads = async(req, res) =>{
        try{
            const { count: totalRecords, rows: businessPartners } = await credentialDetails.findAndCountAll({
                attributes:['userId'],
                include: [
                {
                        model: bppUsers,
                        as: 'bppUser',
                        attributes: ['id', 'fullName', 'email', 'phoneNumber', 'roleId', ],
                        where:{  [Op.or]: [
                            { roleID: 9 },
                            { roleID: 10 },
                          ],}
                    }
                ],
               
                order: [['id', 'DESC']],
            });
     
            res.status(200).json({
                message: 'Business partners retrieved successfully.',
                data: businessPartners,
                });
        }catch (error) {
            console.error('Error fetching business partners:', error);
            res.status(500).json({
                message: 'An error occurred while retrieving business partners.',
                error: error.message || error
            });
        }
    }

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
    addBusinessPartner,
    getPersonalDetailsById,
    getAllBusinessPartnersall,
    getAllBusinessPartnersall2,
    createUserlogin,getUserLogin, deleteUser,updateBppUserStatus,
    assignOwner,getUsersForLeads
};
