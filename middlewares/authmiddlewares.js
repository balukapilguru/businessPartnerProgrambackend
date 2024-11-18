const jwt = require('jsonwebtoken');
require('dotenv').config();
const config = require('../config');


// const authenticate = (req, res, next) => {
//     console.log('Authorization header:', req.headers.authorization.split(" "));

//     const token = req.headers["authorization"]
//     console.log("first",token)
//     if (!token) {
//         return res.status(401).json({ message: 'Authorization token is missing' });
//     }

//     try {
//         // const decoded = jwt.verify(token,  config.jwtConfig.jwtSecret);
//         // req.user = { id: decoded.id, email: decoded.email };
//         // next();
//         console.log(token,config.jwtConfig)
//         const decoded = jwt.verify(token, config.jwtConfig.jwtSecret);
//         console.log('Decoded token:', decoded); // Log for debugging
//         req.user = decoded; // Attach user data to req object
//         next();
//     } catch (error) {
//         console.log(error)
//         console.error('JWT verification failed:', error.message);
//         return res.status(401).json({ message: 'Invalid or expired token' });
//     }
// };



// module.exports = authenticate;





const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;;
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization token is missing' });
        }

        const token = authHeader.split(' ')[1]; // Get the token part after "Bearer"
        if (!token) {
            return res.status(401).json({ message: 'Invalid token format' });
        }

        const decoded = jwt.verify(token, config.jwtConfig.jwtSecret);
        console.log('Decoded token:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT verification failed:', error.message);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = authenticate;
