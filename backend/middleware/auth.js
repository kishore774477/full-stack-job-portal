const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const signToken = (user) =>
    jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
        expiresIn: '7d',
    });

// Requires a valid "Authorization: Bearer <token>" header
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Please log in first' });
    }
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ success: false, message: 'Session expired, please log in again' });
    }
};

const requireRole = (role) => (req, res, next) => {
    if (req.user?.role !== role) {
        return res.status(403).json({ success: false, message: `Only ${role.replace('_', ' ')}s can do this` });
    }
    next();
};

module.exports = { signToken, requireAuth, requireRole };
