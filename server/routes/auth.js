const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const buildUserResponse = (user, token) => ({
    _id: user._id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    weight: user.weight,
    height: user.height,
    age: user.age,
    dailyCalorieGoal: user.dailyCalorieGoal,
    role: user.role,
    status: user.status,
    gymName: user.gymName,
    adminId: user.adminId,
    token,
});

// POST /api/auth/register — regular user
// If auto-approve is ON: user is created as 'active' and can log in immediately
// If auto-approve is OFF: user is created as 'pending' and must wait for Super Admin approval
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with that email or username' });
        }

        // Check if auto-approve is enabled
        const settings = await PlatformSettings.getSettings();
        const userStatus = settings.autoApproveUsers ? 'active' : 'pending';

        const user = await User.create({
            username,
            email,
            password,
            displayName: displayName || username,
            role: 'user',
            status: userStatus,
        });

        if (settings.autoApproveUsers) {
            // Auto-approved — return credentials popup info (no token yet, user must log in)
            return res.status(201).json({
                pending: false,
                autoApproved: true,
                message: 'Account created and approved! You can now log in with your credentials.',
                credentials: {
                    email,
                    username,
                },
            });
        }

        // Requires approval — no token issued yet
        res.status(201).json({
            pending: true,
            message: 'Account created! Your account is under review by the FitForge team. You will be able to log in once approved.',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/admin-register — gym owner requests access (status: pending)
router.post('/admin-register', async (req, res) => {
    try {
        const { username, email, password, displayName, gymName } = req.body;

        if (!gymName || !gymName.trim()) {
            return res.status(400).json({ message: 'Gym name is required' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'An account already exists with that email or username' });
        }

        await User.create({
            username,
            email,
            password,
            displayName: displayName || username,
            gymName: gymName.trim(),
            role: 'admin',
            status: 'pending',   // must be approved by Super Admin before login
        });

        res.status(201).json({ message: 'Registration submitted. You will be notified once your account is approved.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (user.status === 'pending') {
            return res.status(403).json({ message: 'Your account is pending approval. Please wait for Super Admin to approve your account.' });
        }
        if (user.status === 'suspended') {
            return res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        }

        // If user belongs to an admin, check if that admin's account is still active
        if (user.role === 'user' && user.adminId) {
            const parentAdmin = await User.findById(user.adminId).select('status gymName');
            if (parentAdmin && parentAdmin.status === 'suspended') {
                return res.status(403).json({
                    message: `Access to this platform has been temporarily suspended by your gym (${parentAdmin.gymName || 'your gym'}). Please contact your gym administrator for more information.`,
                    code: 'GYM_SUSPENDED',
                });
            }
        }

        res.json(buildUserResponse(user, generateToken(user._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// PUT /api/auth/me — profile update (user role only)
router.put('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.displayName = req.body.displayName || user.displayName;
        user.weight = req.body.weight ?? user.weight;
        user.height = req.body.height ?? user.height;
        user.age = req.body.age ?? user.age;
        user.dailyCalorieGoal = req.body.dailyCalorieGoal ?? user.dailyCalorieGoal;

        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json(buildUserResponse(updatedUser, generateToken(updatedUser._id)));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
