const request = require('../models/requests')
const bppUsers = require('../models/bpp/users');
const { Op } = require("sequelize")
const dayjs = require('dayjs');
const now = dayjs();
const statements = require('../models/bpp/statements');
const {getFormattedISTDateTime} = require('../utiles/encryptAndDecrypt')
const istDateTime = getFormattedISTDateTime();

const getAllRequests = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search } = req.query;

        const effectiveLimit = parseInt(pageSize);
        const offset = (parseInt(page) - 1) * effectiveLimit;

        const searchCondition = search ? {
            [Op.or]: [
                { fullName: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
                { phoneNumber: { [Op.like]: `%${search}%` } }
        
        
        ]
        } : {}

        const requests = await request.findAll({
            offset,
            limit: effectiveLimit,
            include: [
                {
                    model: bppUsers,
                    as: 'user',
                    where: searchCondition,
                    attributes: ['id', 'fullName', 'email', 'phoneNumber']
                }
            ]
        });
        const totalRecords = await request.count({
            where: {}
        });

        const totalPages = Math.ceil(totalRecords / effectiveLimit);

        return res.status(200).json({
            message: "Requests fetched successfully",
            data: requests,
            totalRecords,
            totalPages,
            currentPage: parseInt(page),
            pageSize: effectiveLimit,
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return res.status(500).json({
            message: "Failed to fetch requests",
            error: error.message,
        });
    }
};


const getUserRequests = async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, pageSize = 10 } = req.query;

        if (!userId) {
            return res.status(400).json({
                error: "User ID is required"
            });
        }

        const effectiveLimit = parseInt(pageSize);
        const offset = (parseInt(page) - 1) * effectiveLimit;

        const requests = await request.findAll({
            where: { userId },
            offset,
            limit: effectiveLimit,
            include: [{
                model: bppUsers,
                as: 'user',
                attributes: ['fullName', 'email','createdAt','updatedAt']
            }]
        });

        if (!requests.length) {
            return res.status(404).json({ message: "No requests found for the given Id" });
        }

        // const totalAmount = requests.reduce((sum, req) => sum + req.amount, 0);
        
        // Count the total number of requests for the userId
        const totalRecords = await request.count({ where: { userId } });
        const totalPages = Math.ceil(totalRecords / effectiveLimit);

        res.status(200).json({
            // totalAmount,
            requests,
            totalRecords,
            currentPage: parseInt(page),
            pageSize: effectiveLimit,
            totalPages,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error while retrieving the requests" });
    }
};

const createRequest = async (req, res) => {
    try {
        const { amount, userId, status, id, commission } = req.body;
        if (!amount || !userId || !status) {
            return res.status(400).json({
                message:
                    "Missing Required Fields"
            });
        }
        const newRequest = await request.create({
            amount,
            userId, // who is requesting BPP
            status,
            // changedBy: id || null,
            commission: commission || null,
            date: `${istDateTime.date}`,
            time: `${istDateTime.time}`,
        })

        return res.status(200).json({
            message: " Request created successfully",
            data: newRequest
        })
    } catch (error) {
        console.error("Error creating request: ", error);
        return res.status(500).json({
            message: "Failed to create request",
            error: error.message
        })
    }
}
const statusChange = async (req, res) => {
    try {
        const { reqId, status, id } = req.body;
        const requestDetails = await request.findOne({
            where: {
                id: reqId
            }
        })
        if (status === 'Paid') {
            if (requestDetails.commission === 'y') {
                await statements.create({
                    date: now.format('YYYY-MM-DD'),
                    time: now.format('HH:mm:ss'),
                    action: 'Debit',
                    status: 'Successful',
                    changedBy: id,//id sales vallu
                    userId: requestDetails.userId,
                    reason: 'Debit from parent patner wallet',

                    amount: requestDetails.amount,
                    commission: 'y'
                })
            }
            if (requestDetails.commission === 'n') {
                await statements.create({
                    date: now.format('YYYY-MM-DD'),
                    time: now.format('HH:mm:ss'),
                    action: 'Debit',
                    status: 'Successful',
                    changedBy: id,//changed by debits are of acounts
                    userId: requestDetails.userId,
                    reason: 'Debit from Business Partner wallet',

                    amount: requestDetails.amount,
                    commission: 'n'
                })
            }
            await request.update(
                {
                    status: status, 
                },
                {
                    where: {
                        id: reqId,
                    },
                }
            );
            res.status(200).json({
                message: 'Status changed successfully'
            });
        }
        else {
            await request.update(
                {
                    status: status, 
                },
                {
                    where: {
                        id: reqId,
                    },
                }
            );
            res.status(200).json({
                message: 'Status changed successfully'
            });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message
        });
    }
}
module.exports = {
    getAllRequests,
    createRequest,
    getUserRequests,
    statusChange
}   