import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home/Home"; // Assume a placeholder home component exists
import LoginPage from "./components/Login";
import ProjectDetails from "./components/ProjectDetails.jsx";
import RegisterForm from "./components/RegisterForm";
import CreateProjectForm from "./CreateProjectForm/index.jsx";
import FacultyDashboard from "./CreateProjectForm/FacultyDashboard";
import TeamLeadDashboard from "./TeamLeadDashboard/index.jsx";
import TaskCreation from "./components/TaskCreation.jsx";
import StudentDashboard from "./StudentDashboad/index.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/create-project" element={<CreateProjectForm />} />
        <Route path="/project-details/:id" element={<ProjectDetails />} />
        <Route path="/FacultyDashboard" element={<FacultyDashboard />} />
        <Route path="/TeamLeadDashboard" element={<TeamLeadDashboard/>} />
        <Route path="/StudentDashboard" element={<StudentDashboard/>} />
      </Routes>
    </Router>
  );
};

export default App;
