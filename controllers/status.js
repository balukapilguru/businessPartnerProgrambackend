const referStudentmodel = require('../models/referStudent');
const { Op } = require("sequelize")
const statusModel = require('../models/status/status'); 
const sequelize = require('../config/db'); 
const bppusers = require('../models/bpp/users');

const createStatus = async(req,res)=>{
    try{
        const {id, currentStatus, referStudentId,comment} = req.body;
        // const user = bppusers.findOne({
        //     where: { email }
        // })
        const newstatus = await statusModel.create({
            changedBy:id,
            currentStatus,
            referStudentId,
            comment
        })
        res.status(201).json({
            message: 'Status changed'
        })
    }catch(error){
        console.error(error)
    }
}

const getStudentAllStatus = async (req, res) => {
    try {
        const { studentreferId } = req.params;
        const response = await statusModel.findAll({
            where: { referStudentId: studentreferId }, 
            order: [['id', 'DESC']], 
        });
        res.status(200).json(response);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while fetching the records.' });
    }
};

module.exports = {
    createStatus,
    getStudentAllStatus
}