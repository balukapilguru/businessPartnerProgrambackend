const fs = require('fs');
const csv = require('csv-parser');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const ReferStudentmodel = require('../models/referStudent'); // Import your model

// Setup multer inline (You can customize the storage configuration here as needed)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');  // Adjust folder path as needed
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage }).single('file');  // Handling single file upload

// Process CSV function
const processCSV = (req, res) => {
    // Inline multer middleware to handle file upload
    upload(req, res, async (err) => {
        if (err) {
            console.error('Error during file upload:', err);
            return res.status(400).json({ error: 'Error during file upload', details: err.message });
        }

        // Get the businessPartnerId from the JWT token (using authentication middleware logic)
        const businessPartnerId = req.businessPartnerId;

        if (!businessPartnerId) {
            return res.status(401).json({ error: 'Unauthorized, businessPartnerId not found in token' });
        }

        const filePath = req.file.path;
        const targetAPI = 'https://example.com/api';  // Example API endpoint to send data

        try {
            const results = [];

            // Read and parse the CSV file
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    // Remove unwanted fields (e.g., status and businessPartnerId)
                    delete row.status;
                    delete row.businessPartnerId;

                    // Add businessPartnerId to the row before processing
                    row.businessPartnerId = businessPartnerId;

                    // Add the processed row to the results array
                    results.push(row);
                })
                .on('end', async () => {
                    // Clean up the uploaded file after processing
                    fs.unlinkSync(filePath);

                    // Process each row and send to the API
                    for (const row of results) {
                        try {
                            // Send data to the external API
                            await axios.post(targetAPI, row);

                            // Optionally, save data to the database (if needed)
                            await ReferStudentmodel.create(row);  // Storing the record in the database
                        } catch (err) {
                            console.error(`Error sending row: ${JSON.stringify(row)}`, err.message);
                        }
                    }

                    res.status(200).send('CSV processed and data sent to API.');
                });
        } catch (error) {
            console.error('Error processing file:', error);
            res.status(500).send('An error occurred while processing the file.');
        }
    });
};

module.exports = { processCSV };
