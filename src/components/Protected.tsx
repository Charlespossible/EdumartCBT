import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const isTokenValid = (token: string): boolean => {
  try {
    // JWTs are 3 Base64URL segments: header.payload.signature
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    // Decode the payload (middle segment)
    // atob requires standard Base64 — replace URL-safe chars first
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    // exp is in seconds — compare against current time in milliseconds
    return typeof payload.exp === "number" && payload.exp * 1000 > Date.now();
  } catch {
    // Malformed token, missing fields, or JSON parse failure
    return false;
  }
};

const ProtectedRoute: React.FC = () => {
  const raw = localStorage.getItem("user");

  if (!raw) {
    return <Navigate to="/login" replace />;
  }

  try {
    const parsed = JSON.parse(raw);
    const accessToken: string = parsed?.accessToken;

    if (!accessToken || !isTokenValid(accessToken)) {
      // Token missing or expired — clear stale storage and redirect
      localStorage.removeItem("user");
      return <Navigate to="/login" replace />;
    }
  } catch {
    // Stored value is not valid JSON — treat as unauthenticated
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;