import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/authContext';

function ApplyJob() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    resumeLink: '',
    coverLetter: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then(({ data }) => setJob(data))
      .catch((err) => setLoadError(errorMessage(err)));
  }, [id]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/applications', { jobId: id, ...form });
      setSuccess('Application submitted! Redirecting to your dashboard…');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <div className="card">
        <p className="alert alert-error">{loadError}</p>
        <Link to="/jobs">← Back to jobs</Link>
      </div>
    );
  }
  if (!job) return <p className="muted">Loading job…</p>;

  return (
    <div className="apply-layout">
      <div className="card">
        <Link to="/jobs" className="muted">
          ← Back to jobs
        </Link>
        <h2>{job.title}</h2>
        <p className="company">{job.company}</p>
        <div className="tags">
          <span className="tag">📍 {job.location}</span>
          <span className="tag">{job.type}</span>
          {job.salary && <span className="tag">💰 {job.salary}</span>}
        </div>
        <p>{job.description}</p>
      </div>

      <div className="card">
        <h3>Apply for this job</h3>
        {error && <p className="alert alert-error">{error}</p>}
        {success && <p className="alert alert-success">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={update} required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={update} required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" type="tel" value={form.phone} onChange={update} />
          </div>
          <div className="form-group">
            <label htmlFor="resumeLink">Resume link</label>
            <input
              id="resumeLink"
              name="resumeLink"
              type="url"
              placeholder="https://drive.google.com/…"
              value={form.resumeLink}
              onChange={update}
            />
          </div>
          <div className="form-group">
            <label htmlFor="coverLetter">Cover letter</label>
            <textarea id="coverLetter" name="coverLetter" rows={5} value={form.coverLetter} onChange={update} />
          </div>
          <button className="btn btn-block" disabled={submitting || !!success}>
            {submitting ? 'Submitting…' : 'Submit application'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ApplyJob;
