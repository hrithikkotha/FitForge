const mongoose = require('mongoose');

const setDataSchema = new mongoose.Schema({
    reps: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
}, { _id: false });

const workoutEntrySchema = new mongoose.Schema({
    exerciseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise',
        required: true,
    },
    sets: [setDataSchema],
    duration: { type: Number, default: 0 },   // cardio: minutes
    distance: { type: Number, default: 0 },   // cardio: km
    caloriesBurned: { type: Number, default: 0 },
}, { _id: false });

const workoutSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    title: {
        type: String,
        default: 'Workout',
    },
    duration: {
        type: Number,
        default: 0,
    },
    notes: {
        type: String,
        default: '',
    },
    entries: [workoutEntrySchema],
}, {
    timestamps: true,
});

module.exports = mongoose.model('WorkoutSession', workoutSessionSchema);
