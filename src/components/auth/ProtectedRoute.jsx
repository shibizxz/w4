import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "../ui/LoadingSpinner";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner label="Checking secure session" />
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(
      `${location.pathname}${location.search}${location.hash}`,
    );

    return <Navigate replace to={`/auth?redirect=${redirect}`} />;
  }

  return children;
}

export default ProtectedRoute;
