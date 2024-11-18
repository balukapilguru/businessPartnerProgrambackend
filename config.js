require('dotenv').config()

module.exports = {
  expressConfig: {
    port: process.env.PORT,
  },
  dbConfig: {
    dbHost: process.env.DB_HOST,
    dbUser: process.env.DB_USER,
    dbName: process.env.DB_NAME,
    dbPass: process.env.DB_PASS,
  },
  jwtConfig: {
    jwtSecret: process.env.JWT_SECRET || 'secret',
  },
  mailConfig: {
    mailHost: process.env.SMTP_HOST || '',
    port: process.env.SMTP_PORT || '',
    mailUser: process.env.SMTP_USER || '',
    mailPass: process.env.SMTP_PASS || '',
  },

   config: {
    frontendUrl: 'http://localhost:5173',  
    // other configuration settings
},

}
