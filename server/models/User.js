const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: 3,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    displayName: {
        type: String,
        default: '',
    },
    currentWeight: {
        type: Number,
        default: 0,
    },
    goalWeight: {
        type: Number,
        default: 0,
    },
    weightGoalType: {
        type: String,
        enum: ['lose', 'gain', 'maintain'],
        default: 'maintain',
    },
    targetWeeklyChange: {
        type: Number,
        default: 0.5,
    },
    activityLevel: {
        type: String,
        enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
        default: 'moderate',
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        default: 'male',
    },
    height: {
        type: Number,
        default: 0,
    },
    age: {
        type: Number,
        default: 0,
    },
    dailyCalorieGoal: {
        type: Number,
        default: 2000,
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'super_admin'],
        default: 'user',
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'active',
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    gymName: {
        type: String,
        default: '',
    },
    // True for users created before email verification existed (grandfather);
    // new sign-ups must set this via OTP verification before the user doc is created.
    emailVerified: {
        type: Boolean,
        default: true,
    },
    // ── Activity tracking ─────────────────────────────────────────────────
    // Updated by middleware on every authenticated request (throttled to once
    // per minute per user). Powers the super-admin "last seen" view.
    lastSeenAt: {
        type: Date,
        default: null,
    },
    lastLoginAt: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ✅ P2-4: Add index for fast email lookups during login (COLLSCAN → IXSCAN)
userSchema.index({ email: 1 });

// ✅ P2-5: Add compound index for suspension propagation checks (adminId + status)
userSchema.index({ adminId: 1, status: 1 });

module.exports = mongoose.model('User', userSchema);
