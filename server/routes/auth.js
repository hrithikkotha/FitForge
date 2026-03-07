const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with that email or username' });
        }

        const user = await User.create({
            username,
            email,
            password,
            displayName: displayName || username,
        });

        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            displayName: user.displayName,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                weight: user.weight,
                height: user.height,
                age: user.age,
                dailyCalorieGoal: user.dailyCalorieGoal,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
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

// PUT /api/auth/me
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
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            displayName: updatedUser.displayName,
            weight: updatedUser.weight,
            height: updatedUser.height,
            age: updatedUser.age,
            dailyCalorieGoal: updatedUser.dailyCalorieGoal,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
