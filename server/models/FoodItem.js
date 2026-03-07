const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Food name is required'],
        trim: true,
    },
    caloriesPer100g: {
        type: Number,
        required: true,
    },
    proteinPer100g: {
        type: Number,
        default: 0,
    },
    carbsPer100g: {
        type: Number,
        default: 0,
    },
    fatPer100g: {
        type: Number,
        default: 0,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('FoodItem', foodItemSchema);
