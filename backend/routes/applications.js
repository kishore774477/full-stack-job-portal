const express = require('express');
const { readFile, writeFile } = require('../utils/fileHandler');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
const STATUSES = ['applied', 'reviewing', 'accepted', 'rejected'];

// Submit an application (job seekers only)
router.post('/', requireAuth, requireRole('job_seeker'), async (req, res) => {
    const { jobId, name, email, phone, resumeLink, coverLetter } = req.body || {};
    if (!jobId || !name || !email) {
        return res.status(400).json({ success: false, message: 'Job, name and email are required' });
    }

    const jobs = await readFile('jobs.json');
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const applications = await readFile('applications.json');
    if (applications.some((a) => a.jobId === jobId && a.userId === req.user.id)) {
        return res.status(409).json({ success: false, message: 'You have already applied for this job' });
    }

    const application = {
        id: Date.now().toString(),
        jobId,
        userId: req.user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone ? String(phone).trim() : '',
        resumeLink: resumeLink ? String(resumeLink).trim() : '',
        coverLetter: coverLetter ? String(coverLetter).trim() : '',
        status: 'applied',
        appliedAt: new Date().toISOString(),
    };
    applications.push(application);
    await writeFile('applications.json', applications);

    res.status(201).json({ success: true, message: 'Application submitted successfully', application });
});

// Applications of the logged-in job seeker (with job details)
router.get('/me', requireAuth, requireRole('job_seeker'), async (req, res) => {
    const [applications, jobs] = await Promise.all([readFile('applications.json'), readFile('jobs.json')]);
    const mine = applications
        .filter((a) => a.userId === req.user.id)
        .map((a) => ({ ...a, job: jobs.find((j) => j.id === a.jobId) || null }))
        .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    res.json(mine);
});

// Applications received for the employer's jobs
router.get('/received', requireAuth, requireRole('employer'), async (req, res) => {
    const [applications, jobs] = await Promise.all([readFile('applications.json'), readFile('jobs.json')]);
    const myJobs = jobs.filter((j) => j.employerId === req.user.id);
    const received = applications
        .filter((a) => myJobs.some((j) => j.id === a.jobId))
        .map((a) => ({ ...a, job: myJobs.find((j) => j.id === a.jobId) }))
        .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
    res.json(received);
});

// Update application status (employer who owns the job)
router.patch('/:id/status', requireAuth, requireRole('employer'), async (req, res) => {
    const { status } = req.body || {};
    if (!STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: `Status must be one of: ${STATUSES.join(', ')}` });
    }

    const [applications, jobs] = await Promise.all([readFile('applications.json'), readFile('jobs.json')]);
    const application = applications.find((a) => a.id === req.params.id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    const job = jobs.find((j) => j.id === application.jobId);
    if (!job || job.employerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only update applications for your own jobs' });
    }

    application.status = status;
    application.updatedAt = new Date().toISOString();
    await writeFile('applications.json', applications);
    res.json({ success: true, message: 'Status updated', application });
});

module.exports = router;
