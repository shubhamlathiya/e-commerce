const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const passport = require('passport');
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

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());
app.use(morgan('dev'));

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