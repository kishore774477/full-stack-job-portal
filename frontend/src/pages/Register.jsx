import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { errorMessage } from '../api';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'job_seeker' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="card auth-card">
      <h2>Create an account</h2>
      {error && <p className="alert alert-error">{error}</p>}
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
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" minLength={6} value={form.password} onChange={update} required />
        </div>
        <div className="form-group">
          <label>I am a</label>
          <div className="role-toggle">
            <label className={form.role === 'job_seeker' ? 'active' : ''}>
              <input type="radio" name="role" value="job_seeker" checked={form.role === 'job_seeker'} onChange={update} />
              Job seeker
            </label>
            <label className={form.role === 'employer' ? 'active' : ''}>
              <input type="radio" name="role" value="employer" checked={form.role === 'employer'} onChange={update} />
              Employer
            </label>
          </div>
        </div>
        <button className="btn btn-block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className="muted center">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

export default Register;
