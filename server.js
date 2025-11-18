const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
const crypto = require('crypto');
const path = require('path');
// Load environment variables
dotenv.config();


const swaggerSpec = require("./config/swagger");
const socialAuthConfig = require('./config/passport');
const connectDB = require("./config/database");
const index = require('./routes/index');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

connectDB()


app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // ✅ important for <img> tags
    contentSecurityPolicy: false, // ✅ disable strict CSP for development
}));
// Secure headers and allow local images
// app.use(helmet({
//     contentSecurityPolicy: {
//         directives: {
//             defaultSrc: ["'self'"],
//             imgSrc: [
//                 "'self'",
//                 "data:",
//                 "blob:",
//                 "http://localhost:8000",
//                 "http://localhost:3000",
//                 "https://e-commerce-rho-nine-36.vercel.app"
//             ],
//             connectSrc: [
//                 "'self'",
//                 "http://localhost:3000",
//                 "https://e-commerce-rho-nine-36.vercel.app"
//             ],
//             scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
//             styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
//         },
//     },
// }));
// Allow images from ANY origin in CSP
app.use(
    helmet({
        crossOriginResourcePolicy: false, // disables blocking external origins
        contentSecurityPolicy: {
            useDefaults: true,
            directives: {
                defaultSrc: ["*"],
                imgSrc: ["*", "data:", "blob:"],
                connectSrc: ["*"],
                scriptSrc: ["*", "'unsafe-inline'"],
                styleSrc: ["*", "'unsafe-inline'"],
            },
        },
    })
);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));

const SESSION_COOKIE = 'guest_session';

app.use((req, res, next) => {
    const existing = req.cookies[SESSION_COOKIE];
    if (!existing) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        res.cookie(SESSION_COOKIE, sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        req.sessionId = sessionId;
    } else {
        req.sessionId = existing;
    }
    next();
});

// Quick session test endpoint
app.get('/session/test', (req, res) => {
    res.json({
        ok: true,
        sessionId: req.sessionId || null,
        cookie: req.cookies[SESSION_COOKIE] || null,
    });
});

socialAuthConfig();

app.use(passport.initialize());

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));


// Example base route
app.get('/', (req, res) => {
    res.send('API is running successfully');
});

// Routes
app.use('/', index);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({status: 'ok', message: 'Service is running'});
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err : {},
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server running :  http://localhost:${PORT}/`);
    console.log(`Health Check :  http://localhost:${PORT}/health`);
    console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});