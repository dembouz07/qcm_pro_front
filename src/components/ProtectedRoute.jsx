import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';

export default function ProtectedRoute({ role, children, requireSubscription }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen"><div className="loader" /> Chargement...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} replace />;

  // Admin sans abonnement actif : rediriger vers la page d'abonnement
  if (requireSubscription && user.role === 'admin') {
    const active = user.subscription_status === 'active'
      && user.subscribed_until && new Date(user.subscribed_until) > new Date();
    if (!active) return <Navigate to="/admin/subscription" replace />;
  }

  return children;
}
