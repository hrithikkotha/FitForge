const express = require('express');
const WeightEntry = require('../models/WeightEntry');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// POST /api/weight - Log daily weight
router.post('/', protect, async (req, res) => {
    try {
        const { date, weight, notes, timeOfDay } = req.body;

        if (!weight || weight <= 0) {
            return res.status(400).json({ message: 'Valid weight is required' });
        }

        // Check if entry already exists for this date
        const entryDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(entryDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(entryDate.setHours(23, 59, 59, 999));

        const existingEntry = await WeightEntry.findOne({
            userId: req.user._id,
            date: { $gte: startOfDay, $lte: endOfDay },
        });

        let weightEntry;

        if (existingEntry) {
            // Update existing entry for today
            existingEntry.weight = weight;
            if (notes !== undefined) existingEntry.notes = notes;
            if (timeOfDay) existingEntry.timeOfDay = timeOfDay;
            weightEntry = await existingEntry.save();
        } else {
            // Create new entry
            weightEntry = await WeightEntry.create({
                userId: req.user._id,
                date: entryDate,
                weight,
                notes: notes || '',
                timeOfDay: timeOfDay || 'morning',
            });
        }

        // Update user's current weight if this is the latest entry
        const latestEntry = await WeightEntry.findOne({ userId: req.user._id })
            .sort({ date: -1 });

        if (latestEntry && latestEntry._id.equals(weightEntry._id)) {
            await User.findByIdAndUpdate(req.user._id, { currentWeight: weight });
        }

        res.status(201).json(weightEntry);
    } catch (error) {
        console.error('Error logging weight:', error);
        res.status(500).json({ message: 'Failed to log weight' });
    }
});

// GET /api/weight - Get weight history
router.get('/', protect, async (req, res) => {
    try {
        const { from, to, limit = 90 } = req.query;

        const query = { userId: req.user._id };

        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from);
            if (to) query.date.$lte = new Date(to);
        }

        const entries = await WeightEntry.find(query)
            .sort({ date: -1 })
            .limit(parseInt(limit));

        res.json(entries);
    } catch (error) {
        console.error('Error fetching weight history:', error);
        res.status(500).json({ message: 'Failed to fetch weight history' });
    }
});

// GET /api/weight/latest - Get latest weight entry
router.get('/latest', protect, async (req, res) => {
    try {
        const latestEntry = await WeightEntry.findOne({ userId: req.user._id })
            .sort({ date: -1 });

        if (!latestEntry) {
            return res.status(404).json({ message: 'No weight entries found' });
        }

        res.json(latestEntry);
    } catch (error) {
        console.error('Error fetching latest weight:', error);
        res.status(500).json({ message: 'Failed to fetch latest weight' });
    }
});

// PUT /api/weight/:id - Update weight entry
router.put('/:id', protect, async (req, res) => {
    try {
        const { weight, notes, timeOfDay } = req.body;

        const weightEntry = await WeightEntry.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!weightEntry) {
            return res.status(404).json({ message: 'Weight entry not found' });
        }

        if (weight !== undefined) weightEntry.weight = weight;
        if (notes !== undefined) weightEntry.notes = notes;
        if (timeOfDay !== undefined) weightEntry.timeOfDay = timeOfDay;

        await weightEntry.save();

        // Update user's current weight if this is the latest entry
        const latestEntry = await WeightEntry.findOne({ userId: req.user._id })
            .sort({ date: -1 });

        if (latestEntry && latestEntry._id.equals(weightEntry._id)) {
            await User.findByIdAndUpdate(req.user._id, { currentWeight: weightEntry.weight });
        }

        res.json(weightEntry);
    } catch (error) {
        console.error('Error updating weight:', error);
        res.status(500).json({ message: 'Failed to update weight' });
    }
});

// DELETE /api/weight/:id - Delete weight entry
router.delete('/:id', protect, async (req, res) => {
    try {
        const weightEntry = await WeightEntry.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!weightEntry) {
            return res.status(404).json({ message: 'Weight entry not found' });
        }

        await weightEntry.deleteOne();

        // Recalculate user's current weight from remaining entries
        const latestEntry = await WeightEntry.findOne({ userId: req.user._id })
            .sort({ date: -1 });

        const newCurrentWeight = latestEntry ? latestEntry.weight : 0;
        await User.findByIdAndUpdate(req.user._id, { currentWeight: newCurrentWeight });

        res.json({ message: 'Weight entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting weight:', error);
        res.status(500).json({ message: 'Failed to delete weight' });
    }
});

module.exports = router;
