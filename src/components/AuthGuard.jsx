import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

/**
 * Wraps protected routes — redirects to /login if not authenticated.
 */
const AuthGuard = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="center-screen">
        <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default AuthGuard;
