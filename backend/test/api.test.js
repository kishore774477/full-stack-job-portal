const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Run against a temporary copy of the seed data
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'job-portal-'));
for (const f of ['users.json', 'jobs.json', 'applications.json']) {
    fs.copyFileSync(path.join(__dirname, '..', 'data', f), path.join(tmp, f));
}
process.env.DATA_DIR = tmp;

const app = require('../server');
let server;
let base;

const call = async (method, url, body, token) => {
    const res = await fetch(base + url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json() };
};

const login = async (email) => (await call('POST', '/api/auth/login', { email, password: 'password123' })).body.token;

before(async () => {
    server = app.listen(0);
    await new Promise((r) => server.once('listening', r));
    base = `http://localhost:${server.address().port}`;
});

after(() => {
    server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
});

test('lists and filters jobs', async () => {
    const all = await call('GET', '/api/jobs');
    assert.strictEqual(all.status, 200);
    assert.strictEqual(all.body.length, 3);
    const filtered = await call('GET', '/api/jobs?search=react');
    assert.strictEqual(filtered.body.length, 1);
});

test('rejects bad login and accepts demo login', async () => {
    const bad = await call('POST', '/api/auth/login', { email: 'user@example.com', password: 'wrong' });
    assert.strictEqual(bad.status, 401);
    assert.ok(await login('user@example.com'));
});

test('register validates and creates user', async () => {
    const dup = await call('POST', '/api/auth/register', {
        name: 'X', email: 'user@example.com', password: 'secret1', role: 'job_seeker',
    });
    assert.strictEqual(dup.status, 409);
    const ok = await call('POST', '/api/auth/register', {
        name: 'New', email: 'new@example.com', password: 'secret1', role: 'job_seeker',
    });
    assert.strictEqual(ok.status, 201);
    assert.ok(ok.body.token);
    assert.strictEqual(ok.body.user.password, undefined);
});

test('full apply → review flow with role checks', async () => {
    const seeker = await login('user@example.com');
    const employer = await login('employer@example.com');

    assert.strictEqual((await call('POST', '/api/applications', { jobId: '101', name: 'A', email: 'a@b.c' })).status, 401);
    assert.strictEqual((await call('POST', '/api/jobs', { title: 't' }, seeker)).status, 403);

    const job = await call('POST', '/api/jobs', {
        title: 'QA Engineer', company: 'Test Co', location: 'Chennai', type: 'Full-time', description: 'Testing',
    }, employer);
    assert.strictEqual(job.status, 201);

    const app1 = await call('POST', '/api/applications', { jobId: job.body.job.id, name: 'Seeker', email: 's@x.com' }, seeker);
    assert.strictEqual(app1.status, 201);
    const dup = await call('POST', '/api/applications', { jobId: job.body.job.id, name: 'Seeker', email: 's@x.com' }, seeker);
    assert.strictEqual(dup.status, 409);

    const received = await call('GET', '/api/applications/received', null, employer);
    assert.ok(received.body.some((a) => a.id === app1.body.application.id));

    const upd = await call('PATCH', `/api/applications/${app1.body.application.id}/status`, { status: 'accepted' }, employer);
    assert.strictEqual(upd.status, 200);

    const mine = await call('GET', '/api/applications/me', null, seeker);
    assert.strictEqual(mine.body.find((a) => a.id === app1.body.application.id).status, 'accepted');

    assert.strictEqual((await call('DELETE', `/api/jobs/${job.body.job.id}`, null, employer)).status, 200);
});
