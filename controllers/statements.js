
const statements = require('../models/bpp/statements')
const bppUsers = require('../models/bpp/users');



const getAllStatements = async(req,res)=>{
try{
    const response = await statements.findAll();
    res.status(200).json(response);
}catch(error){
    console.error(error);
    res.status(500).json({error:"An Error occured while Retrieving Statements"})
}
}
const getUserStatements = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const statementsData = await statements.findAll({
            where: { userId },
            include: [
                {
                    model: bppUsers,
                    as: 'user',
                    attributes: ['fullName', 'email'],
                }
            ],
        });
        if (!statementsData.length) {
            return res.status(404).json({ message: "No statements found for the given user ID" });
        }
        const businessPartnerStatements = statementsData.filter(statement => statement.commission === 'n');
        const parentPartnerStatements = statementsData.filter(statement => statement.commission === 'y');

        const totalBusinessPartnerAmount = businessPartnerStatements
            .filter(statement => statement.action === 'Credit')
            .reduce((sum, statement) => sum + statement.amount, 0);

        const totalParentPartnerAmount = parentPartnerStatements
            .filter(statement => statement.action === 'Credit')
            .reduce((sum, statement) => sum + statement.amount, 0);

        res.status(200).json({
            totalBusinessPartnerAmount,
            totalParentPartnerAmount,
            businessPartnerStatements,
            parentPartnerStatements,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while retrieving statements" });
    }
};

module.exports = {
    getAllStatements,
    getUserStatements
}