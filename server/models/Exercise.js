const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Exercise name is required'],
        trim: true,
    },
    category: {
        type: String,
        enum: ['strength', 'cardio', 'bodyweight'],
        required: true,
    },
    muscleGroups: [{
        type: String,
        enum: [
            'chest', 'shoulders', 'triceps', 'biceps', 'forearms',
            'abs', 'obliques', 'quads', 'hamstrings', 'calves',
            'glutes', 'lats', 'upper_back', 'lower_back', 'traps',
        ],
    }],
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

module.exports = mongoose.model('Exercise', exerciseSchema);
