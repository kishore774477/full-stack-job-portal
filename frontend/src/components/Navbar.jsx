import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Job<span>Portal</span>
      </Link>
      <nav>
        <NavLink to="/jobs">Jobs</NavLink>
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <span className="nav-user" title={user.email}>
              {user.name || user.email}
            </span>
            <button className="btn btn-outline btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <Link to="/register" className="btn btn-sm">
              Sign up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Navbar;
