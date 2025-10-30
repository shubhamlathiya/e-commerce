const mongoose = require('mongoose');
const {Schema} = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsUser:
 *       type: object
 *       required:
 *         - date
 *         - newUsers
 *         - totalUsers
 *         - repeatCustomers
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the analytics user record
 *           example: 671f2b5a9c8f4a1e4c2b6f91
 *         date:
 *           type: string
 *           format: date
 *           description: Date of the analytics record
 *           example: "2025-10-28"
 *         newUsers:
 *           type: integer
 *           minimum: 0
 *           description: Number of new users registered on the date
 *           example: 150
 *         totalUsers:
 *           type: integer
 *           minimum: 0
 *           description: Total number of registered users up to the date
 *           example: 12500
 *         repeatCustomers:
 *           type: integer
 *           minimum: 0
 *           description: Number of users who made repeat purchases
 *           example: 320
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *           example: "2025-10-28T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *           example: "2025-10-28T12:00:00Z"
 */
const AnalyticsUserSchema = new Schema(
    {
        date: {type: Date, required: true, index: true},
        newUsers: {type: Number, required: true, min: 0},
        totalUsers: {type: Number, required: true, min: 0},
        repeatCustomers: {type: Number, required: true, min: 0},
    },
    {timestamps: true}
);

AnalyticsUserSchema.index({date: 1}, {unique: true});

module.exports = mongoose.model('AnalyticsUser', AnalyticsUserSchema);

