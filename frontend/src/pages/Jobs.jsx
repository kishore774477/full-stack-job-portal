import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../api';
import { useAuth } from '../context/authContext';

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'];

function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ search: '', location: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/jobs', { params: filters });
        if (!cancelled) {
          setJobs(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  const update = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  return (
    <>
      <section className="hero">
        <h1>Find your next job</h1>
        <p>Browse open roles and apply in a couple of clicks.</p>
        <div className="filters">
          <input name="search" placeholder="Title, company or keyword" value={filters.search} onChange={update} />
          <input name="location" placeholder="Location" value={filters.location} onChange={update} />
          <select name="type" value={filters.type} onChange={update}>
            <option value="">All types</option>
            {JOB_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </section>

      {error && <p className="alert alert-error">{error}</p>}
      {loading && !jobs.length && <p className="muted">Loading jobs…</p>}
      {!loading && !error && !jobs.length && <p className="muted">No jobs match your search.</p>}

      <div className="grid">
        {jobs.map((job) => (
          <article key={job.id} className="card job-card">
            <div>
              <h3>{job.title}</h3>
              <p className="company">{job.company}</p>
              <div className="tags">
                <span className="tag">📍 {job.location}</span>
                <span className="tag">{job.type}</span>
                {job.salary && <span className="tag">💰 {job.salary}</span>}
              </div>
              <p>{job.description}</p>
            </div>
            <div className="card-actions">
              {job.postedAt && <small className="muted">Posted {new Date(job.postedAt).toLocaleDateString()}</small>}
              {user?.role === 'employer' ? null : (
                <Link to={`/apply/${job.id}`} className="btn">
                  Apply now
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}

export default Jobs;
