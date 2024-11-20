
const bppUsers = require('../models/bpp/users');

const { Op } = require('sequelize');

const crypto = require('crypto');

const credentialDetails = require('../models/bpp/credentialDetails');
const Personaldetails = require('../models/bpp/personaldetails')
const bankDetails= require('../models/bpp/bankdetails');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const config = require('../config');
const jwt = require('jsonwebtoken');
const upload = require('../middlewares/uploadMiddleware');
const s3 = require('../utiles/awsConfig');
const { JWT_SECRET } = require('../utiles/jwtconfig');
const { encrypt,decrypt} = require('../utiles/encryptAndDecrypt')
require('dotenv').config();

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
            expiresAt: Date.now() + 2 * 60 * 1000 
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
                email      
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
                    referralLink: generateRefferal,
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
                    user: { email, fullName, businessPartnerID },
                    redirectUrl: '/login'
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

const generateReferralLink = async (businessPartnerID) => {
    const baseURL = 'https://businessPartnerProgram.com';
    const encrypted = encrypt(businessPartnerID); 
    const res = encrypted?.encryptedData; 
    const iv = encrypted?.iv;
    const encodedKey = encrypted?.key; 

    console.log('iv is ', iv);
    console.log('key is', encodedKey);

    return `${baseURL}/${iv}/${res}/${encodedKey}`; 
};




// const generateToken = (userId) => {
//     const secretKey = process.env.JWT_SECRET || 'your-secret-key';  
//     return jwt.sign({ userId }, secretKey, { expiresIn: '3h' });  
// };

const generateToken = (user) => {
    const payload = { id: user.id, email: user.email };
    const secret = process.env.JWT_SECRET || 'secret';
    const options = { expiresIn: '2h' };  

  
    const token = jwt.sign(payload, secret, options);
    return token;
};

