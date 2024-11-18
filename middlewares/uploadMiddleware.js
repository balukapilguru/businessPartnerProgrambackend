const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../utiles/awsConfig');

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_BUCKET_NAME,
        key: (req, file, cb) => {
            let folderName = '';
            if (file.fieldname === 'image') {
                folderName = 'usersImges';
            } 
            const fullKey = `${folderName}/${Date.now().toString()}_${file.originalname}`;
            cb(null, fullKey);
            req.uploadedFileKey = fullKey.split('/')[1];
        },
    }),
    limits: { fileSize: 200 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only .jpeg and .png formats allowed!'), false);
        }
    },
});

module.exports = upload;