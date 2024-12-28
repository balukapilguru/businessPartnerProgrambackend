const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads'; 
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true }); 
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const originalName = file.originalname;
        cb(null, `${timestamp}-${originalName}`); 
    }
});


const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        
        if (path.extname(file.originalname) !== '.csv') {
            return cb(new Error('Invalid file type. Only CSV files are allowed.'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = upload;
