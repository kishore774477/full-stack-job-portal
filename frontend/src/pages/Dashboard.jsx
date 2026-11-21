import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/authContext';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];
const STATUSES = ['applied', 'reviewing', 'accepted', 'rejected'];

const StatusBadge = ({ status }) => <span className={`badge badge-${status}`}>{status}</span>;

function SeekerDashboard() {
  const [applications, setApplications] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/applications/me')
      .then(({ data }) => setApplications(data))
      .catch((err) => setError(errorMessage(err)));
  }, []);

  if (error) return <p className="alert alert-error">{error}</p>;
  if (!applications) return <p className="muted">Loading…</p>;

  return (
    <section className="card">
      <h2>My applications ({applications.length})</h2>
      {applications.length === 0 ? (
        <p className="muted">
          You haven't applied to any jobs yet. <Link to="/jobs">Browse jobs →</Link>
        </p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Applied on</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id}>
                  <td>{a.job?.title || 'Job removed'}</td>
                  <td>{a.job?.company || '—'}</td>
                  <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const emptyJob = { title: '', company: '', location: '', type: 'Full-time', salary: '', description: '' };

function EmployerDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(emptyJob);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [jobsRes, appsRes] = await Promise.all([api.get('/jobs/mine'), api.get('/applications/received')]);
      setJobs(jobsRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const postJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/jobs', form);
      setForm(emptyJob);
      setMessage({ type: 'success', text: 'Job posted successfully' });
      load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job and all its applications?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      load();
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await api.patch(`/applications/${id}/status`, { status });
      setApplications((apps) => apps.map((a) => (a.id === id ? { ...a, status } : a)));
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err) });
    }
  };

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <>
      {message.text && <p className={`alert alert-${message.type}`}>{message.text}</p>}

      <div className="stats">
        <div className="card stat">
          <strong>{jobs.length}</strong>
          <span>Jobs posted</span>
        </div>
        <div className="card stat">
          <strong>{applications.length}</strong>
          <span>Applications</span>
        </div>
        <div className="card stat">
          <strong>{applications.filter((a) => a.status === 'accepted').length}</strong>
          <span>Accepted</span>
        </div>
      </div>

      <div className="apply-layout">
        <section className="card">
          <h2>Post a new job</h2>
          <form onSubmit={postJob}>
            <div className="form-group">
              <label htmlFor="title">Job title</label>
              <input id="title" name="title" value={form.title} onChange={update} required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="company">Company</label>
                <input id="company" name="company" value={form.company} onChange={update} required />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input id="location" name="location" value={form.location} onChange={update} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select id="type" name="type" value={form.type} onChange={update}>
                  {JOB_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="salary">Salary (optional)</label>
                <input id="salary" name="salary" value={form.salary} onChange={update} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={4} value={form.description} onChange={update} required />
            </div>
            <button className="btn btn-block">Post job</button>
          </form>
        </section>

        <section className="card">
          <h2>My jobs ({jobs.length})</h2>
          {jobs.length === 0 && <p className="muted">You haven't posted any jobs yet.</p>}
          <ul className="job-list">
            {jobs.map((j) => (
              <li key={j.id}>
                <div>
                  <strong>{j.title}</strong>
                  <div className="muted">
                    {j.location} · {j.type} · {applications.filter((a) => a.jobId === j.id).length} applicants
                  </div>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => deleteJob(j.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card">
        <h2>Applications received ({applications.length})</h2>
        {applications.length === 0 ? (
          <p className="muted">No applications yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Resume</th>
                  <th>Applied on</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.name}</strong>
                      <div className="muted">{a.email}</div>
                      {a.phone && <div className="muted">{a.phone}</div>}
                      {a.coverLetter && <details><summary>Cover letter</summary><p>{a.coverLetter}</p></details>}
                    </td>
                    <td>{a.job?.title}</td>
                    <td>
                      {a.resumeLink ? (
                        <a href={a.resumeLink} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{new Date(a.appliedAt).toLocaleDateString()}</td>
                    <td>
                      <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)}>
                        {STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function Dashboard() {
  const { user } = useAuth();
  return (
    <>
      <div className="page-head">
        <h1>Welcome, {user.name || user.email}</h1>
        <span className="tag">{user.role === 'employer' ? 'Employer' : 'Job seeker'}</span>
      </div>
      {user.role === 'employer' ? <EmployerDashboard /> : <SeekerDashboard />}
    </>
  );
}

export default Dashboard;
