const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     AttributeValue:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the attribute value
 *         label:
 *           type: string
 *           description: Display label for the attribute value
 *     Attribute:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the attribute
 *         name:
 *           type: string
 *           description: Attribute name (e.g., Color, Size)
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name
 *         type:
 *           type: string
 *           enum: [text, number, select, multiselect]
 *           description: Type of attribute for UI rendering
 *         values:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AttributeValue'
 *           description: Predefined values for select/multiselect types
 *         isFilter:
 *           type: boolean
 *           description: Whether this attribute can be used as a filter
 *         status:
 *           type: boolean
 *           description: Whether the attribute is active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
const AttributeSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        enum: ['text', 'number', 'select', 'multiselect'],
        default: 'select'
    },
    values: [{
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    }],
    isFilter: {
        type: Boolean,
        default: true
    },
    status: {
        type: Boolean,
        default: true
    }
}, {timestamps: true});

// Indexes for efficient querying
AttributeSchema.index({slug: 1});
AttributeSchema.index({isFilter: 1});
AttributeSchema.index({status: 1});

// Validate that select/multiselect types have values
AttributeSchema.pre('validate', function (next) {
    if ((this.type === 'select' || this.type === 'multiselect') &&
        (!this.values || this.values.length === 0)) {
        this.invalidate('values', 'Select/multiselect attributes must have values');
    }

    // Ensure all value IDs are unique
    if (this.values && this.values.length > 0) {
        const ids = this.values.map(v => v.id);
        const uniqueIds = [...new Set(ids)];
        if (ids.length !== uniqueIds.length) {
            this.invalidate('values', 'Attribute values must have unique IDs');
        }
    }

    next();
});

const Attribute = mongoose.model('Attribute', AttributeSchema);

module.exports = Attribute;