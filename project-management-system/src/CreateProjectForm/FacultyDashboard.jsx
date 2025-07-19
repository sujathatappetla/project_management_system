import React, { useState, useEffect,} from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatDistanceToNow } from "date-fns";
import {
  faUser,
  faBell,
  faSearch,
  faProjectDiagram,
  faUsers,
  faChartBar,
  faTasks,
  faClipboardCheck,
  faClock,
  faTimes,
  faSignOutAlt,
  faEllipsisV,
  faEdit,
  faTrash,
  faComments, 
  faEnvelope,
} from "@fortawesome/free-solid-svg-icons";
import "./FacultyDashboard.css";

const FacultyDashboard = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [view, setView] = useState("allProjects");
  const [menuOpen, setMenuOpen] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(""); 
  const [selectedTeamId, setSelectedTeamId] = useState(null); 
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showTeamMembers, setShowTeamMembers] = useState(false);
  const [teamDashboardMenu , setTeamDashboardMenu]=useState(null);
  const [selectedMembers, setSelectedMembers]=useState([]);
  const [membersNotInTeam, setMembersNotInTeam] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]); 
  const [activeModal, setActiveModal] = useState(null); 
  const [showPostForm, setShowPostForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [postDetails, setPostDetails] = useState({
    title: "",
    description: "",
    meetingDate: "",
    meetingTime: "",
  });  
  const [stats, setStats] = useState({totalProjects: 0,ongoingProjects: 0,completedProjects: 0,pendingApproval: 0});



  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser) {
      setLoggedUser(storedUser);
      fetchPendingRequests(storedUser._id);  // Fetch pending requests immediately on login
    } else {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (loggedUser) {
      if (view === "myProjects") {
        fetch(`http://localhost:5000/api/projects/assigned-to/${loggedUser.username}`)
          .then((res) => res.json())
          .then((data) => setProjects(data))
          .catch((err) => console.error("Error fetching my projects", err));
      } else if (view === "allProjects") {
        fetch("http://localhost:5000/api/projects")
          .then((res) => res.json())
          .then((data) => {
            console.log(data)
            setProjects(data)
          })
          .catch((err) => console.error("Error fetching all projects", err));
      } else {
        setProjects([]);
      }
    }
  }, [view, loggedUser]);    

  useEffect(() => {
        if (view === "status") {
          fetchProjectStats();
        }
      }, [view]);

   useEffect(() => {
        if (view === "communication") {
          fetchMessages();
        }
      }, [view, loggedUser]);

  const user = loggedUser
  ? {
      userid: loggedUser._id,
      name: loggedUser.username,
      role: loggedUser.role,
    }
  : null;



