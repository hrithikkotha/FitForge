const User = require('../models/User');

const seedSuperAdmin = async () => {
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;
    const username = process.env.SUPER_ADMIN_USERNAME;

    if (!email || !password || !username) {
        console.log('[SuperAdmin Seed] Skipped — SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, SUPER_ADMIN_USERNAME not set in .env');
        return;
    }

    const existing = await User.findOne({ role: 'super_admin' });
    if (existing) {
        console.log('[SuperAdmin Seed] Super Admin already exists — skipped.');
        return;
    }

    await User.create({
        username,
        email,
        password,
        displayName: 'Super Admin',
        role: 'super_admin',
        status: 'active',
    });

    console.log(`[SuperAdmin Seed] Super Admin created: ${email}`);
};

module.exports = seedSuperAdmin;
