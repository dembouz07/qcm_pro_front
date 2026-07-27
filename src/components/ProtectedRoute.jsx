import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { homePathFor } from '../utils/homePath.js';

export default function ProtectedRoute({ role, children, requireSubscription, requireFeature }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="center-screen"><div className="loader" /> Chargement...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={homePathFor(user)} replace />;

  // Toutes les formules, y compris la gratuite, sont considérées actives.
  if (requireSubscription && ['admin', 'enterprise'].includes(user.role)) {
    const active = user.is_super_admin || user.is_subscription_active;
    if (!active) return <Navigate to={user.role === 'enterprise' ? '/entreprise/abonnement' : '/admin/subscription'} replace />;
  }

  if (requireFeature && user.role === 'admin' && !user.is_super_admin) {
    const allowed = (user.plan_features || []).includes(requireFeature);
    if (!allowed) return <Navigate to={`/admin/subscription?upgrade=${requireFeature}`} replace />;
  }

  return children;
}
