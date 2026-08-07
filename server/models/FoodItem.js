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
    servingUnit: {
        type: String,
        enum: ['g', 'ml', 'piece', 'slice', 'scoop', 'tbsp', 'cup', 'serving'],
        default: 'g',
    },
    gramsPerServing: {
        type: Number,
        default: 1,
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
    isAiEstimated: {
        type: Boolean,
        default: false,
    },
    aiEstimateNote: {
        type: String,
        default: null,
    },
    isRecipe: {
        type: Boolean,
        default: false,
    },
    recipeIngredients: [{
        ingredientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FoodItem',
        },
        quantity: Number,
        servingUnit: String,
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model('FoodItem', foodItemSchema);
