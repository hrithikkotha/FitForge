const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Otp = require('../models/Otp');
const PlatformSettings = require('../models/PlatformSettings');
const WorkoutSession = require('../models/WorkoutSession');
const MealEntry = require('../models/MealEntry');
const { protect } = require('../middleware/auth');
const { issueOtp, consumeOtp, OTP_TTL_MIN } = require('../utils/otp');
const { sendOtpEmail } = require('../utils/mailer');

const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiter: max 20 auth requests per IP per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again later.' },
});

// Stricter limiter for OTP issuance — prevents email-bombing.
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP requests. Please wait a few minutes before trying again.' },
});

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

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
    emailVerified: user.emailVerified,
    token,
});

// Helper: thin wrapper so route handlers uniformly handle "email infra is down".
const trySendOtp = async ({ to, code, purpose }) => {
    try {
        await sendOtpEmail({ to, code, purpose });
    } catch (e) {
        console.error('[mailer] sendOtpEmail failed:', e.message);
        const err = new Error('Could not send verification email. Please try again shortly or contact support.');
        err.status = 502;
        throw err;
    }
};

// ── Sign-up: step 1 (initiate) ─────────────────────────────────────────────
// Validates the prospective account, hashes the password, stores it in an
// ephemeral OTP record, and emails a 6-digit code. The User document is NOT
// created until /register/verify succeeds.
router.post('/register/initiate', authLimiter, async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        if (!username?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
        const userExists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username: username.trim() }] });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with that email or username' });
        }

        // Pre-hash so plaintext is never persisted on disk (even in OTP TTL doc).
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const code = await issueOtp({
            email,
            purpose: 'signup',
            payload: {
                username: username.trim(),
                displayName: displayName?.trim() || username.trim(),
                passwordHash,
            },
        });
        await trySendOtp({ to: email, code, purpose: 'signup' });

        res.status(200).json({
            message: `We sent a 6-digit code to ${email}. Enter it within ${OTP_TTL_MIN} minutes.`,
            email: email.toLowerCase(),
            ttlMinutes: OTP_TTL_MIN,
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// ── Sign-up: step 2 (verify) ───────────────────────────────────────────────
router.post('/register/verify', authLimiter, async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

        const otp = await consumeOtp({ email, purpose: 'signup', code });
        const { username, displayName, passwordHash } = otp.payload || {};
        if (!username || !passwordHash) {
            return res.status(400).json({ message: 'Verification context missing. Please re-submit your sign-up.' });
        }

        const dupe = await User.findOne({ $or: [{ email: email.toLowerCase() }, { username }] });
        if (dupe) {
            return res.status(409).json({ message: 'That email or username was just taken. Please try again with different details.' });
        }

        const settings = await PlatformSettings.getSettings();
        const userStatus = settings.autoApproveUsers ? 'active' : 'pending';

        const user = new User({
            username,
            email: email.toLowerCase(),
            password: passwordHash,
            displayName,
            role: 'user',
            status: userStatus,
            emailVerified: true,
        });
        // Skip the bcrypt pre-save hook because the password is already hashed.
        user.unmarkModified('password');
        await user.save();

        if (settings.autoApproveUsers) {
            return res.status(201).json({
                pending: false,
                autoApproved: true,
                message: 'Email verified! Your account has been created.',
                credentials: { email: user.email, username: user.username },
            });
        }
        res.status(201).json({
            pending: true,
            message: 'Email verified! Your account is now under review by the FitForge team.',
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// ── Sign-up: resend OTP ────────────────────────────────────────────────────
router.post('/register/resend', otpLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email || !isValidEmail(email)) {
            return res.status(400).json({ message: 'Valid email is required' });
        }
        const existing = await Otp.findOne({ email: email.toLowerCase(), purpose: 'signup' });
        if (!existing) {
            return res.status(400).json({ message: 'No pending sign-up. Please start again.' });
        }
        const code = await issueOtp({ email, purpose: 'signup', payload: existing.payload });
        await trySendOtp({ to: email, code, purpose: 'signup' });
        res.json({ message: `New code sent to ${email}.`, ttlMinutes: OTP_TTL_MIN });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// ── Admin sign-up (unchanged: gated by manual super-admin approval) ────────
router.post('/admin-register', authLimiter, async (req, res) => {
    try {
        const { username, email, password, displayName, gymName } = req.body;

        if (!username?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }
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
            status: 'pending',
            emailVerified: true,
        });

        res.status(201).json({ message: 'Registration submitted. You will be notified once your account is approved.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
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

        if (user.role === 'user' && user.adminId) {
            const parentAdmin = await User.findById(user.adminId).select('status gymName');
            if (parentAdmin && parentAdmin.status === 'suspended') {
                return res.status(403).json({
                    message: `Access to this platform has been temporarily suspended by your gym (${parentAdmin.gymName || 'your gym'}). Please contact your gym administrator for more information.`,
                    code: 'GYM_SUSPENDED',
                });
            }
        }

        // Stamp login + first heartbeat (fire-and-forget).
        const now = new Date();
        User.updateOne({ _id: user._id }, { $set: { lastLoginAt: now, lastSeenAt: now } }).catch(() => {});

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

// PUT /api/auth/me — profile fields only (NO password / NO username here).
router.put('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.displayName = req.body.displayName || user.displayName;
        user.weight = req.body.weight ?? user.weight;
        user.height = req.body.height ?? user.height;
        user.age = req.body.age ?? user.age;
        user.dailyCalorieGoal = req.body.dailyCalorieGoal ?? user.dailyCalorieGoal;

        const updatedUser = await user.save();
        const existingToken = req.headers.authorization.split(' ')[1];
        res.json(buildUserResponse(updatedUser, existingToken));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ── Settings: request OTP for a sensitive action ───────────────────────────
router.post('/me/otp', protect, otpLimiter, async (req, res) => {
    try {
        const { purpose } = req.body;
        if (!['change_password', 'change_username', 'reset_data'].includes(purpose)) {
            return res.status(400).json({ message: 'Invalid OTP purpose' });
        }
        if (purpose === 'reset_data' && req.user.role !== 'user') {
            return res.status(403).json({ message: 'Data reset is only available for member accounts.' });
        }
        const code = await issueOtp({
            email: req.user.email,
            purpose,
            userId: req.user._id,
        });
        await trySendOtp({ to: req.user.email, code, purpose });
        res.json({
            message: `Verification code sent to ${req.user.email}.`,
            ttlMinutes: OTP_TTL_MIN,
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// ── Settings: change password (OTP + currentPassword) ──────────────────────
router.post('/me/change-password', protect, async (req, res) => {
    try {
        const { otp, currentPassword, newPassword } = req.body;
        if (!otp || !currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password, new password, and verification code are required' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!(await user.matchPassword(currentPassword))) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        await consumeOtp({ email: user.email, purpose: 'change_password', code: otp });

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Password updated successfully.' });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// ── Settings: change username (OTP + uniqueness) ───────────────────────────
router.post('/me/change-username', protect, async (req, res) => {
    try {
        const { otp, newUsername } = req.body;
        if (!otp || !newUsername?.trim()) {
            return res.status(400).json({ message: 'New username and verification code are required' });
        }
        const trimmed = newUsername.trim();
        if (trimmed.length < 3) {
            return res.status(400).json({ message: 'Username must be at least 3 characters' });
        }
        if (trimmed === req.user.username) {
            return res.status(400).json({ message: 'New username is the same as your current one' });
        }
        const dupe = await User.findOne({ username: trimmed, _id: { $ne: req.user._id } });
        if (dupe) {
            return res.status(409).json({ message: 'That username is already taken' });
        }
        await consumeOtp({ email: req.user.email, purpose: 'change_username', code: otp });

        const user = await User.findById(req.user._id);
        user.username = trimmed;
        await user.save();
        const existingToken = req.headers.authorization.split(' ')[1];
        res.json(buildUserResponse(user, existingToken));
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

// ── Settings: reset all my data (OTP) ──────────────────────────────────────
// Wipes the user's workout sessions and meal entries. Profile and account remain.
router.post('/me/reset-data', protect, async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json({ message: 'Data reset is only available for member accounts.' });
        }
        const { otp } = req.body;
        if (!otp) return res.status(400).json({ message: 'Verification code is required' });

        await consumeOtp({ email: req.user.email, purpose: 'reset_data', code: otp });

        const [workoutsRes, mealsRes] = await Promise.all([
            WorkoutSession.deleteMany({ userId: req.user._id }),
            MealEntry.deleteMany({ userId: req.user._id }),
        ]);

        res.json({
            message: 'All workout and nutrition history has been deleted.',
            deleted: {
                workoutSessions: workoutsRes.deletedCount || 0,
                mealEntries: mealsRes.deletedCount || 0,
            },
        });
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

module.exports = router;
