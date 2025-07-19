// src/Login/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [roleError, setRoleError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError(false);
    setPasswordError(false);
    setRoleError(false);

    if (!email.trim() || !password.trim() || !role) {
      alert("Email, password, and role are required");
      setEmailError(!email.trim());
      setPasswordError(!password.trim());
      setRoleError(!role);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();
      if (response.status === 200) {
        localStorage.setItem("user", JSON.stringify(data.user));
        if (role === "Faculty") navigate("/FacultyDashboard");
        else if (role === "Student") navigate("/StudentDashboard");
        else if (role === "Team Lead") navigate("/TeamLeadDashboard");
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="background-shapes-container">
      {/* Animated Background Shapes */}
      <div className="animated-shapes">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      
      <div className="login-wrapper">
        <div className="login-card fade-in">
          <div className="login-left slide-in-left">
            <h2>Welcome Back</h2>
            <p>Please login to your dashboard</p>
            <form onSubmit={handleLogin}>
              <input
                type="email"
                placeholder={emailError ? "Email is required" : "Email"}
                className={`form-input ${emailError ? "input-error" : ""}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder={passwordError ? "Password is required" : "Password"}
                className={`form-input ${passwordError ? "input-error" : ""}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <select
                className={`form-input ${roleError ? "input-error" : ""}`}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Student</option>
                <option value="Team Lead">Team Lead</option>
              </select>
              <button type="submit" className="login-btn">Login</button>
            </form>
            <p className="register-text">
              Don’t have an account?{" "}
              <a href="/register" className="register-link">Register</a>
            </p>
          </div>
          <div className="login-right slide-in-right">
            <h3>Project Management System</h3>
            <p>
              Efficiently manage your academic projects with real-time collaboration and tracking.
            </p>
            <img
              src="https://res.cloudinary.com/dxjtftb8g/image/upload/v1732858395/WhatsApp_Image_2024-11-29_at_10.39.59_AM-removebg-preview_uhcga1.png"
              alt="Illustration"
              className="login-image bounce"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
