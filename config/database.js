const mongoose = require('mongoose');
const User = require("../models/auth/userModel");
const {hashPassword} = require("../utils/auth/passwordUtil");
const Role = require("../models/auth/roleModel");
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            // useCreateIndex: true,
            // useFindAndModify: false
            useUnifiedTopology: true,
            autoIndex: true,
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);

        await initializeAdmin();

    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

/**
 * Ensure a default admin user exists
 */
const initializeAdmin = async () => {
    try {
        // STEP 1: Check if "admin" role exists
        let adminRole = await Role.findOne({name: 'admin'});

        if (!adminRole) {
            adminRole = await Role.create({
                name: 'admin',
                displayName: 'Administrator',
                description: 'Full access to all system features and settings',
            });
            console.log('Admin role created');
        } else {
            console.log('Admin role already exists');
        }

        // STEP 2: Check if admin user exists
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        const adminName = process.env.ADMIN_NAME || 'System Administrator';

        let adminUser = await User.findOne({email: adminEmail});

        if (!adminUser) {
            const passwordHash = await hashPassword(adminPassword);

            adminUser = await User.create({
                name: adminName,
                email: adminEmail,
                passwordHash,
                roles: [adminRole.name],
                status: 'active',
                emailVerified: true,
                phoneVerified: false,
                profile: {
                    twoFactorAuth: {
                        enabled: false,
                        method: null,
                    },
                },
            });

            // {
            //     "email": "admin@example.com",
            //     "password": "Admin@123"
            // }
            console.log(`Default admin user created: ${adminEmail}`);
        } else {
            console.log(`Admin user already exists: ${adminEmail}  ${adminPassword}`);
        }

    } catch (error) {
        console.error(`❌ Error initializing admin: ${error.message}`);
    }
};


module.exports = connectDB;