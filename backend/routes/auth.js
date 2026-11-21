const express = require('express');
const bcrypt = require('bcryptjs');
const { readFile, writeFile } = require('../utils/fileHandler');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();
const ROLES = ['job_seeker', 'employer'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

// Register
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body || {};

    if (!name || !email || !password || !role) {
        return res.status(400).json({ success: false, message: 'Name, email, password and role are required' });
    }
    if (!EMAIL_RE.test(email)) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email' });
    }
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    if (!ROLES.includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const users = await readFile('users.json');
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
        return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = {
        id: Date.now().toString(),
        name: name.trim(),
        email: normalizedEmail,
        password: await bcrypt.hash(password, 10),
        role,
        createdAt: new Date().toISOString(),
    };
    users.push(user);
    await writeFile('users.json', users);

    res.status(201).json({ success: true, message: 'Account created', token: signToken(user), user: publicUser(user) });
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const users = await readFile('users.json');
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    res.json({ success: true, message: 'Login successful', token: signToken(user), user: publicUser(user) });
});

// Current user
router.get('/me', requireAuth, async (req, res) => {
    const users = await readFile('users.json');
    const user = users.find((u) => u.id === req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user: publicUser(user) });
});

module.exports = router;
