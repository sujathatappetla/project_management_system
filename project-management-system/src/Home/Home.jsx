import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";
import { CircleArrowRight } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  const toggleLoginContainer = () => {
    setShowLogin(!showLogin);
  };

  const redirectToLogin = () => {
    navigate("/login");
    setShowLogin(false); 
  };

  useEffect(() => {
    // Trigger fade-in animation on page load
    document.querySelector(".home-container").classList.add("fade-in");
  }, []);

  return (
    <div className="home-container">
      {/* Navbar Section */}
      <div className="navbar">
        <div className="navbar-content">
          <img
            src="https://res.cloudinary.com/dd7kbp3ke/image/upload/v1744269984/ChatGPT_Image_Apr_10__2025__12_41_08_PM-removebg-preview_ylmgbg.png"
            alt="projectmanagementsystem"
            className="project-management-logo"
          />
          <h1 className="navbar-heading">Project Management System</h1>
        </div>
        <div className="login-logo" onClick={toggleLoginContainer}>
          <FontAwesomeIcon icon={faUser} />
        </div>
      </div>

      {showLogin && (
        <div className="login-container animate-pop" onClick={redirectToLogin}>
          <p className="login-text">Login</p>
        </div>
      )}
      <div className="first-container">
        <div className="content-container slide-in-left">
          <h1 className="main-heading gradient-text">Project Management System</h1>
          <p className="description-text">Managing your project and collaborating with your team</p>
          <button className="register-button shimmer" onClick={redirectToLogin}>
            Get Started
            <CircleArrowRight className="icon" />
          </button>
        </div>
        <div className="image-container slide-in-right">
          <img
            src="https://res.cloudinary.com/dd7kbp3ke/image/upload/v1732786438/image2_zaxkyy.png"
            alt="Study in USA"
            className="hero-image floating"
          />
        </div>
      </div>
    </div>
  );
};

export default Home;
