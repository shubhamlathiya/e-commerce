const mongoose = require('mongoose');
const { Schema } = mongoose;

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the tag
 *           example: "6713a4dc87b12f0034cfb921"
 *         name:
 *           type: string
 *           description: Name of the tag
 *           example: "Wireless Audio"
 *         slug:
 *           type: string
 *           description: URL-friendly unique slug generated from the tag name
 *           example: "wireless-audio"
 *         status:
 *           type: boolean
 *           description: Indicates whether the tag is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the tag was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the tag was last updated
 *       example:
 *         _id: "6713a4dc87b12f0034cfb921"
 *         name: "Wireless Audio"
 *         slug: "wireless-audio"
 *         status: true
 *         createdAt: "2025-10-27T12:45:33.000Z"
 *         updatedAt: "2025-10-27T12:45:33.000Z"
 */
const TagSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

TagSchema.pre('validate', function (next) {
    if (!this.slug && this.name) {
        this.slug = slugify(this.name);
    }
    next();
});

module.exports = mongoose.model('Tag', TagSchema);
