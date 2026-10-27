import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLE_LINK } from '../utils/roles.js';

// Usage: <ProtectedRoute roles={['Customer']}><CustomerDashboard /></ProtectedRoute>
// - not logged in      → /login (and back here afterwards)
// - wrong role         → their own dashboard
export default function ProtectedRoute({ roles, children }) {
  const { user, isLoggedIn } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_LINK[user.role]?.to || '/'} replace />;
  }
  return children;
}
