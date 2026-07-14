import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const userJson = localStorage.getItem("user");
  
  if (!token || !userJson) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userJson);
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect unauthorized users to their respective dashboard
      return <Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/employee-dashboard'} replace />;
    }
  } catch (e) {
    // If JSON parsing fails, clear localStorage and redirect to login
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
