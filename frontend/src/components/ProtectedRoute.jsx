import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/authContext';

function ProtectedRoute({ children, role }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (role && user.role !== role) {
    return (
      <div className="card">
        <h2>Not allowed</h2>
        <p className="muted">This page is only for {role === 'employer' ? 'employers' : 'job seekers'}.</p>
      </div>
    );
  }
  return children;
}

export default ProtectedRoute;
