const express = require('express');
const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const MealEntry = require('../models/MealEntry');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();
const guard = [protect, authorizeRoles('admin')];

// GET /api/admin/stats
router.get('/stats', guard, async (req, res) => {
    try {
        const adminId = req.user._id;
        const [total, active, suspended, newThisMonth] = await Promise.all([
            User.countDocuments({ adminId, role: 'user' }),
            User.countDocuments({ adminId, role: 'user', status: 'active' }),
            User.countDocuments({ adminId, role: 'user', status: 'suspended' }),
            User.countDocuments({
                adminId, role: 'user',
                createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            }),
        ]);
        res.json({ total, active, suspended, newThisMonth });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/admin/users
router.get('/users', guard, async (req, res) => {
    try {
        const users = await User.find({ adminId: req.user._id, role: 'user' })
            .select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// GET /api/admin/users/:id/activity — member fitness summary
router.get('/users/:id/activity', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, adminId: req.user._id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'Member not found' });

        const [totalWorkouts, totalMeals, lastWorkout, lastMeal] = await Promise.all([
            WorkoutSession.countDocuments({ userId: user._id }),
            MealEntry.countDocuments({ userId: user._id }),
            WorkoutSession.findOne({ userId: user._id }).sort({ date: -1 }).select('date title'),
            MealEntry.findOne({ userId: user._id }).sort({ date: -1 }).select('date'),
        ]);

        res.json({ totalWorkouts, totalMeals, lastWorkout, lastMeal });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/admin/users — create member
router.post('/users', guard, async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;
        if (!username || !email || !password)
            return res.status(400).json({ message: 'Username, email, and password are required' });

        const existing = await User.findOne({ $or: [{ email }, { username }] });
        if (existing) return res.status(400).json({ message: 'A user already exists with that email or username' });

        const user = await User.create({
            username, email, password,
            displayName: displayName || username,
            role: 'user', status: 'active',
            adminId: req.user._id,
        });
        const { password: _p, ...userData } = user.toObject();
        res.status(201).json(userData);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/admin/users/:id/suspend
router.put('/users/:id/suspend', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, adminId: req.user._id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'Member not found' });
        user.status = 'suspended';
        await user.save();
        res.json({ message: 'Member suspended', status: user.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/admin/users/:id/activate
router.put('/users/:id/activate', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, adminId: req.user._id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'Member not found' });
        user.status = 'active';
        await user.save();
        res.json({ message: 'Member reactivated', status: user.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/admin/users/:id/reset-password — admin resets a member's password
router.put('/users/:id/reset-password', guard, async (req, res) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6)
            return res.status(400).json({ message: 'New password must be at least 6 characters' });

        const user = await User.findOne({ _id: req.params.id, adminId: req.user._id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'Member not found' });

        user.password = newPassword; // hashed by pre-save hook
        await user.save();
        res.json({ message: 'Password reset successfully' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, adminId: req.user._id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'Member not found' });
        await Promise.all([
            WorkoutSession.deleteMany({ userId: user._id }),
            MealEntry.deleteMany({ userId: user._id }),
            user.deleteOne(),
        ]);
        res.json({ message: 'Member and their data deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/admin/users/bulk-suspend — bulk suspend selected members
router.put('/users/bulk-suspend', guard, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0)
            return res.status(400).json({ message: 'No user IDs provided' });

        const result = await User.updateMany(
            { _id: { $in: ids }, adminId: req.user._id, role: 'user' },
            { $set: { status: 'suspended' } }
        );
        res.json({ message: `${result.modifiedCount} member(s) suspended` });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/admin/users/bulk-activate — bulk activate selected members
router.put('/users/bulk-activate', guard, async (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0)
            return res.status(400).json({ message: 'No user IDs provided' });

        const result = await User.updateMany(
            { _id: { $in: ids }, adminId: req.user._id, role: 'user' },
            { $set: { status: 'active' } }
        );
        res.json({ message: `${result.modifiedCount} member(s) activated` });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