//report and analysis
const fetchProjectStats = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/project/stats");
    const data = await res.json();
    setStats(data);
  } catch (error) {
    console.error("Failed to fetch stats:", error);
  }
};

  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "";
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const toggleMenu = (projectId) => {
    setMenuOpen(menuOpen === projectId ? null : projectId);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Project deleted successfully!");
        setProjects((prevProjects) => prevProjects.filter((proj) => proj._id !== projectId));
      } else {
        console.error("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };


  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setSelectedStatus(project.status);
    setShowModal(true);
  };

  const closeProjectDetails = () => {
    setSelectedProject(null);
    setShowModal(false);
  }; 
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
  }; 

  const handleStatusUpdate = async () => {
    if (!selectedProject) return;
  
    try {
      const response = await fetch(`http://localhost:5000/api/projects/${selectedProject._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });
  
      if (response.ok) {
        alert("Project status updated successfully!");
        setShowModal(false);
        setProjects((prevProjects) =>
          prevProjects.map((proj) =>
            proj._id === selectedProject._id ? { ...proj, status: selectedStatus } : proj
          )
        );
      } else {
        console.error("Failed to update project status");
      }
    } catch (error) {
      console.error("Error updating project status:", error);
    }
  };

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "Unknown";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

   // **Auto-update "time ago" every minute**
   useEffect(() => {
    const interval = setInterval(() => {
      setProjects((prevProjects) =>
        prevProjects.map((project) => ({
          ...project,
          updatedTimeAgo: formatTimeAgo(project.createdAt), // Update only UI, not DB
        }))
      );
    }, 60000); // Every 60 seconds

    return () => clearInterval(interval); // Cleanup on unmount
  }, []); 

  const onCreateProject=()=> {
    navigate("/create-project")
    setTimeout(() => {
      fetchProjects(); // Ensure projects are updated immediately after navigation
    }, 500);
  }

  const fetchProjects = () => {
    if (loggedUser) {
      if (view === "myProjects") {
        fetch(`http://localhost:5000/api/projects/assigned-to/${loggedUser.username}`)
          .then((res) => res.json())
          .then((data) => setProjects(data))
          .catch((err) => console.error("Error fetching my projects", err));
      } else if (view === "allProjects") {
        fetch("http://localhost:5000/api/projects")
          .then((res) => res.json())
          .then((data) => {
            console.log(data)
            setProjects(data)
          })
          .catch((err) => console.error("Error fetching all projects", err));
      } else {
        setProjects([]);
      }
    }
  }; 

  // fetch the pending requests
  const fetchPendingRequests = async () => {
    const faculty = JSON.parse(localStorage.getItem("user"));
    const facultyId = faculty?._id;

    if (!facultyId) {
      console.error("Faculty ID is missing.");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/faculty/pending-requests/${facultyId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch requests.");
      } 

      const data = await response.json();
      console.log("Pending requests received:", data);

      setPendingRequests(data);

    } catch (error) {
      console.error("Error fetching pending requests:", error);
    } finally {
      setLoading(false);
    }
  }; 

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const respondToRequest = async (requestId, action) => {
    try {
      const response = await fetch("http://localhost:5000/api/faculty/respond-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
  
      const data = await response.json();
      alert(data.message);
  
      fetchPendingRequests(); // Refresh pending requests
      //fetchTeams(); // Refresh teams in Team Lead Dashboard
    } catch (error) {
      console.error("Error responding to request:", error);
    }
  }; 

   //Approve team
   const approveTeam = async (teamId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/faculty/approve-team/${teamId}`, {
            method: "POST", 
            headers: {
              'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error("Failed to approve team.");
        }

        setPendingRequests((prev) =>
          prev.map((request) =>
              request._id === teamId ? { ...request, status: "Approved" } : request
          )
        );
        setShowModal(false);
        alert("Team approved and created successfully!");
    } catch (error) {
        console.error("Error approving team:", error.message);
    }
};

//Reject team
const rejectTeam = async (requestId) => {
    try {
        const response = await fetch(`http://localhost:5000/api/faculty/reject-team/${requestId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
            throw new Error("Failed to reject team.");
        }

        setPendingRequests((prev) =>
          prev.map((request) =>
              request._id === requestId ? { ...request, status: "Rejected" } : request
          )
      );
        setShowModal(false);
        alert("Team request rejected!");
    } catch (error) {
        console.error("Error rejecting team:", error.message);
    }
}; 



const facultyId = loggedUser?._id;

  useEffect(() => {
    const fetchTeams = async () => {
      if (!facultyId) {
          console.warn("⚠️ Faculty ID is missing or null");
          return;
      }
  
      try {
          const response = await fetch(`http://localhost:5000/api/teams/faculty/${facultyId}`);
  
          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }
  
          const data = await response.json();
          console.log("✅ Teams received:", data);
          setTeams(data);
      } catch (error) {
          console.error("❌ API Error:", error);
      }
  };
  

    if (facultyId) {
        fetchTeams();
    }
}, [facultyId]); 

 // Fetch team members when a team is selected
 const handleTeamClick = async (teamId) => {
  console.log("Clicked teamId:", teamId);
  setSelectedTeamId(teamId);
  setShowAddMemberModal(false);
  setShowTeamMembers(true);
  handleOpenModal("teamMembers")

  if (!teamId) {
    console.error("Error: teamId is undefined");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/teams/${encodeURIComponent(teamId)}`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch team members, status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Fetched team data:", data);
    // Use teamMembers if present; if not, default to an empty array.
    setTeamMembers(Array.isArray(data.teamMembers) ? data.teamMembers : []);
  } catch (error) {
    console.error("Error fetching team members:", error);
    setTeamMembers([]);
  }
}; 

// Open modal and filter users not in the team
const handleAddMemberClick = async (teamId) => {
  try {
    handleOpenModal("addMembers")
    // Fetch team data
    const response = await fetch(
      `http://localhost:5000/api/teams/${encodeURIComponent(teamId)}`
    );
    const teamData = await response.json();
    console.log("Fetched team data:", teamData);
    if (!teamData || !Array.isArray(teamData.teamMembers)) {
      console.error("Invalid team data received", teamData);
      return;
    }
    // Fetch all students
    const studentsResponse = await fetch("http://localhost:5000/api/users/students");
    const students = await studentsResponse.json();
    console.log("Fetched students:", students);
    if (!Array.isArray(students)) {
      console.error("Invalid students data received", students);
      return;
    }
    // Filter out students already in the team
    const availableStudents = students.filter((student) =>
      !teamData.teamMembers.some((member) => member._id === student._id)
    );
    setMembersNotInTeam(Array.isArray(availableStudents) ? availableStudents : []);
    setSelectedTeamId(teamId);
    setShowAddMemberModal(true);
    setSelectedMembers([]);
  } catch (error) {
    console.error("Error fetching team details:", error);
  }
}; 

