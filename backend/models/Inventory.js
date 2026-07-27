const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true,
        unique: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    min_threshold: {
        type: Number,
        default: 10
    },
    category: {
        type: String,
        default: 'عام'
    },
    expiry_date: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Inventory', inventorySchema);
