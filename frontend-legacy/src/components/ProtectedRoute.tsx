import { Navigate } from 'react-router-dom';
import keycloak from '../auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Rôles Keycloak autorisés (realm-level) */
  roles: string[];
}

/**
 * Garde de route basée sur les rôles Keycloak (RBAC).
 * Redirige vers /unauthorized si l'utilisateur n'a aucun des rôles requis.
 */
const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const hasAccess = roles.some((role) => keycloak.hasRealmRole(role));
  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
