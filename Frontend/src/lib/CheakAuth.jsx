import React from "react";
import { Navigate } from "react-router-dom";

function getToken() {
  const raw = localStorage.getItem("token");
  if (!raw || raw === "undefined" || raw === "null" || raw.trim() === "") {
    return null;
  }
  return raw;
}

function CheckAuth({ children, requireAuth = true }) {
  const token = getToken();

  if (requireAuth && !token) {
    return <Navigate to="/login" replace />;
  }

  if (!requireAuth && token) {
    return <Navigate to="/Dasktop" replace />;
  }

  return <>{children}</>;
}

export default CheckAuth;