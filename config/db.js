
const { Sequelize, Op } = require('sequelize');
const {dbConfig} = require('../config')

const sequelize = new Sequelize(
    dbConfig.dbName,
    dbConfig.dbUser,
    dbConfig.dbPass,
    {
        host: dbConfig.dbHost,
        dialect: 'mysql',
        logging: false, 
    }
);
// (async () => {
//   try {
//     await sequelize.authenticate();
//     console.log("Database connection authenticated successfully.");
    
//     // Force sync to recreate tables (only for development)
//     await sequelize.sync({ alter : true });
//     console.log("Database synced, tables created.");
//   } catch (error) {
//     console.error("Unable to connect to the database or sync:", error);
//   }
// })()

module.exports = sequelize;
