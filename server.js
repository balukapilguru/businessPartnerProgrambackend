
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');


										   
const sequelize = require('./config/db');

const referStudentroute = require('./routes/referStudent');
const referBusinessroute = require('./routes/referBusiness');
const status = require('./routes/status');
const statements = require('./routes/statements');
const request = require('./routes/request');
const userSignup = require('./routes/bpp/users');
const businessstatus = require('./routes/businessStatus');
const courses = require('./routes/bpp/courses');

const role = require('./routes/rolesAndPermissions/Role');

require('./models/bpp/studentcourses');
require('./models/bpp/credentialDetails'); 
require('./models/bpp/bankdetails'); 
												 
require('./models/bpp/courses');
require('./models/bpp/statements'); 
require('./models/bpp/users'); 
require('./models/status/BusinessStatus'); 
require('./models/bpp/personaldetails'); 
require('./models/rolesAndPermissions/Module'); 
require('./models/rolesAndPermissions/Permission');
require('./models/rolesAndPermissions/PermissionModule'); 
require('./models/rolesAndPermissions/Role');
require('./models/rolesAndPermissions/RolePermission');

const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4200',
    'https://www.partners.teksacademy.com',
    'http://localhost:5174',
    'https://www.partners.teksacademy.com/auth/login'
  ],
  default: 'http://localhost:3000',
  credentials: true,
};

app.use(express.urlencoded({ extended: true })); 
app.use(express.json());
app.use(cors(corsOptions));
app.use(cors({ credentials: true }))
app.all('*', (req, res, next) => {
  if (req.headers.origin) {
    const origin = corsOptions.origin.includes(req.headers.origin.toLowerCase())
      ? req.headers.origin
      : corsOptions.default;

    res.setHeader('Access-Control-Allow-Origin', origin);
								 
															  
  }
  next();
});
					   
								   
																	  
	  

app.use(morgan('dev'));

const PORT = process.env.PORT || 3050;

app.use(bodyParser.json());


app.use('/api/auth', userSignup);
app.use('/api/role', role);
app.use('/api/student', referStudentroute);
app.use('/business', referBusinessroute);
app.use('/api/business-p', userSignup);
app.use('/status', status);
app.use('/statements', statements);
app.use('/request', request);
app.use('/businessstatus', businessstatus);
app.use('/courses', courses);

app.get('/', (req, res) => {
  return res.status(200).send('Hello, Connected with BPP 132025..');
});

sequelize.sync().then(() => {
  console.log("Database synced, tables created.");
}).catch(error => {
  console.error("Error syncing the database:", error);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
