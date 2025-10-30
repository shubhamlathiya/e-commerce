const mongoose = require('mongoose');
const {Schema} = mongoose;

const RefundSchema = new Schema(
    {
        returnId: {type: Schema.Types.ObjectId, ref: 'OrderReturn', required: true, index: true},
        userId: {type: Schema.Types.ObjectId, ref: 'User', required: true, index: true},
        orderId: {type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true},
        mode: {type: String, enum: ['wallet', 'bank'], required: true},
        amount: {type: Number, required: true, min: 0},
        transactionId: {type: String, default: ''},
        status: {type: String, enum: ['pending', 'completed', 'failed'], default: 'pending'},
    },
    {timestamps: true}
);

module.exports = mongoose.model('Refund', RefundSchema);

