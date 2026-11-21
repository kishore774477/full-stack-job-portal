import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { errorMessage } from '../api';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <div className="card auth-card">
      <h2>Log in</h2>
      {error && <p className="alert alert-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={update} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" value={form.password} onChange={update} required />
        </div>
        <button className="btn btn-block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="muted center">
        No account? <Link to="/register">Sign up</Link>
      </p>
      <div className="demo">
        <strong>Demo accounts</strong> (password <code>password123</code>)
        <br />
        Job seeker: <code>user@example.com</code>
        <br />
        Employer: <code>employer@example.com</code>
      </div>
    </div>
  );
}

export default Login;
