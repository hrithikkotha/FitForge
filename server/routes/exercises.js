const express = require('express');
const Exercise = require('../models/Exercise');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/exercises — list all (default + user custom)
router.get('/', protect, async (req, res) => {
    try {
        const exercises = await Exercise.find({
            $or: [
                { isDefault: true },
                { userId: req.user._id },
            ],
        }).sort({ name: 1 });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/exercises — create custom exercise
router.post('/', protect, async (req, res) => {
    try {
        const { name, category, muscleGroups } = req.body;
        const exercise = await Exercise.create({
            name,
            category,
            muscleGroups,
            isDefault: false,
            userId: req.user._id,
        });
        res.status(201).json(exercise);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