const toggleTeamMenu=(teamId) => {
  setTeamDashboardMenu(teamDashboardMenu === teamId ? null : teamId);
} 

// Function to open a modal (closes all other modals)
const handleOpenModal = (modalName) => {
  setActiveModal(modalName);
};

// Function to close all modals
const closeAllModals = (e) => {
  setActiveModal(null);
}; 

const stopPropagation = (e) => {
  e.stopPropagation();
}; 

// Handle selecting/deselecting members to add
const handleMemberSelect = (memberId) => {
  setSelectedMembers((prevSelected) =>
      prevSelected.includes(memberId)
          ? prevSelected.filter((id) => id !== memberId)
          : [...prevSelected, memberId]
  );
};

// Handle adding members to team
const handleAddMembersToTeam = async () => {
  if (!selectedTeamId || !Array.isArray(selectedMembers) || selectedMembers.length === 0) return;

  try {
    console.log("Selected members:", selectedMembers);
    const response = await fetch(
      `http://localhost:5000/api/teams/${encodeURIComponent(selectedTeamId)}/add-members`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ memberIds: selectedMembers })
      }
    );
    if (!response.ok) {
      throw new Error(`Failed to add members, status: ${response.status}`);
    }
    const updatedTeam = await response.json();
    console.log("Updated team:", updatedTeam);
    // Check if the updated team has a members property that is an array.
    setTeamMembers(Array.isArray(updatedTeam.members) ? updatedTeam.members : []);
    setShowAddMemberModal(false);
    setSelectedMembers([]);
    // Optionally refresh team members (if updatedTeam.members is not complete)
    handleTeamClick(selectedTeamId);
  } catch (error) {
    console.error("Error adding members to team:", error);
  }
}; 

const handlePostChange = (e) => {
  setPostDetails({ ...postDetails, [e.target.name]: e.target.value });
}; 

//handing add a post 
const handlePostSubmit = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/posts/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...postDetails,
        facultyId,
      }),
    });

    const data = await response.json();
    if (data.success) {
      alert("Post added successfully and emails sent!");
      setShowPostForm(false);
      setPostDetails({ title: "", description: "", meetingDate: "", meetingTime: "" });
    } else {
      alert("Failed to add post");
    }
  } catch (error) {
    console.error("Error creating post:", error);
    alert("Error adding post");
  }
}; 

//Sending email from tead lead to the team members
const sendEmailToMember = (recipientEmail) => {
  // Retrieve Team Lead details from localStorage
  const userData = JSON.parse(localStorage.getItem("user"));
  console.log(userData)
  if (!userData) {
      alert("Error: Team Lead details not found.");
      return;
  }

  const { username, email } = userData; // Extract name and email

  if (!email || !username) {
      alert("Error: Team Lead name or email is missing.");
      return;
  }

  // Open Gmail with prefilled recipient, subject, and body including Team Lead's name & email
  window.open(
    `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=Team%20Update&body=Hello,%20this%20is%20a%20message%20from%20your%20team%20lead,%20${username}.%20Please%20connect%20with%20me%20using%20this%20emailId%20${email}%20right%20now.`,
    "_blank"
  );
};  

const fetchMessages = async () => {
  try {
    const res = await fetch("http://localhost:5000/api/messages/get");
    const data = await res.json();
    setMessages(data);

  } catch (error) {
    console.error("Error fetching messages", error);
  }
};