const login = async (req, res) => {
    const { email, password, fullName, } = req.body;

    try {
        console.log("Received email:", email);
        console.log("Received password:", password);

        const user = await bppUsers.findOne({ where: { email } });

        if (!user) {
            console.error("User not found for email:", email);
            return res.status(400).json({ message: 'User not found' });
        }
     
        const credential = await credentialDetails.findOne({ where: { userId: user.id } });

        if (!credential || !credential.password) {
            console.error("No credentials or password found for user ID:", user.id);
            return res.status(400).json({ message: 'No credentials found or password missing' });
        }

        console.log("Stored Password Hash (type):", typeof credential.password);
        console.log("Stored Password Hash (value):", credential.password);


        if (typeof credential.password !== 'string') {
            console.error("Stored password is not a string:", credential.password);
            return res.status(500).json({ message: 'Internal error: stored password is not a valid string' });
        }


        if (typeof password !== 'string') {
            console.error("Received password is not a string:", password);
            return res.status(400).json({ message: 'Password must be a string' });
        }

        const isPasswordValid = await bcrypt.compare(password, credential.password);

        if (!isPasswordValid) {
            console.error("Invalid password for email:", email);
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = generateToken(user);

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                fullName: user.fullName,
                businessPartnerID: credential.businessPartnerID,
                referralLink: credential.referralLink,
                email,
                password
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
        const { url } = req.body;
        console.log('url is', url);

        const parts = url.split('/');
        const iv = parts[3];
        const encryptedData = parts[4];
        const encodedKey = parts[5];

        console.log('iv is', iv);
        console.log('encryptedData is', encryptedData);
        console.log('encodedKey is', encodedKey);

        const decryptionKey = Buffer.from(encodedKey, 'hex');

        const decryptedData = decrypt({
            iv,
            encryptedData,
            key: decryptionKey,
        });
        console.log('Decrypted Data:', decryptedData);

        const formHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Create Referral</title>
            </head>
            <body>
                <h1>Fill this Form..We will reach you shortly </h1>
                <form action="http://localhost:3030/api/student/refer-student" method="POST">
                    <label for="fullname">Full Name:</label>
                    <input type="text" id="fullname" name="fullname" required><br><br>

                    <label for="email">Email:</label>
                    <input type="email" id="email" name="email" required><br><br>

                    <label for="contactnumber">Contact Number:</label>
                    <input type="text" id="contactnumber" name="contactnumber" required><br><br>

                    <label for="city">City:</label>
                    <input type="text" id="city" name="city" required><br><br>

                    <label for="courseRequired">Course Required:</label>
                    <input type="text" id="courseRequired" name="courseRequired" required><br><br>
                    <!-- Hidden input fields 
                    <label for="changedBy">Changed By:</label>
                    <input type="text" id="changedBy" name="changedBy"><br><br>

                    <label for="comment">Comment:</label>
                    <textarea id="comment" name="comment"></textarea><br><br> -->

                    <!-- Hidden input fields -->
                    <input type="hidden" id="businessPartnerId" name="businessPartnerId" value="${decryptedData}">
                    <input type="hidden" id="status" name="status" value="Initial status">

                    <button type="submit">Submit Referral</button>
                </form>
            </body>
            </html>
        `;

        res.send(formHTML); 
    } catch (error) {
        console.error('Error during decryption:', error.message);
        return res.status(500).json({ error: 'Decryption failed' });
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
     
        const decoded = jwt.verify(token,  config.jwtConfig.jwtSecret);

    
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
            { where:  { userId: user.id } }
        );

        return res.status(200).json({ message: 'Password successfully updated' });
    } catch (error) {
        console.error('Error in resetting password:', error);
        return res.status(400).json({ message: 'Invalid or expired reset token' });
    }}

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
                holder_name ,
                account_no ,
                ifsc_code,
                branch 
            } = req.body;

            
            if (!address || !contactNo || !whatapp_no ) {
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
                businessName:businessName||null,
                cin_no:cin_no || null,
                gst_no: gst_no||null,
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
      // Using multer to handle file uploads if any (for example, for profile image)
      upload.single('image')(req, res, async (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
  
        const { id } = req.params; // User ID from the route
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
  
        // Check if the user exists
        const personalDet = await Personaldetails.findOne({
          where: { profileId: id },
        });
  
        if (!personalDet) {
          return res.status(404).json({ error: 'User not found' });
        }
  
        // Update personal details with the provided data or keep existing if not provided
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
  
        // Update bank details if provided
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
  
        // If a profile image is uploaded, update the profile image URL
        if (req.file) {
          const updatedProfileImage = await Personaldetails.update(
            { profileImage: req.file.location },
            { where: { profileId: id } }
          );
        }
  
        return res.status(200).json({
          message: 'Personal and bank details updated successfully',
          personalDetails: personalDetailsUpdate[1],
          bankDetails: bankDetailsUpdate[1],
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
  


  const addBusinessParent = async (req, res) => {
    try {
        const { fullName, email, phonenumber, ParentbusinessPartnerId } = req.body;

        console.log('Request body:', req.body);

       
        const referringBusinessPartner = await credentialDetails.findOne({
            where: { businessPartnerID: ParentbusinessPartnerId }
        });
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
            roleId:1
        });

       
        await credentialDetails.create({
            password: hashedPassword,
            businessPartnerID: businessPartnerID,
            userId: newUser.id, 
            createdBy: referringBusinessPartner.userId, 
            addedBy: ParentbusinessPartnerId, 
            noOfLogins: 0,
            noOfLogouts: 0,
            referralLink: generateRefferal,
        });

     
        await transporter.sendMail({
            from: config.mailConfig.mailUser,
            to: email,
            subject: 'Your Default Password',
            text: `Congratulations, your referral business account has been created successfully. Your default password is: ${defaultPassword}`
        });

        res.status(201).json({
            message: 'Referral business created successfully and email with default password sent.',
            data: newUser
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred', error });
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
    addBusinessParent

};
























































































































































