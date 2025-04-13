import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const AdminRoute = () => {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();

  if (isLoading) {
    return <div>Loading Authentication...</div>;
  }

  if (!isAuthenticated) {
    // Not logged in
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user?.role !== "admin") {
    // Logged in, but not an admin
    console.warn("Access denied: User is not an admin.");
    // Redirect to home or show an 'Access Denied' component
    return <Navigate to="/" replace />;
    // Or: return <div>Access Denied: Admin privileges required.</div>;
  }

  // Authenticated and is an admin
  return <Outlet />;
};

export default AdminRoute;
