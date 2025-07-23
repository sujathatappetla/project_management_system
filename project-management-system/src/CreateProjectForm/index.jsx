import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CreateProjectForm = () => {
  const [formData, setFormData] = useState({
    projectName: "",
    projectType: "AI",
    assignedBy: "",
    assignedTo: "",
    milestone: "",
    description: "",
    status:"Ongoing"
  });

  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [authData, setAuthData] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const studentResponse = await axios.get("https://project-management-system-m1ro.onrender.com/api/users/team-leads");
        const facultyResponse = await axios.get("https://project-management-system-m1ro.onrender.com/api/users/faculty");

        setStudents(studentResponse.data);
        setFaculty(facultyResponse.data);
      } catch (error) {
        console.error("Error fetching members:", error);
      }
    };

    fetchMembers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setAuthData({ ...authData, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowModal(true); // Show modal for email and password input
  };

  const handleModalSubmit = async () => {
    try {
      // Save project in the database
      const projectPayload = { 
        ...formData, 
        createdAt: new Date().toISOString() 
      };
      console.log("ProjectPayload:", projectPayload);
      const projectResponse = await axios.post("https://project-management-system-m1ro.onrender.com/api/projects", projectPayload);
  
      if (projectResponse.status === 200) {
        // Send email notification using the notify endpoint
        const emailPayload = { ...formData, ...authData };
        console.log("EmailPayload:", emailPayload);
        await axios.post("https://project-management-system-m1ro.onrender.com/api/notify", emailPayload);
  
        alert("Project assigned and email sent!");
        setShowModal(false);
        navigate("/TeamLeadDashboard", { state: formData });
      } else {
        alert("Failed to save project details.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while sending notification.");
    }
  };


  

  return (
    <div className="w-full h-[650px] flex items-center justify-center p-6 bg-gradient-to-r from-blue-400 to-white">
      {/* Left Side - Image */}
      <div className="w-1/2 flex justify-end pr-6">
        <img
          src="https://res.cloudinary.com/dzvoio2br/image/upload/v1732900942/pic1-removebg-preview_co8zik.png"
          alt="Descriptive Text"
          className="w-[700px] h-[500px]"
        />
      </div>

      {/* Right Side - Form */}
      <div className="w-1/2 bg-[#91bff3d0] p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Create New Project</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-6">
          {/* Left Column */}
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">
                Project Name
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                placeholder="Enter project name"
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Project Type</label>
              <select
                name="projectType"
                value={formData.projectType}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="AI">AI</option>
                <option value="ML">ML</option>
                <option value="Fullstack">Fullstack</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter description"
                className="w-full px-3 py-2 border rounded-lg"
                rows="4"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="flex-1">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Assigned By</label>
              <select
                name="assignedBy"
                value={formData.assignedBy}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Faculty</option>
                {faculty.map((member) => (
                  <option key={member._id} value={member.username}>
                    {member.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Assigned To</label>
              <select
                name="assignedTo"
                value={formData.assignedTo}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Student</option>
                {students.map((member) => (
                  <option key={member._id} value={member.username}>
                    {member.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Milestone</label>
              <input
                type="date"
                name="milestone"
                value={formData.milestone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Pendding Approval">Pendding Approval</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="w-full flex justify-end">
            <button
              type="submit"
              className="bg-orange-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-4">Enter Email Credentials</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Email</label>
              <input
                type="email"
                name="email"
                value={authData.email}
                onChange={handleModalChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-bold">Password</label>
              <input
                type="password"
                name="password"
                value={authData.password}
                onChange={handleModalChange}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleModalSubmit}
                className="bg-blue-700 text-white px-4 py-2 rounded-lg mr-2"
              >
                Submit
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateProjectForm;
