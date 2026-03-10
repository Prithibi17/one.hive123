const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// ==========================================
// CONFIGURATION
// ==========================================
console.log('API: Starting initialization...');

let config = {};
try {
    // Try current folder (serverless bundle)
    config = require('./varsal.json');
    console.log('API: Loaded config from ./varsal.json');
} catch (e1) {
    try {
        // Try parent folder (local dev)
        config = require('../varsal.json');
        console.log('API: Loaded config from ../varsal.json');
    } catch (e2) {
        console.warn('API: varsal.json not found, using Environment Variables');
    }
}

const PORT = process.env.PORT || (config.server && config.server.port) || 3000;
const DATABASE_URL = process.env.DATABASE_URL || (config.database && config.database.url);
const JWT_SECRET = process.env.JWT_SECRET || (config.jwt && config.jwt.secret) || 'fallback-secret';
const EMAIL_USER = process.env.EMAIL_USER || (config.email && config.email.user);
const EMAIL_PASS = process.env.EMAIL_PASS || (config.email && config.email.pass);

const app = express();

// ==========================================
// CORS
// ==========================================
const allowedOrigins = [
    process.env.CORS_ORIGIN,
    'https://one-hive123.netlify.app',
    'https://onehi.netlify.app',
    /\.netlify\.app$/,
    'http://localhost:3000',
    'http://localhost:5500'
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.options('*', cors());

// ==========================================
// MIDDLEWARE
// ==========================================
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.json({ 
        message: 'OneHive API Server is online',
        status: 'ok',
        health: '/api/health'
    });
});

// ==========================================
// DATABASE (Lazy initialization)
// ==========================================
let pool;
const getPool = () => {
    if (!pool) {
        console.log('API: Initializing Database Pool...');
        if (!DATABASE_URL || DATABASE_URL.includes('REPLACE_WITH')) {
            console.error('API: DATABASE_URL is missing!');
        }
        pool = new Pool({
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false } // Force SSL for Supabase/Production
        });
        
        pool.on('error', (err) => {
            console.error('API: Unexpected DB error', err);
        });
    }
    return pool;
};

// ==========================================
// EMAIL
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// ==========================================
// HEALTH CHECK
// ==========================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        time: new Date().toISOString(),
        db_ready: !!DATABASE_URL && !DATABASE_URL.includes('REPLACE_WITH')
    });
});

// ... [REST OF ROUTES REMAIN SAME BUT USE getPool()] 
// (I will keep the existing routes but I need to make sure I don't break them)

// I will re-write the whole file to ensure completeness
// 1. Register User
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, phone, alt_phone, address, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
        const userCheck = await getPool().query('SELECT * FROM public.users WHERE email = $1', [email.toLowerCase()]);
        if (userCheck.rows.length > 0) return res.status(400).json({ error: 'Email exists' });
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = await getPool().query(
            'INSERT INTO public.users (name, email, phone, alt_phone, address, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email',
            [name, email.toLowerCase(), phone, alt_phone, address, hashedPassword]
        );
        res.status(201).json({ message: 'Success', user: newUser.rows[0] });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// 2. Login User
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await getPool().query('SELECT * FROM public.users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];
        if (!user || !(await bcrypt.compare(password, user.password))) return res.status(400).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// 3. Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const result = await getPool().query('SELECT id, name FROM public.users WHERE email = $1', [email.toLowerCase()]);
        if (!result.rows[0]) return res.status(400).json({ error: 'User not found' });
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        await getPool().query('UPDATE public.users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE email = $3', [otp, new Date(Date.now() + 600000), email.toLowerCase()]);
        await transporter.sendMail({ from: EMAIL_USER, to: email, subject: 'OTP', text: `OTP: ${otp}` });
        res.json({ message: 'OTP sent' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// 4. Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await getPool().query('SELECT reset_otp, reset_otp_expires_at FROM public.users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];
        if (!user || user.reset_otp !== otp || new Date() > new Date(user.reset_otp_expires_at)) return res.status(400).json({ error: 'Invalid or expired OTP' });
        res.json({ token: jwt.sign({ resetEmail: email.toLowerCase() }, JWT_SECRET, { expiresIn: '15m' }) });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// 5. Reset Password
app.post('/api/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        const decoded = jwt.verify(resetToken, JWT_SECRET);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await getPool().query('UPDATE public.users SET password = $1, reset_otp = NULL, reset_otp_expires_at = NULL WHERE email = $2', [hashedPassword, decoded.resetEmail]);
        res.json({ message: 'Success' });
    } catch (error) { console.error(error); res.status(400).json({ error: 'Token expired or invalid' }); }
});

// 6. Submit Application
app.post('/api/submit-application', async (req, res) => {
    try {
        const d = req.body;
        await getPool().query(
            `INSERT INTO public.worker_applications (app_id, status_level, from_name, dob, gender, mobile, whatsapp, email, pincode, state, district, address, service, experience, tools, availability, login_access) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
            [d.app_id, d.status_level, d.from_name, d.dob, d.gender, d.mobile, d.whatsapp, d.email, d.pincode, d.state, d.district, d.address, d.service, d.experience, d.tools, d.availability, d.login_access]
        );
        res.json({ message: 'Submitted' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// 7. Approve Application
app.post('/api/approve-application', async (req, res) => {
    try {
        const { id, training_slot } = req.body;
        await getPool().query('UPDATE public.worker_applications SET status_level = 6, login_access = true, training_slot = $1 WHERE id = $2', [training_slot, id]);
        res.json({ message: 'Approved' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Server error' }); }
});

// 8. Send Generic Email
app.post('/api/send-email', async (req, res) => {
    try {
        const { to, subject, text, html } = req.body;
        await transporter.sendMail({ from: EMAIL_USER, to, subject, text, html });
        res.json({ message: 'Sent' });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Failed' }); }
});

// Catch-all
app.use((req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

module.exports = app;
