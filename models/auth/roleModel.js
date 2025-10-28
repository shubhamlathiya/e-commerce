const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: Unique role identifier
 *         displayName:
 *           type: string
 *           description: Human-readable role name
 *         description:
 *           type: string
 *           description: Role description
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Role creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Role last update timestamp
 */
const roleSchema = new Schema({
    name: {
        type: String, required: true, unique: true, trim: true, lowercase: true
    }, displayName: {
        type: String, required: true, trim: true
    }, description: {
        type: String, trim: true
    }
}, {
    timestamps: true
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;