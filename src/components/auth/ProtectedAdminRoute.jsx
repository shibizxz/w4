import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

function ProtectedAdminRoute({ children }) {
  const location = useLocation();
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Checking admin session" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`,
    );

    return <Navigate replace to={`/admin/login?redirect=${redirect}`} />;
  }

  if (!isAdmin) {
    return <Navigate replace to="/dashboard" />;
  }

  return children;
}

export default ProtectedAdminRoute;
