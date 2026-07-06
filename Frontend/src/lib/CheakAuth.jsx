import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_BACKEND_URL;

function CheckAuth({ children, requireAuth = true }) {
  const [status, setStatus] = useState("loading"); // loading | authed | guest

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => setStatus(res.ok ? "authed" : "guest"))
      .catch(() => setStatus("guest"));
  }, []);

  if (status === "loading") return null;

  if (requireAuth && status === "guest") {
    return <Navigate to="/login" replace />;
  }
  if (!requireAuth && status === "authed") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export default CheckAuth;