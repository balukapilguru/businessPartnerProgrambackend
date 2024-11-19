
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

        return res.status(200).json({ message: 'OTP sent to your email for verification' });
    } catch (error) {
        console.error('Error details:', error);
        return res.status(500).json({ message: 'Error during OTP generation or email sending', error });
    }
};

// const verifyOtpAndRegisterUser = async (req, res) => {
//     const { email, emailOtp, fullName, phonenumber } = req.body;

//     try {

//         const storedOtpData = tempOtpStorage.find(otpData => otpData.email === email);

//         if (storedOtpData) {

//             if (storedOtpData.otp === emailOtp && Date.now() < storedOtpData.expiresAt) {

//                 tempOtpStorage = tempOtpStorage.filter(otpData => otpData.email !== email);


//                 const generatePassword = () => {
                  
//                     return crypto.randomBytes(8).toString('hex'); // 8 bytes = 16 characters
//                 };
                
//                 const hashPassword = async (password) => {
//                     return await bcrypt.hash(password, 10);
//                 };
                
//                 const defaultPassword = generatePassword();


//                 // const defaultPassword = uuidv4();
//                 // const hashedPassword = await bcrypt.hash(defaultPassword, 10);


//                 const businessPartnerID = await generateBusinessPartnerID();


//                 const user = await bppUsers.create({
//                     fullName,
//                     email,
//                     phonenumber,
//                     roleId: 1
//                 }).catch(error => {
//                     console.error('Error while saving user to the bppUsers table:', error);
//                     throw new Error('Error while saving user to the bppUsers table');
//                 });


//                 await credentialDetails.create({
//                     password: hashPassword,
//                     businessPartnerID,
//                     userId: user.id,
//                     createdBy: user.id,
//                     noOfLogins: 0,
//                     noOfLogouts: 0,
//                     referralLink: '',
//                 }).catch(error => {
//                     console.error('Error while saving business partner ID to credentialDetails:', error);
//                     throw new Error('Error while saving business partner ID to credentialDetails');
//                 });


//                 await transporter.sendMail({
//                     from: config.mailConfig.mailUser,
//                     to: email,
//                     subject: 'Verification Successful',
//                     text: `Congratulations, your email has been successfully verified! Your default password is: ${defaultPassword}`
//                 });


//                 return res.status(200).json({
//                     message: 'User registered and verified successfully. Check your email for the default password.',
//                     user: { email },
//                     redirectUrl: '/login'
//                 });
//             } else {
//                 return res.status(400).json({ message: 'Invalid or expired OTP' });
//             }
//         } else {
//             return res.status(400).json({ message: 'OTP not found or has expired' });
//         }
//     } catch (error) {
//         console.error('Error during OTP verification or user registration:', error);
//         return res.status(500).json({ message: 'Error during OTP verification or user registration', error });
//     }
// };

