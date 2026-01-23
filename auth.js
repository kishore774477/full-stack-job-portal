const express = require('express');
const router = express.Router();
const { readFile } = require('../utils/fileHandler');

// Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const users = await readFile('users.json');

    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        // In a real app, generate a JWT token here
        res.json({
            success: true,
            message: 'Login successful',
            user: { id: user.id, email: user.email, role: user.role }
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

module.exports = router;
