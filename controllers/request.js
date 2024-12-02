const request = require('../models/requests')
const bppUsers = require('../models/bpp/users');


const getAllRequests = async (req, res) => {
    try {
        
        const requests = await request.findAll()

        return res.status(200).json({
            message: "Requests fetched successfully",
            data: requests,
        });
    } catch (error) {
        console.error("Error fetching requests:", error);
        return res.status(500).json({
            message: "Failed to fetch requests",
            error: error.message,
        });
    }
};

const getUserRequests = async(req, res)=>{
    try{
        const {userId} = req.params;
        if(!userId) {
            return res.status(400).json({
                error: " User ID is required"
            })
        }
        const requests = await request.findAll({
            where:{ userId },
            include:[{
                model: bppUsers,
                as: 'user',
                attributes:['fullName','email']
            }]
        });
        if(!requests.length ){
            return res.status(404).json({ message : "No requests found for the given Id"})
        }
        const totalAmount = requests.reduce((sum,req)=> sum + req.amount ,0)
        res.status(200).json({
            totalAmount,
            requests,
        })
    }catch(error){
        console.error(error);
        res.status(500).json({error:"An error while retrieving the requests"})
    }
}

const createRequest = async(req,res)=>{
    try{
        const{amount, userId, status, id} = req.body;
        if(!amount || !userId || ! status){
            return res.status(400).json({message:
                "Missing Required Fields"
            });
        }
        const newRequest = await request.create({
            amount,
            userId,
            status,
            changedBy: id || null
        })

        return res.status(201).json({
            message : " Request created successfully",
            data: newRequest
        })
    }catch(error){
        console.error("Error creating request: ", error);
        return res.status(500).json({
            message:"Failed to create request",
            error: error.message
        })
    }
}

module.exports= {
    getAllRequests,
     createRequest,
    getUserRequests
}   