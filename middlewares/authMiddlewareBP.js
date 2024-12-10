const jwt = require('jsonwebtoken');


const authenticateBP = (req, res, next) => {
    try {
    
        const token = req.header('Authorization').replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ error: 'Authentication failed, token missing.' });
        }

        // Verify the token and decode it
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach the businessPartnerId from the decoded token to the request object
        req.businessPartnerId = decoded.businessPartnerId;

        // Proceed to the next middleware or controller
        next();
    } catch (error) {
        console.error('Authentication failed:', error);
        res.status(401).json({ error: 'Authentication failed, invalid token.' });
    }
};

module.exports = authenticateBP;
