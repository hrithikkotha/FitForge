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
    weight: {
        type: Number,
        default: 0,
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

module.exports = mongoose.model('User', userSchema);
