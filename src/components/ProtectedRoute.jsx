import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen"><div className="loader" /> Chargement...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;

  return children;
}
