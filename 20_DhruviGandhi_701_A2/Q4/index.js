require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const path = require('path');
const cors=require("cors");
const jwt=require("jsonwebtoken");
const {isAuth}=require("./middleware/authEmp");

const app = express();

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Models
const Admin = mongoose.model('Admin', new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
}));

const Employee = mongoose.model('Employee', new mongoose.Schema({
    empId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    position: { type: String, required: true },
    department: { type: String, required: true },
    salary: { type: Number, required: true },
    password: { type: String, required: true },
    joinDate: { type: Date, default: Date.now },
    token: { type: String, },
}));

const Leave = mongoose.model('Leave', new mongoose.Schema({
    empId: { type: String, required: true },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: Date.now },
    reason: { type: String, required: true },
    status: { type: String, required: true },
}));


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    secure:false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(cors({
  origin: "http://127.0.0.1:8080",  // frontend URL
  credentials: true                // allow cookies
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper functions
function generateEmpId() {
    return 'EMP' + Math.floor(1000 + Math.random() * 9000);
}

function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// async function addTokenFieldToEmployees() {
//     try {
//         await Leave.updateMany(
//             { status: { $exists: false } },
//             { $set: { status: null } }
//         );
//         console.log('Token field added to all employees');
//     } catch (err) {
//         console.error(err);
//     } finally {
//         mongoose.disconnect();
//     }
// }

// addTokenFieldToEmployees();

const verifyToken=(async(req,res,next)=>{
    try{
        let userToken=req.headers.authorization;
        
        if(!userToken.startsWith("Bearer"))
            throw new Error;
        else
        {
            userToken=userToken.split(" ")[1];  
            const tokEmail=jwt.verify(userToken,process.env.SECRET_KEY);
            const checkUser=await Employee.findOne({email:tokEmail.email}).lean();
            if(checkUser)
            {
                req.emp=checkUser;
            }
            next();
        }
    }
    catch(err)
    {
        return next(err);
    }
    
//  const checkUser=await Employee.find({email:tokEmail.email});
//             if(checkUser)
//             {
//                 req.user=checkUser;
//                 next();
//             }
//             else
//                 return next("Invalid token");
})


// Routes
app.get('/', (req, res) => {
    if (req.session.admin) {
        return res.redirect('/dashboard');
    }
    res.render('login');
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });
        
        if (!admin || !bcrypt.compareSync(password, admin.password)) {
            return res.render('login', { error: 'Invalid credentials' });
        }
        
        req.session.admin = admin;
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'An error occurred' });
    }
});

app.post('/emp/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const emp = await Employee.findOne({ username ,password});
        
        if (!emp) {            
            return res.render('login', { error: 'Invalid credentials' });
        }        
        const emp_token=jwt.sign({email:emp.email,id:emp._id},process.env.SECRET_KEY);
        emp.token=emp_token;
        await emp.save();
        res.send({msg:"Login successful",token:emp_token});
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'An error occurred' });
    }
});


app.get('/emp/getEmp', verifyToken,async (req, res) => {
    try { 
        const {token,...employee}=req.emp;
        res.status(200).send(employee);
    } catch (err) {
        console.error(err);
        res.render('dashboard', { error: 'Failed to fetch employees' });
    }
});

app.get('/dashboard', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/');
    }
    
    try {
        const employees = await Employee.find().sort({ joinDate: -1 });
        res.render('dashboard', { employees });
    } catch (err) {
        console.error(err);
        res.render('dashboard', { error: 'Failed to fetch employees' });
    }
});

app.get('/employees/add', (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/');
    }
    res.render('addEmployee');
});

app.post('/employees', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/');
    }
    
    try {
        const { name, email, position, department, salary } = req.body;
        const password = generatePassword();
        // const hashedPassword = bcrypt.hashSync(password, 10);
        
        const employee = new Employee({
            empId: generateEmpId(),
            name,
            email,
            position,
            department,
            salary,
            password: password
        });
        
        await employee.save();
        
        // Send email
        // const mailOptions = {
        //     from: process.env.EMAIL_USER,
        //     to: email,
        //     subject: 'Your ERP System Credentials',
        //     html: `
        //         <h2>Welcome to our ERP System</h2>
        //         <p>Here are your login credentials:</p>
        //         <p><strong>Employee ID:</strong> ${employee.empId}</p>
        //         <p><strong>Password:</strong> ${password}</p>
        //         <p>Please change your password after first login.</p>
        //     `
        // };
        
        // await transporter.sendMail(mailOptions);
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('addEmployee', { error: 'Failed to add employee' });
    }
});

app.post('/leave',verifyToken, async (req, res) => {
    try {
        const { startDate,endDate,reason } = req.body;
        const leave = new Leave({
            empId:req.emp._id,
            startDate:startDate,
            endDate:endDate,
            reason:reason,
            status:"rejected"
        });
        console.log(leave);
        
        await leave.save();
        res.send('Leave application added');
    } catch (err) {
        console.error(err);
        res.send({ error: 'Failed to add leave application' });
    }
});

app.get('/employees/:id/edit', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/');
    }
    
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.redirect('/dashboard');
        }
        res.render('editEmployee', { employee });
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

app.get('/getLeaves', verifyToken,async (req, res) => {
    try { 
        const leaves=await Leave.find({empId:req.emp._id});
        res.status(200).send(leaves);
    } catch (err) {
        console.error(err);
        res.render('dashboard', { error: 'Failed to fetch employees' });
    }
});

app.post('/employees/:id', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/');
    }
    
    try {
        const { name, email, position, department, salary } = req.body;
        await Employee.findByIdAndUpdate(req.params.id, {
            name, email, position, department, salary
        });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('editEmployee', { error: 'Failed to update employee' });
    }
});

app.post('/employees/:id/delete', async (req, res) => {
    if (!req.session.admin) {
        return res.redirect('/');
    }
    
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.redirect('/dashboard');
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Create default admin if not exists
async function createDefaultAdmin() {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        const hashedPassword = bcrypt.hashSync('2209', 10);
        const admin = new Admin({
            username: 'dhruvi',
            password: hashedPassword
        });
        await admin.save();
        console.log('Default admin created');
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    createDefaultAdmin();
});