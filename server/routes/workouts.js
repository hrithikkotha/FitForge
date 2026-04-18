const express = require('express');
const WorkoutSession = require('../models/WorkoutSession');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/workouts — list user's sessions (with optional date filters + pagination)
// Query params: from, to (ISO date), page (default 1), limit (default 20, max 100)
router.get('/', protect, async (req, res) => {
    try {
        const query = { userId: req.user._id };

        if (req.query.from || req.query.to) {
            const from = req.query.from ? new Date(req.query.from) : null;
            const to = req.query.to ? new Date(req.query.to) : null;
            if ((from && isNaN(from.getTime())) || (to && isNaN(to.getTime()))) {
                return res.status(400).json({ message: 'Invalid date format for from/to (use ISO 8601)' });
            }
            query.date = {};
            if (from) query.date.$gte = from;
            if (to) query.date.$lte = to;
        }

        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [sessions, total] = await Promise.all([
            WorkoutSession.find(query)
                .populate('entries.exerciseId', 'name category muscleGroups')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit),
            WorkoutSession.countDocuments(query),
        ]);

        res.json({ sessions, page, limit, total, totalPages: Math.ceil(total / limit) });
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
