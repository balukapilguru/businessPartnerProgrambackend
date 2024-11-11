
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const sequelize = require('./config/db');
// const signuprouter = require('./routes/signuprouter');
const referStudentroute = require('./routes/referStudentroute');
const referBusinessroute = require('./routes/referBusinessroute');
require('./models/bpp/credentialDetails'); 
require('./models/bpp/bankdetails'); 
require('./models/referbusinessPartnerModel');
require('./models/bpp/statements'); 
require('./models/bpp/users'); 
require('./models/bpp/personaldetails'); 
require('./models/rolesAndPermissions/Module'); 
require('./models/rolesAndPermissions/Permission');
require('./models/rolesAndPermissions/PermissionModule'); 
require('./models/rolesAndPermissions/Role');
require('./models/rolesAndPermissions/RolePermission');
const app = express();
app.use(cors());
const PORT = process.env.PORT || 3030;

app.use(bodyParser.json());


// app.use('/api/auth', signuprouter )

app.use('/api/student', referStudentroute);
app.use('/api/business', referBusinessroute);
app.use('/api/business-partner', referBusinessroute);


sequelize.sync().then(() => {
  console.log("Database synced, tables created.");
}).catch(error => {
  console.error("Error syncing the database:", error);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
