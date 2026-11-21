const express = require('express');
const { readFile, writeFile } = require('../utils/fileHandler');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

// Get all jobs, optional filters: ?search=react&location=remote&type=Full-time
router.get('/', async (req, res) => {
    const { search = '', location = '', type = '' } = req.query;
    const jobs = await readFile('jobs.json');
    const q = String(search).toLowerCase();
    const loc = String(location).toLowerCase();

    const filtered = jobs
        .filter((j) => !q || [j.title, j.company, j.description].some((f) => f?.toLowerCase().includes(q)))
        .filter((j) => !loc || j.location?.toLowerCase().includes(loc))
        .filter((j) => !type || j.type === type)
        .sort((a, b) => (b.postedAt || '').localeCompare(a.postedAt || ''));

    res.json(filtered);
});

// Jobs posted by the logged-in employer
router.get('/mine', requireAuth, requireRole('employer'), async (req, res) => {
    const jobs = await readFile('jobs.json');
    res.json(jobs.filter((j) => j.employerId === req.user.id));
});

// Get job by ID
router.get('/:id', async (req, res) => {
    const jobs = await readFile('jobs.json');
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json(job);
});

// Create a job (employers only)
router.post('/', requireAuth, requireRole('employer'), async (req, res) => {
    const { title, company, location, type, salary, description } = req.body || {};
    if (!title || !company || !location || !type || !description) {
        return res.status(400).json({ success: false, message: 'Title, company, location, type and description are required' });
    }
    if (!JOB_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: `Type must be one of: ${JOB_TYPES.join(', ')}` });
    }

    const jobs = await readFile('jobs.json');
    const job = {
        id: Date.now().toString(),
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        type,
        salary: salary ? String(salary).trim() : '',
        description: description.trim(),
        employerId: req.user.id,
        postedAt: new Date().toISOString(),
    };
    jobs.push(job);
    await writeFile('jobs.json', jobs);
    res.status(201).json({ success: true, message: 'Job posted', job });
});

// Delete a job (owner only)
router.delete('/:id', requireAuth, requireRole('employer'), async (req, res) => {
    const jobs = await readFile('jobs.json');
    const job = jobs.find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.employerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only delete your own jobs' });
    }

    await writeFile('jobs.json', jobs.filter((j) => j.id !== job.id));
    const applications = await readFile('applications.json');
    await writeFile('applications.json', applications.filter((a) => a.jobId !== job.id));
    res.json({ success: true, message: 'Job deleted' });
});

module.exports = router;