const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const res = await fetch("http://localhost:5000/api/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        senderId: user.userid,
        senderName: user.name,
        senderRole: user.role,
        message: newMessage
      })
    });
    const data = await res.json();
    setMessages([...messages, data]);
    setNewMessage("");
    
  } catch (error) {
    console.error("Error sending message", error);
  }
}; 



  

  return (
    <div className="faculty-dashboard">
      {/* Navbar */}
      <div className="navbar">
        <div className="navbar-left">
          <img
            src="https://res.cloudinary.com/dd7kbp3ke/image/upload/v1744269984/ChatGPT_Image_Apr_10__2025__12_41_08_PM-removebg-preview_ylmgbg.png"
            alt="Project Management System"
            className="project-management-logo"
          />
          <h1 className="navbar-heading">Faculty Dashboard</h1>
        </div>

        <div className="navbar-right">
          <button type="button" className="create-project-btn" onClick={onCreateProject}>Create Project</button>
          <div className="profile-container">
            <div className="profile-icon" onClick={() => setShowProfile(!showProfile)}>
              <FontAwesomeIcon icon={faUser} />
            </div>

            {showProfile && loggedUser && (
              <div className="profile-dropdown mr-3">
                <button className="close-profile" onClick={() => setShowProfile(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <div className="profile-avatar">{getInitial(loggedUser.username)}</div>
                <h3 className="profile-name">{loggedUser.username}</h3>
                <p className="profile-email">{loggedUser.email}</p>
                <p className="profile-role">Role: {loggedUser.role}</p>
                <button className="logout-button" onClick={handleLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content-main-container">

        {/* Sidebar */}
        <div className="sidebar">
          <ul className="sidebar-menu">
            <li className="sidebar-item" onClick={() => setView("allProjects")}>
              <FontAwesomeIcon icon={faProjectDiagram} className="sidebar-icon" />
              <span>Projects</span>
            </li>
            <li className="sidebar-item" onClick={() => setView("teams")}>
              <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
              <span>Teams</span>
            </li>
            <li className="sidebar-item" onClick={() => setView("teamRequest")} >
              <FontAwesomeIcon icon={faBell} className="sidebar-icon" />
              <span>Team Request</span>
            </li>
            <li className="sidebar-item" onClick={() => setView("status")}>
              <FontAwesomeIcon icon={faChartBar} className="sidebar-icon" />
              <span>Status</span>
            </li>
            <li className="sidebar-item" onClick={() => setView("addPost")}>
              <FontAwesomeIcon icon={faComments} className="sidebar-icon" />
              <span>Add a Post</span>
            </li>
            <li className="sidebar-item" onClick={() => setView("communication")}>
              <FontAwesomeIcon icon={faComments} className="sidebar-icon" />
              <span>communication</span>
            </li>
          </ul>
        </div>  

        {/* Main Content */}
        <div className="main-content">
          {/* Stats View */}
          {view === "status" ? (
            <div className="project-stats">
                                  <div className="stat-card">
                                    <FontAwesomeIcon icon={faTasks} className="stat-icon" />
                                    <h3>Total Projects</h3>
                                    <p>{stats.totalProjects}</p>
                                  </div>
                                  <div className="stat-card">
                                    <FontAwesomeIcon icon={faClipboardCheck} className="stat-icon" />
                                    <h3>Ongoing Projects</h3>
                                    <p>{stats.ongoingProjects}</p>
                                  </div>
                                  <div className="stat-card">
                                    <FontAwesomeIcon icon={faChartBar} className="stat-icon" />
                                    <h3>Completed Projects</h3>
                                    <p>{stats.completedProjects}</p>
                                  </div>
                                  <div className="stat-card">
                                    <FontAwesomeIcon icon={faClock} className="stat-icon" />
                                    <h3>Pending Approval</h3>
                                    <p>{stats.pendingApproval}</p>
                                  </div>
            </div>
          ) : view === "allProjects" ? (
            <div className="project-list">
              <h2 className="sidebar-details-heading">{view === "myProjects" ? "My Projects" : "All Projects"}</h2>
              <ul>
                {projects.length === 0 ? (
                  <p>No projects found.</p>
                ) : (
                  projects.map((project) => (
                    <li key={project._id} className="project-item">
                      <div className="project-container">
                        <h2 onClick={() => openProjectDetails(project)} className="project-name-project-container">
                          {project.projectName}
                        </h2> 
                        <p>Created: {formatTimeAgo(project.createdAt)}</p>
                        <div className="menu-icon-container" onClick={() => toggleMenu(project._id)}>
                          <FontAwesomeIcon icon={faEllipsisV} className="menu-icon" />
                        </div>
                      </div> 
                      {menuOpen === project._id && (
                        <div className="dropdown-modal">
                          <button className="modal-button" onClick={() => handleDelete(project._id)}>
                            <FontAwesomeIcon icon={faTrash} /> Delete
                          </button>
                        </div>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : view === "teamRequest" ? (
            <div className="pending-requests-container">
              <h2 className="pending-requests-conainer-heading">Pending Team Requests</h2>
              {loading ? (
                <p>Loading...</p>
              ) : pendingRequests.length === 0 ? (
                <p>No pending requests.</p>
              ) : (
                <ul>
                  {pendingRequests.map((request) => (
                    <li key={request._id} className="request-card">
                      <p className="request-card-heading"><strong>Team Name:</strong> {request.teamName}</p>
                      <button type="button" onClick={() => { setSelectedRequest(request); setShowModal(true); }} className="request-card-button" >
                        View Request
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {showModal && selectedRequest && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <h3><strong>Requesting Team Name: </strong>{selectedRequest.teamName}</h3>
                    <p><strong>Team Lead:</strong> {selectedRequest.teamLead.username}</p>
                    <p><strong>Members:</strong></p>
                    <ul>
                      {selectedRequest.teamMembers.map((member) => (
                        <li key={member._id}>{member.username}- {member.email}</li>
                      ))}
                    </ul>
                    <div className="pending-request-button-container">
                      <button type="button" className="approve-btn" onClick={() => approveTeam(selectedRequest._id)}>Approve</button>
                      <button type="button" className="reject-btn" onClick={() => rejectTeam(selectedRequest._id)}>Reject</button>
                    </div>
                    <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                  </div>
                </div>
              )}
            </div>
          ) : view === "teams" ? (
            <div className="team-list">
              <h2 className="team-list-heading">All Teams</h2>
              {loading ? (
                <p>Loading...</p>
              ) : teams.length === 0 ? (
                <p>No teams found.</p>
              ) : ( 
                  <ul>
                    {teams.map((team) => (
                      <li key={team._id}>
                        <div className="team-container">
                          <h3 className="project-name-project-container"  onClick={() => handleTeamClick(team._id)}>{team.teamName}</h3>
                          <div className='team-menu-container'>
                            <button className="add-members-btn" onClick={() => handleAddMemberClick(team._id)}>Add Members</button> 
                            <div className="menu-icon-container" onClick={() => toggleTeamMenu(team._id)}>
                              <FontAwesomeIcon icon={faEllipsisV} className="menu-icon"/>
                            </div>
                          </div>
                        </div> 
                      </li> 
                    ))}
                  </ul>
                )}
            </div>
          ) : view === "addPost" ? (
            <div className="addpost-container">
              <h2 className="post-modal-heading">Add a Post</h2>
              <div className="post-modal-form">
                <div className="post-modal-fields">
                  <label className="post-form-labels">Title:</label>
                  <input
                    className="post-form-input"
                    type="text"
                    name="title"
                    placeholder="Enter title"
                    value={postDetails.title}
                    onChange={handlePostChange}
                    required
                  />
                </div>

                <div className="post-modal-fields">
                  <label className="post-form-labels">Description:</label>
                  <textarea
                    className="post-form-textarea"
                    name="description"
                    placeholder="Enter description"
                    value={postDetails.description}
                    onChange={handlePostChange}
                    required
                  ></textarea>
                </div>

                <div className="post-modal-fields">
                  <label className="post-form-labels">Meeting Date:</label>
                  <input
                    className="post-form-input"
                    type="date"
                    name="meetingDate"
                    value={postDetails.meetingDate}
                    onChange={handlePostChange}
                    required
                  />
                </div>

                <div className="post-modal-fields">
                  <label className="post-form-labels">Meeting Time:</label>
                  <input
                    className="post-form-input"
                    type="time"
                    name="meetingTime"
                    value={postDetails.meetingTime}
                    onChange={handlePostChange}
                    required
                  />
                </div>

                <div className="post-button-container">
                  <button onClick={handlePostSubmit} className="post-btn">
                    Post
                  </button>
                </div>
              </div>
            </div>         
            ): view==="communication" ? (
              <div className="chat-container">
                <div className="chat-messages">
                  {(() => {
                    const groupedMessages = {};
                    messages.forEach((msg) => {
                    const date = new Date(msg.timestamp).toDateString();
                    if (!groupedMessages[date]) groupedMessages[date] = [];
                    groupedMessages[date].push(msg);
                  });

                   const sortedDates = Object.keys(groupedMessages).sort(
                     (a, b) => new Date(a) - new Date(b)
                    );

                const formatDateHeader = (dateStr) => {
                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();

                if (dateStr === today) return "Today";
                if (dateStr === yesterday) return "Yesterday";
                return new Date(dateStr).toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
              };

              return sortedDates.map((date, dateIndex) => (
                <div key={dateIndex}>
                  <div className="date-header">{formatDateHeader(date)}</div>
                  {groupedMessages[date].map((msg, index) => {
                    const isCurrentUser = user && msg.senderId === user.userid;
                    return (
                      <div key={index} className={`message-row ${isCurrentUser ? "own-message" : "other-message"}`}>
                        <div className="message-bubble">
                          <div className="sender-info">
                            <div className="sender-initial">{msg.senderName[0]}</div>
                            <div className="sender-name-role">{msg.senderName} ({msg.senderRole})</div>
                          </div>
                          <div className="message-text">{msg.message}</div>
                          <div className="timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
            })()}
                </div>

                <div className="chat-input">
                  <input type="text" placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
                  <button onClick={sendMessage}>Send</button>
                </div>
              </div>):(null)}
        </div>

      </div>
      

      
      {showModal && selectedProject && (  
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-modal" onClick={closeProjectDetails}>
                <FontAwesomeIcon icon={faTimes} />
            </button>
            <p className="project-detail-modal-title">Project Title: <span className="project-details-modal-title-span-element"> {selectedProject.projectName}</span></p>
            <p className="project-detail-modal-title">Description: <span className="project-details-modal-title-span-element"> {selectedProject.description}</span></p>
            <p className="project-detail-modal-title">Created By: <span className="project-details-modal-title-span-element">{selectedProject.assignedBy}</span></p>
            <p className="project-detail-modal-title">Assigned To: <span className="project-details-modal-title-span-element">{selectedProject.assignedTo}</span></p>
            <p className="project-detail-modal-title">Milestones: <span className="project-details-modal-title-span-element">{selectedProject.milestone}</span></p>
            <p className="project-detail-modal-title">Status:</p>
            <div className="status-options">
              {["Ongoing", "Completed", "Pending Approval"].map((status) => (
                <button
                  key={status}
                  className={selectedStatus === status ? "selected-status" : ""}
                  onClick={() => handleStatusChange(status)}
                >
                  {status}
                </button>
              ))}
            </div>
            <div>
              <button className="edit-btn-modal"  title="Click to edit status of the project" onClick={handleStatusUpdate}>Update</button>
            </div>
          </div>
        </div>
      )};  

      {activeModal &&  
        <div className="modal-overlay" onClick={closeAllModals}>
          <div className="modal-content" onClick={stopPropagation}>
            <button className="close-modal" onClick={closeAllModals}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            {activeModal === "addMembers" && (
              <>
                <h3 className='add-members-modal-heading'>Add Members to Team</h3>
                <ul>
                  {membersNotInTeam.length === 0 ? (
                                    <p>No users available to add.</p>
                    ) : (
                      membersNotInTeam.map((member) => (
                        <li key={member._id}>
                          <label>
                            <input type="checkbox" onChange={() => handleMemberSelect(member._id)} className='m-2' />
                            {member.username}
                          </label>
                        </li>
                      ))
                   )}
                </ul>
                <button onClick={handleAddMembersToTeam} className='add-selected-members-btn'>Add Selected Members</button>
                <button onClick={closeAllModals} className='cancel-btn'>Cancel</button>
              </>
            )}  

            {activeModal === "teamMembers" && (
              <>
                <h3 className="team-members-modal-heading">Team Members</h3>
                {teamMembers.length > 0 ? (
                  <ul>
                    {teamMembers.map((member) => (
                      <li key={member._id} className='m-2'>
                        {member.username} - {member.email}
                        <button className="email-button m-1" onClick={() => sendEmailToMember(member.email)}>
                          <FontAwesomeIcon icon={faEnvelope} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No members in this team.</p>
                )}
              </>
            )}
          </div> 
        </div>
      }

    </div>
  );
};

export default FacultyDashboard;
