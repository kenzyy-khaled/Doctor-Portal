import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";

function PublicRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PublicRoute;
