const referStudentmodel = require('../models/referStudent');
const { Op , fn, col} = require("sequelize")
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
            comment,time :new Date()
        })
        res.status(201).json({
            message: 'Status changed'
        })
    }catch(error){
        console.error(error)
    }
}


// in progress 
const getAll = async (req, res) => {
    try {
      // Step 1: Fetch the most recent status (highest ID) for each referStudentId
      const recentStatuses = await statusModel.findAll({
        attributes: [
          'referStudentId',
          [fn('MAX', col('id')), 'latestId'], // Get the highest id for the latest status
        ],
        group: ['referStudentId'], // Group by student to get their latest status
        order: [[fn('MAX', col('id')), 'DESC']], // Order by the latest status id
      });
  
      // Log to check the recent statuses
      console.log("recentStatuses:", recentStatuses);
  
      // Step 2: Fetch the full status for each student using their latest id
      const fullStatuses = await Promise.all(
        recentStatuses.map(async (status) => {
          const latestId = status.dataValues.latestId; // Extract the latestId from the result
  
          if (!latestId) {
            console.log(`No latestId for referStudentId: ${status.referStudentId}`);
            return null; // Skip if there's no latestId
          }
  
          // Fetch the full status details using the latestId for each student
          const latestStatus = await statusModel.findOne({
            where: {
              referStudentId: status.referStudentId,
              id: latestId, // Filter by the latest id for each student
            },
          });
  
          return latestStatus ? latestStatus : null;
        })
      );
  
      // Remove any null statuses (in case no status was found for a student)
      const validFullStatuses = fullStatuses.filter(status => status !== null);
  
      // Log to check the valid full statuses
      console.log("validFullStatuses:", validFullStatuses);
  
      // Step 3: Count the occurrences of each currentStatus among the valid full statuses
      const statusCount = await statusModel.findAll({
        attributes: [
          'currentStatus',
          [fn('COUNT', col('currentStatus')), 'count'],
        ],
        where: {
          id: { // Only count the most recent status for each student
            [Op.in]: validFullStatuses.map(status => status.id), // Only include valid full statuses
          },
        },
        group: ['currentStatus'],
        raw: true, // Get the results as plain objects for easy manipulation
      });
  
      // Log to check the status count
      console.log("statusCount:", statusCount);
  
      // Step 4: Prepare the status count mapping for the response
      const statusCountMapping = statusCount.reduce((acc, { currentStatus, count }) => {
        acc[currentStatus] = count;
        return acc;
      }, {});
  
      // Log to check the status count mapping
      console.log("statusCountMapping:", statusCountMapping);
  
      // Step 5: Return the response with valid statuses and their count
      return res.status(200).json({
        statuses: validFullStatuses, // Always return statuses, even if empty
        count: statusCountMapping,   // Always return count, even if empty
      });
  
    } catch (error) {
      console.error('Error fetching data:', error);
      return res.status(500).json({ error: 'An error occurred while fetching the records.' });
    }
  };
  
  
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

// no update is required
const updateStatus = async (req, res) => {
    try {
        const { id, currentStatus, referStudentId, comment } = req.body;

        // Check if referStudentId exists
        const studentExists = await referStudentmodel.findOne({
            where: { id: referStudentId }
        });

        if (!studentExists) {
            return res.status(400).json({
                message: `Refer student with ID ${referStudentId} does not exist.`
            });
        }

        // Find the existing status record by ID
        const existingStatus = await statusModel.findOne({
            where: { id }
        });

        if (!existingStatus) {
            return res.status(404).json({
                message: 'Status not found'
            });
        }

        // Update the status record
        await existingStatus.update({
            currentStatus,
            referStudentId,
            comment
        });

        res.status(200).json({
            message: 'Status updated successfully',
            updatedStatus: existingStatus
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            message: 'Failed to update status',
            error: error.message
        });
    }
};


module.exports = {
    createStatus,
    getStudentAllStatus,
    updateStatus,
    getAll
}