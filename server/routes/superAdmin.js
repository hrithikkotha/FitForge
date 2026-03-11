const express = require('express');
const User = require('../models/User');
const WorkoutSession = require('../models/WorkoutSession');
const MealEntry = require('../models/MealEntry');
const FoodItem = require('../models/FoodItem');
const Exercise = require('../models/Exercise');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// All routes require: authenticated + super_admin role
const guard = [protect, authorizeRoles('super_admin')];

// ─── Platform Stats ──────────────────────────────────────────────────────────

// GET /api/super-admin/stats
router.get('/stats', guard, async (req, res) => {
    try {
        const [totalAdmins, pendingAdmins, totalUsers, pendingUsers, totalWorkouts, totalMeals, totalFoods, totalExercises] = await Promise.all([
            User.countDocuments({ role: 'admin' }),
            User.countDocuments({ role: 'admin', status: 'pending' }),
            User.countDocuments({ role: 'user' }),
            User.countDocuments({ role: 'user', status: 'pending' }),
            WorkoutSession.countDocuments(),
            MealEntry.countDocuments(),
            FoodItem.countDocuments(),
            Exercise.countDocuments(),
        ]);

        const recentAdmins = await User.find({ role: 'admin' })
            .select('-password').sort({ createdAt: -1 }).limit(5);
        const recentUsers = await User.find({ role: 'user' })
            .select('-password').populate('adminId', 'gymName').sort({ createdAt: -1 }).limit(5);

        res.json({ totalAdmins, pendingAdmins, totalUsers, pendingUsers, totalWorkouts, totalMeals, totalFoods, totalExercises, recentAdmins, recentUsers });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ─── Admin Management ─────────────────────────────────────────────────────────

router.get('/admins', guard, async (req, res) => {
    try {
        const admins = await User.find({ role: 'admin' }).select('-password').sort({ createdAt: -1 });
        const adminsWithCount = await Promise.all(admins.map(async (admin) => {
            const userCount = await User.countDocuments({ adminId: admin._id, role: 'user' });
            return { ...admin.toObject(), userCount };
        }));
        res.json(adminsWithCount);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/admins/:id/approve', guard, async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        admin.status = 'active';
        await admin.save();
        res.json({ message: 'Admin approved successfully', status: admin.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/admins/:id/suspend', guard, async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        admin.status = 'suspended';
        await admin.save();
        res.json({ message: 'Admin suspended', status: admin.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/admins/:id/unsuspend', guard, async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        admin.status = 'active';
        await admin.save();
        res.json({ message: 'Admin reactivated', status: admin.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/admins/:id', guard, async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' });
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        const users = await User.find({ adminId: admin._id, role: 'user' });
        const userIds = users.map(u => u._id);
        if (userIds.length > 0) {
            await Promise.all([
                WorkoutSession.deleteMany({ userId: { $in: userIds } }),
                MealEntry.deleteMany({ userId: { $in: userIds } }),
                User.deleteMany({ adminId: admin._id, role: 'user' }),
            ]);
        }
        await admin.deleteOne();
        res.json({ message: `Admin and ${userIds.length} member(s) deleted` });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.get('/admins/:id/users', guard, async (req, res) => {
    try {
        const admin = await User.findOne({ _id: req.params.id, role: 'admin' }).select('-password');
        if (!admin) return res.status(404).json({ message: 'Admin not found' });
        const users = await User.find({ adminId: admin._id, role: 'user' }).select('-password').sort({ createdAt: -1 });
        res.json({ admin, users });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ─── All Users// GET /api/super-admin/users — all regular users across all admins
router.get('/users', guard, async (req, res) => {
    try {
        const users = await User.find({ role: 'user' })
            .select('-password')
            .populate('adminId', 'displayName gymName email')
            .sort({ status: 1, createdAt: -1 }); // pending first
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/super-admin/users/:id/approve — approve a pending user
router.put('/users/:id/approve', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.status = 'active';
        await user.save();
        res.json({ message: 'User approved', status: user.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/super-admin/users/:id/suspend
router.put('/users/:id/suspend', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.status = 'suspended';
        await user.save();
        res.json({ message: 'User suspended', status: user.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/super-admin/users/:id/unsuspend
router.put('/users/:id/unsuspend', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.status = 'active';
        await user.save();
        res.json({ message: 'User reactivated', status: user.status });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/super-admin/users/:id
router.delete('/users/:id', guard, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, role: 'user' });
        if (!user) return res.status(404).json({ message: 'User not found' });
        await Promise.all([
            WorkoutSession.deleteMany({ userId: user._id }),
            MealEntry.deleteMany({ userId: user._id }),
            user.deleteOne(),
        ]);
        res.json({ message: 'User deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ─── Food Items (Global Management) ──────────────────────────────────────────

// GET /api/super-admin/foods — all food items
router.get('/foods', guard, async (req, res) => {
    try {
        const foods = await FoodItem.find().sort({ isDefault: -1, name: 1 });
        res.json(foods);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/super-admin/foods — create a global food item
router.post('/foods', guard, async (req, res) => {
    try {
        const { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, servingUnit, gramsPerServing } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const food = await FoodItem.create({
            name, caloriesPer100g: caloriesPer100g || 0,
            proteinPer100g: proteinPer100g || 0, carbsPer100g: carbsPer100g || 0,
            fatPer100g: fatPer100g || 0, servingUnit: servingUnit || 'g',
            gramsPerServing: gramsPerServing || 100, isDefault: true,
        });
        res.status(201).json(food);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/super-admin/foods/:id — edit any food item's nutrition data
router.put('/foods/:id', guard, async (req, res) => {
    try {
        const food = await FoodItem.findById(req.params.id);
        if (!food) return res.status(404).json({ message: 'Food item not found' });
        const { name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, servingUnit, gramsPerServing } = req.body;
        if (name !== undefined) food.name = name;
        if (caloriesPer100g !== undefined) food.caloriesPer100g = caloriesPer100g;
        if (proteinPer100g !== undefined) food.proteinPer100g = proteinPer100g;
        if (carbsPer100g !== undefined) food.carbsPer100g = carbsPer100g;
        if (fatPer100g !== undefined) food.fatPer100g = fatPer100g;
        if (servingUnit !== undefined) food.servingUnit = servingUnit;
        if (gramsPerServing !== undefined) food.gramsPerServing = gramsPerServing;
        await food.save();
        res.json(food);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/super-admin/foods/:id
router.delete('/foods/:id', guard, async (req, res) => {
    try {
        const food = await FoodItem.findById(req.params.id);
        if (!food) return res.status(404).json({ message: 'Food item not found' });
        await food.deleteOne();
        res.json({ message: 'Food item deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// ─── Exercises (Global Management) ───────────────────────────────────────────

// GET /api/super-admin/exercises
router.get('/exercises', guard, async (req, res) => {
    try {
        const exercises = await Exercise.find().sort({ isDefault: -1, name: 1 });
        res.json(exercises);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// POST /api/super-admin/exercises — create a global exercise
router.post('/exercises', guard, async (req, res) => {
    try {
        const { name, category, muscleGroups } = req.body;
        if (!name || !category) return res.status(400).json({ message: 'Name and category are required' });
        const exercise = await Exercise.create({ name, category, muscleGroups: muscleGroups || [], isDefault: true });
        res.status(201).json(exercise);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// PUT /api/super-admin/exercises/:id
router.put('/exercises/:id', guard, async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        const { name, category, muscleGroups } = req.body;
        if (name !== undefined) exercise.name = name;
        if (category !== undefined) exercise.category = category;
        if (muscleGroups !== undefined) exercise.muscleGroups = muscleGroups;
        await exercise.save();
        res.json(exercise);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// DELETE /api/super-admin/exercises/:id
router.delete('/exercises/:id', guard, async (req, res) => {
    try {
        const exercise = await Exercise.findById(req.params.id);
        if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
        await exercise.deleteOne();
        res.json({ message: 'Exercise deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;
