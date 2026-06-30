const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: 'platform',
    },
    // 'otp'    → sign-up requires email OTP verification, then auto-approved.
    // 'manual' → sign-up creates a pending account, super-admin approves.
    signupMode: {
        type: String,
        enum: ['otp', 'manual'],
        default: 'otp',
    },
    // Only applies when signupMode='manual':
    // true  → auto-approve new users (no admin review)
    // false → require admin/super-admin approval
    autoApproveUsers: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Always return a settings doc (create if missing).
platformSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findByIdAndUpdate(
        'platform',
        { $setOnInsert: { _id: 'platform', signupMode: 'otp', autoApproveUsers: false } },
        { returnDocument: 'after', upsert: true }
    );
    return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
