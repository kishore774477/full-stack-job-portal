const express = require('express');
const router = express.Router();
const { readFile } = require('../utils/fileHandler');

// Get all jobs
router.get('/', async (req, res) => {
    const jobs = await readFile('jobs.json');
    res.json(jobs);
});

// Get job by ID
router.get('/:id', async (req, res) => {
    const jobs = await readFile('jobs.json');
    const job = jobs.find(j => j.id === req.params.id);
    if (job) {
        res.json(job);
    } else {
        res.status(404).json({ message: 'Job not found' });
    }
});

module.exports = router;
