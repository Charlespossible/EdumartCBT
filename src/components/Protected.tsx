import React from "react";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Validates a JWT access token.
 * - Ensures correct structure
 * - Ensures exp claim exists
 * - Ensures token is not expired
 */
const isTokenValid = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    return (
      typeof payload.exp === "number" &&
      payload.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  //localStorage.removeItem("isLoggedIn"); // if still used anywhere
};

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem("accessToken");

  // No token → not authenticated
  if (!token) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  // Invalid or expired token
  if (!isTokenValid(token)) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  // Optional: Validate user object integrity
  const rawUser = localStorage.getItem("user");
  if (rawUser) {
    try {
      JSON.parse(rawUser);
    } catch {
      clearAuthStorage();
      return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;