const mongoose = require('mongoose');

/**
 * One-time-password records.
 * - codeHash: sha256 of the 6-digit code (never store raw codes)
 * - purpose:  what the OTP unlocks
 * - payload:  ephemeral data tied to the OTP (signup data, target username, etc.)
 * - expiresAt: TTL — Mongo auto-deletes the doc after this timestamp
 */
const otpSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    purpose: {
        type: String,
        required: true,
        enum: ['signup', 'change_password', 'change_username', 'reset_data'],
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

otpSchema.index({ email: 1, purpose: 1 });

module.exports = mongoose.model('Otp', otpSchema);
