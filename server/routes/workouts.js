const express = require('express');
const WorkoutSession = require('../models/WorkoutSession');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/workouts — list user's sessions (with optional date filters)
router.get('/', protect, async (req, res) => {
    try {
        const query = { userId: req.user._id };

        if (req.query.from || req.query.to) {
            query.date = {};
            if (req.query.from) query.date.$gte = new Date(req.query.from);
            if (req.query.to) query.date.$lte = new Date(req.query.to);
        }

        const sessions = await WorkoutSession.find(query)
            .populate('entries.exerciseId')
            .sort({ date: -1 });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/workouts — create new session
router.post('/', protect, async (req, res) => {
    try {
        const { date, title, duration, notes, entries } = req.body;
        const session = await WorkoutSession.create({
            userId: req.user._id,
            date,
            title,
            duration,
            notes,
            entries,
        });
        const populated = await session.populate('entries.exerciseId');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/workouts/:id
router.get('/:id', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
        }).populate('entries.exerciseId');
        if (!session) return res.status(404).json({ message: 'Workout not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/workouts/:id
router.put('/:id', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!session) return res.status(404).json({ message: 'Workout not found' });

        session.date = req.body.date ?? session.date;
        session.title = req.body.title ?? session.title;
        session.duration = req.body.duration ?? session.duration;
        session.notes = req.body.notes ?? session.notes;
        session.entries = req.body.entries ?? session.entries;

        const updated = await session.save();
        const populated = await updated.populate('entries.exerciseId');
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// DELETE /api/workouts/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const session = await WorkoutSession.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!session) return res.status(404).json({ message: 'Workout not found' });
        res.json({ message: 'Workout deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
