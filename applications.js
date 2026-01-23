const express = require('express');
const router = express.Router();
const { readFile, writeFile } = require('../utils/fileHandler');

// Submit Application
router.post('/', async (req, res) => {
    const { jobId, userId, userData } = req.body; // userData could be resume link, etc.
    const applications = await readFile('applications.json');

    const newApplication = {
        id: Date.now().toString(),
        jobId,
        userId, // The user applying
        status: 'applied',
        appliedAt: new Date().toISOString(),
        ...userData
    };

    applications.push(newApplication);
    await writeFile('applications.json', applications);

    res.status(201).json({ success: true, message: 'Application submitted successfully', application: newApplication });
});

module.exports = router;
