const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: 'platform',
    },
    autoApproveUsers: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Always return a settings doc (create if missing).
// $setOnInsert ensures we only write defaults when the doc is first created —
// a super-admin who manually set autoApproveUsers=false won't get it flipped.
platformSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findByIdAndUpdate(
        'platform',
        { $setOnInsert: { _id: 'platform', autoApproveUsers: true } },
        { new: true, upsert: true }
    );
    return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
