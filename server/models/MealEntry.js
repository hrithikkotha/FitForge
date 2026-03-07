const mongoose = require('mongoose');

const mealEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        required: true,
    },
    foodItemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodItem',
        required: true,
    },
    foodName: {
        type: String,
        default: '',
    },
    quantity: {
        type: Number,
        required: true,
    },
    calories: {
        type: Number,
        default: 0,
    },
    protein: {
        type: Number,
        default: 0,
    },
    carbs: {
        type: Number,
        default: 0,
    },
    fat: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('MealEntry', mealEntrySchema);
