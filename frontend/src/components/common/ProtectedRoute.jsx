import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Route guard component for authenticated patron routes.
 * Redirects unauthenticated visitors to /login preserving the return location.
 */
export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, initializing } = useSelector((state) => state.auth);
  const location = useLocation();

  if (initializing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Verifying session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
