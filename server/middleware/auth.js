const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized, user not found' });
        }

        // 1. Direct suspension — covers both admin and user accounts.
        if (req.user.status === 'suspended') {
            return res.status(403).json({ message: 'Account is not active' });
        }

        // 2. Propagated suspension — when a gym admin is suspended by the
        //    super-admin, all of that admin's users must also be blocked.
        //    Their own `status` stays 'active', so we must explicitly check
        //    the parent admin's status on every request.
        if (req.user.role === 'user' && req.user.adminId) {
            const parentAdmin = await User.findById(req.user.adminId).select('status').lean();
            if (parentAdmin && parentAdmin.status === 'suspended') {
                return res.status(403).json({ message: 'Account is not active' });
            }
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// Factory: authorizeRoles('admin', 'super_admin') etc.
const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Access denied: insufficient role' });
    }
    if (req.user.status !== 'active') {
        return res.status(403).json({ message: 'Account is not active' });
    }
    next();
};

module.exports = { protect, authorizeRoles };
