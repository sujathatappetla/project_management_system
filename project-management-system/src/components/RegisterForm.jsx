import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterForm.css";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "",
    faculty: "",
  });

  const [errors, setErrors] = useState({});
  const [faculties, setFaculties] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.role === "Team Lead") {
      fetch("https://project-management-system-m1ro.onrender.com/api/auth/faculty")
        .then((res) => res.json())
        .then((data) => setFaculties(data))
        .catch((err) => console.error("Error fetching faculty:", err));
    }
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      username: !formData.username.trim(),
      email: !formData.email.trim(),
      password: !formData.password.trim(),
      role: !formData.role.trim(),
      faculty: formData.role === "Team Lead" && !formData.faculty,
    };

    setErrors(newErrors);
    if (Object.values(newErrors).some((error) => error)) return;

    try {
      const response = await fetch("https://project-management-system-m1ro.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful");
        navigate("/login");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="register-container">
      <div className="animated-bg">
        <div className="register-shape register-shape1"></div>
        <div className="register-shape register-shape2"></div>
        <div className="register-shape register-shape3"></div>
      </div>
      <div className="register-card">
        <h2 className="register-title">Register</h2>
        <form onSubmit={handleSubmit} className="form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            className={`input-field ${errors.username ? "error-field" : ""}`}
            value={formData.username}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            className={`input-field ${errors.email ? "error-field" : ""}`}
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            className={`input-field ${errors.password ? "error-field" : ""}`}
            value={formData.password}
            onChange={handleChange}
          />
          <select
            name="role"
            className={`input-field ${errors.role ? "error-field" : ""}`}
            value={formData.role}
            onChange={handleChange}
          >
            <option value="">Select Role</option>
            <option value="Faculty">Faculty</option>
            <option value="Team Lead">Team Lead</option>
            <option value="Student">Student</option>
          </select>

          {formData.role === "Team Lead" && (
            <select
              name="faculty"
              className={`input-field ${errors.faculty ? "error-field" : ""}`}
              value={formData.faculty}
              onChange={handleChange}
            >
              <option value="">Select Faculty</option>
              {faculties.map((faculty) => (
                <option key={faculty._id} value={faculty._id}>
                  {faculty.username}
                </option>
              ))}
            </select>
          )}

          <button type="submit" className="register-btn">
            Register
          </button>
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="register-link"
            >
              Login here
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
