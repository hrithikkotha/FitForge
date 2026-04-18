const crypto = require('crypto');
const Otp = require('../models/Otp');

const OTP_TTL_MIN = Number(process.env.OTP_TTL_MIN || 10);
const MAX_ATTEMPTS = 5;

const generateCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const hashCode = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

const issueOtp = async ({ email, purpose, userId = null, payload = null }) => {
    const code = generateCode();
    await Otp.deleteMany({ email: email.toLowerCase(), purpose });
    await Otp.create({
        email: email.toLowerCase(),
        purpose,
        userId,
        payload,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60 * 1000),
    });
    return code;
};

const consumeOtp = async ({ email, purpose, code }) => {
    if (!code || !/^\d{4,8}$/.test(String(code))) {
        const err = new Error('Invalid code format');
        err.status = 400;
        throw err;
    }
    const otp = await Otp.findOne({ email: email.toLowerCase(), purpose });
    if (!otp) {
        const err = new Error('No pending verification — please request a new code.');
        err.status = 400;
        throw err;
    }
    if (otp.expiresAt < new Date()) {
        await otp.deleteOne();
        const err = new Error('Code has expired — please request a new one.');
        err.status = 400;
        throw err;
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
        await otp.deleteOne();
        const err = new Error('Too many incorrect attempts. Please request a new code.');
        err.status = 429;
        throw err;
    }
    if (hashCode(code) !== otp.codeHash) {
        otp.attempts += 1;
        await otp.save();
        const remaining = MAX_ATTEMPTS - otp.attempts;
        const err = new Error(`Incorrect code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        err.status = 400;
        throw err;
    }
    await otp.deleteOne();
    return otp;
};

module.exports = { issueOtp, consumeOtp, OTP_TTL_MIN };
