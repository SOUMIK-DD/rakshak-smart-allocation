import React, { useState } from "react";
import { useAuth } from "./AuthContext";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operator");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(username, password, role);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#1e293b",
          borderRadius: 16,
          padding: 32,
          width: 400,
          maxWidth: "100%",
          border: "1px solid #334155",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <span style={{ fontSize: 48 }}>🏥</span>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#f8fafc", marginTop: 8 }}>
            Disaster Management System
          </h1>
          <p style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
            Odisha Emergency Response Platform
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
          <button
            onClick={() => { setIsRegister(false); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 6,
              border: "none",
              background: !isRegister ? "#3b82f6" : "#334155",
              color: "#f8fafc",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(""); }}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 6,
              border: "none",
              background: isRegister ? "#3b82f6" : "#334155",
              color: "#f8fafc",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Register
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 6,
              background: "#7f1d1d",
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Username</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #475569",
                background: "#0f172a",
                color: "#e2e8f0",
                marginTop: 6,
                fontSize: 14,
              }}
              placeholder="Enter username"
              required
              minLength={3}
            />
          </label>

          <label style={{ display: "block", marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 6,
                border: "1px solid #475569",
                background: "#0f172a",
                color: "#e2e8f0",
                marginTop: 6,
                fontSize: 14,
              }}
              placeholder="Enter password"
              required
              minLength={6}
            />
          </label>

          {isRegister && (
            <label style={{ display: "block", marginBottom: 16 }}>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Role</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "#e2e8f0",
                  marginTop: 6,
                  fontSize: 14,
                }}
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="operator">Operator (Manage data)</option>
                <option value="admin">Admin (Full access)</option>
              </select>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 6,
              border: "none",
              background: loading ? "#475569" : "#3b82f6",
              color: "#f8fafc",
              fontWeight: 600,
              fontSize: 14,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Please wait..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Default credentials hint */}
        {!isRegister && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 6, background: "#0f172a", fontSize: 12, color: "#64748b" }}>
            <strong>Default admin:</strong> admin / admin123
          </div>
        )}
      </div>
    </div>
  );
}
