const winston = require('winston');
require('dotenv').config();

// Define log format
const logFormat = winston.format.printf(({level, message, timestamp, stack}) => {
    return `${timestamp} ${level}: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}), winston.format.errors({stack: true}), logFormat),
    defaultMeta: {service: 'auth-api'},
    transports: [// Console transport for all environments
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple())
        }), // File transport for production
        ...(process.env.NODE_ENV === 'production' ? [new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error'
        }), new winston.transports.File({filename: 'logs/combined.log'})] : [])]
});

module.exports = logger;