const verifyOtpAndRegisterUser = async (req, res) => {
    const { email, emailOtp, fullName, phonenumber } = req.body;

    try {
        const storedOtpData = tempOtpStorage.find(otpData => otpData.email === email);

        if (storedOtpData) {
            if (storedOtpData.otp === emailOtp && Date.now() < storedOtpData.expiresAt) {
             
                tempOtpStorage = tempOtpStorage.filter(otpData => otpData.email !== email);

            
                const generatePassword = () => {
                    return crypto.randomBytes(8).toString('hex'); // 8 bytes = 16 characters
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
                    createdBy: user.id,
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
                    user: { email },
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
        // const { fullName, email: userEmail, password: userPassword } = user;
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
                fullName,
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



// const changePassword = async (req, res) => {
//     const { currentPassword, newPassword } = req.body;

//     try {

//         const userId = req.user.id;


//         const user = await bppUsers.findOne({ where: { id: userId } });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }


//         const credentials = await credentialDetails.findOne({ where: { userId: user.id } });

//         if (!credentials) {
//             return res.status(404).json({ message: 'Credentials not found' });
//         }


//         const isMatch = await bcrypt.compare(currentPassword, credentials.password);

//         if (!isMatch) {
//             return res.status(401).json({ message: 'Current password is incorrect' });
//         }

//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         credentials.password = hashedPassword;
//         await credentials.save();

//         return res.status(200).json({ message: 'Password has been successfully updated' });
//     } catch (error) {
//         console.error('Error during change password', error);
//         return res.status(500).json({ message: 'Error during change password', error });
//     }
// };




// const resetPassword = async (req, res) => {
//     const { token, newPassword } = req.body;

//     try {

//         if (!passwordResetTokens[token]) {
//             return res.status(400).json({ message: 'Invalid or expired reset token' });
//         }

//         const { email, timestamp } = passwordResetTokens[token];


//         if (Date.now() - timestamp > 3600000) {
//             delete passwordResetTokens[token];  
//             return res.status(400).json({ message: 'Reset token has expired' });
//         }


//         const user = await bppUsers.findOne({ where: { email } });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }


//         const hashedPassword = await bcrypt.hash(newPassword, 10);


//         const credentials = await credentialDetails.findOne({ where: { userId: user.id } });

//         if (!credentials) {
//             return res.status(404).json({ message: 'Credentials not found' });
//         }

//         credentials.password = hashedPassword;
//         await credentials.save();


//         delete passwordResetTokens[token];

//         return res.status(200).json({ message: 'Password has been successfully updated' });
//     } catch (error) {
//         console.error('Error during reset password', error);
//         return res.status(500).json({ message: 'Error during reset password', error });
//     }
// };

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
// const generatePasswordResetToken = () => {
//     return crypto.randomBytes(8).toString('hex'); // 8 bytes = 16 characters
// };
// const sendlinkforForgotPassword = async (req, res) => {
//     const { email } = req.body;

//     try {
     
//         const user = await bppUsers.findOne({ where: { email } });

//         if (!user) {
//             return res.status(404).json({ message: 'User not found with this email.' });
//         }

       
//         const resetToken = jwt.sign(
//             { email: email }, // Payload - email of the user
//             config.JWT_SECRET, // Secret key (you should have it in .env)
//             { expiresIn: '1h' } // Token expiration time (1 hour)
//         );

      
//         await bppUsers.update(
//             { passwordResetToken: resetToken, passwordResetExpires: Date.now() + 3600000 }, 
//             { where: { email: email } }
//         );

       
//         const resetLink = `${config.frontendUrl}/auth/resetpassword?token=${resetToken}`;

//         await sendMail({
//             to: email,
//             subject: 'Password Reset Request',
//             html: `
//                 <p>Click the link below to reset your password:</p>
//                 <p><a href="${resetLink}">${resetLink}</a></p>
//             `
//         });

//         return res.status(200).json({ message: 'Password reset link sent to your email.' });
//     } catch (error) {
//         console.error('Error in forgot password:', error);
//         return res.status(500).json({ message: 'Error processing your request.' });
//     }
// };

const sendlinkforForgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        console.log('Received email:', email); // Log the incoming email

        // Check if the user exists in the database
        const user = await bppUsers.findOne({ where: { email } });
        console.log('User found:', user); // Log the user details if found

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email.' });
        }

        // Generate a JWT token for password reset
        const resetToken = jwt.sign(
            { email: user.email }, // Payload - email of the user
            config.jwtConfig.jwtSecret, // Secret key (you should have it in .env)
            { expiresIn: '1h' } // Token expiration time (1 hour)
        );
        console.log('Generated reset token:', resetToken); // Log the generated token

        // Save the token in the database (optional)
        await bppUsers.update(
            { passwordResetToken: resetToken, passwordResetExpires: Date.now() + 3600000 }, 
            { where: { email: email } }
        );
        console.log('Token saved to database'); // Log when token is saved

        // Generate the reset link with the JWT token
        const resetLink = `${config.config.frontendUrl}/auth/resetpassword?token=${resetToken}`;
        console.log('Reset link:', resetLink); // Log the generated reset link

        // Send the password reset email with the link
        await sendMail({
            to: email,
            subject: 'Password Reset Request',
            html: `
                <p>Click the link below to reset your password:</p>
                <p><a href="${resetLink}">${resetLink}</a></p>
            `
        });
        console.log('Password reset email sent'); // Log when email is sent

        return res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error in forgot password:', error); // Log the full error
        return res.status(500).json({ message: 'Error processing your request.', error: error.message });
    }
};





const passwordResetStore = {};

// const forgotPasswordrecet = async (req, res) => {
//     const { token, newPassword, confirmPassword } = req.body;

//     try {
//       const user = await credentialDetails.findOne({
//             where: {
//                 password: { [Op.ne]: null },  
//             }
//         });

//         if (!user || !passwordResetStore[token] || passwordResetStore[token].expires < Date.now()) {
//             return res.status(400).json({ message: 'Invalid or expired reset token' });
//         }

 
//         if (newPassword !== confirmPassword) {
//             return res.status(400).json({ message: 'Passwords do not match' });
//         }

//         const hashedPassword = await bcrypt.hash(newPassword, 10);

       
//         await credentialDetails.update(
//             { password: hashedPassword },
//             { where: { email: user.email } }
//         );
//         delete passwordResetStore[token];

//         return res.status(200).json({ message: 'Password successfully updated' });
//     } catch (error) {
//         console.error('Error in resetting password:', error);
//         return res.status(500).json({ message: 'Error processing your request' });
//     }
//     // const { token, newPassword, confirmPassword } = req.body;
 
   
//     // console.log("Received reset password request with data:", { token, newPassword, confirmPassword });
 
  
//     // if (!token || !newPassword || !confirmPassword) {
//     //     return res.status(400).json({ message: 'Missing fields' });
//     // }
 
//     // if (newPassword !== confirmPassword) {
//     //     return res.status(400).json({ message: 'Passwords do not match' });
//     // }
 

//     // const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;
//     // if (!passwordRegex.test(newPassword)) {
//     //     return res.status(400).json({
//     //         message: 'Password should contain at least one uppercase letter, one lowercase letter, one number, and one special character',
//     //     });
//     // }
 
//     // try {
       
//     //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     //     const userId = decoded.id; // Assuming the token contains user ID
 
//     //     // Hash the new password
//     //     const hashedPassword = await bcrypt.hash(newPassword, 10);
 
//     //     // Find the user and update their password
//     //     const user = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });
 
//     //     if (!user) {
//     //         return res.status(404).json({ message: 'User not found' });
//     //     }
 
//     //     // Return success response
//     //     res.status(200).json({ message: 'Password updated successfully' });
//     // } catch (err) {
//     //     console.error('Error during password reset:', err);
//     //     res.status(500).json({ message: 'Internal server error' });
//     // }
// };




// const forgotPasswordrecet = async (req, res) => {
//     const { token, newPassword, confirmPassword } = req.body;

  
//     console.log('Received token:', token);

//     try {
    
//         const tokenData = passwordResetStore[token];
//         if (!tokenData || tokenData.expires < Date.now()) {
//             return res.status(400).json({ message: 'Invalid or expired reset token' });
//         }

   
//         if (newPassword !== confirmPassword) {
//             return res.status(400).json({ message: 'Passwords do not match' });
//         }

    
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

     
//         const user = await credentialDetails.findOne({ where: { email: tokenData.email } });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

      
//         await credentialDetails.update(
//             { password: hashedPassword },
//             { where: { email: user.email } }
//         );

       
//         delete passwordResetStore[token];

//         return res.status(200).json({ message: 'Password successfully updated' });
//     } catch (error) {
//         console.error('Error in resetting password:', error);
//         return res.status(500).json({ message: 'Error processing your request' });
//     }
// };

const forgotPasswordrecet = async (req, res) => {
    const { token, newPassword, confirmPassword } = req.body;

    try {
        // Verify the JWT token
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




// const forgotPasswordrecet = async (req, res) => {
//     const { token, newPassword, confirmPassword } = req.body;

//     try {
//         // Check if the token exists and is valid (not expired) in the credentialsDetails model
//         const user = await credentialDetails.findOne({ 
//             where: { 
//                 passwordResetToken: token, 
//                 passwordResetExpires: { [Op.gt]: Date.now() } 
//             }
//         });

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid or expired reset token' });
//         }

//         // Check if newPassword and confirmPassword match
//         if (newPassword !== confirmPassword) {
//             return res.status(400).json({ message: 'Passwords do not match' });
//         }

//         // Hash the new password before saving it
//         const hashedPassword = await bcrypt.hash(newPassword, 10);

//         // Update the user's password in the credentialsDetails model
//         await credentialDetails.update(
//             { password: hashedPassword, passwordResetToken: null, passwordResetExpires: null },
//             { where: { email: user.email } }
//         );

//         return res.status(200).json({ message: 'Password successfully updated' });
//     } catch (error) {
//         console.error('Error in resetting password:', error);
//         return res.status(500).json({ message: 'Error processing your request' });
//     }
// };



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

            
            if (!address || !contactNo || !whatapp_no || !gst_no) {
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


module.exports = {
    login,
    sendOtp,
    verifyOtpAndRegisterUser,
    changePassword,
    sendlinkforForgotPassword,
    forgotPasswordrecet,
    sendPasswordResetToken,
    personaldetails,
    decryptfun,

};
























































































































































