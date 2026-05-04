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
}, {
    timestamps: true,
});

// Always return a settings doc (create if missing).
platformSettingsSchema.statics.getSettings = async function () {
    // First check if a legacy doc exists with autoApproveUsers but no signupMode.
    // Use the raw collection to see all fields (Mongoose strips fields not in schema).
    const raw = await this.collection.findOne({ _id: 'platform' });
    if (raw && !raw.signupMode) {
        const mode = raw.autoApproveUsers === false ? 'manual' : 'otp';
        await this.collection.updateOne(
            { _id: 'platform' },
            { $set: { signupMode: mode }, $unset: { autoApproveUsers: '' } }
        );
    }
    const settings = await this.findByIdAndUpdate(
        'platform',
        { $setOnInsert: { _id: 'platform', signupMode: 'otp' } },
        { returnDocument: 'after', upsert: true }
    );
    return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
