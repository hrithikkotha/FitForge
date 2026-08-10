const mongoose = require('mongoose');

const weightEntrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    weight: {
        type: Number,
        required: true,
    },
    notes: {
        type: String,
        default: '',
    },
    timeOfDay: {
        type: String,
        enum: ['morning', 'afternoon', 'evening', 'night'],
        default: 'morning',
    },
}, {
    timestamps: true,
});

// Compound index for efficient date-range queries per user
weightEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WeightEntry', weightEntrySchema);
