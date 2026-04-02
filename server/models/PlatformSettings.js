const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: 'platform',
    },
    autoApproveUsers: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Always return a settings doc (create if missing)
platformSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findByIdAndUpdate(
        'platform',
        { $setOnInsert: { _id: 'platform' } },
        { new: true, upsert: true }
    );
    return settings;
};

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
