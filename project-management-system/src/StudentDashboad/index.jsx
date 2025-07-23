import React, { useState, useEffect,} from "react"; 
import { useNavigate } from "react-router-dom";
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
  faListCheck
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"; 
import './index.css'


const StudentDashboard=() => {
    const [showProfile, setShowProfile] = useState(false);
    const [loggedUser, setLoggedUser] = useState(null);
    const [view, setView] = useState("project");
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [activeModal, setActiveModal] = useState(null);
    const [menuOpen, setMenuOpen] = useState(null);
    const [teamId,setTeamId]=useState("") 
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState(""); 
    const [workUpdate, setWorkUpdate] = useState("");
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");


    const navigate = useNavigate();
    
    //storing the user in the localstorage
    useEffect(() => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) {
        navigate("/login");
      } else {
        setLoggedUser(storedUser);
      }
    }, [navigate]); 

    
    useEffect(() => {
      if (loggedUser) {
        fetchProjects(loggedUser._id);
        fetchTasks(loggedUser._id);
      }
    }, [loggedUser]); // Runs only when loggedUser is set 

    //calling the fetch teamMembers
    useEffect(() => {
      if (view === "teamMembers" && loggedUser) {
        fetchTeamAndMembers(loggedUser._id);
      }
    }, [view, loggedUser]); 

    useEffect(() => {
      if (view === "communication" && loggedUser) {
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
     

    //for getting initial letter of the user for profile
    const getInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : "";
      };
    
    //handling the logout button
      const handleLogout = () => {
        localStorage.removeItem("user");
        navigate("/login");
      }; 

      //fetching the projects assigned to students
      const fetchProjects = async (userId) => {
        try {
          const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/student/assigned-projects/${userId}`);
          const data = await response.json();

          console.log("fetch the project of the student",data)
          setProjects(data);
        } catch (err) {
          console.error("Error fetching projects:", err);
        }
      };  

      

      //fetching the tasks assigned to the students
      const fetchTasks = async (userId) => {
        try {
          const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/tasks/student/${userId}`);
          const data = await response.json();
          console.log("Tasks of the students: ",data)
          setTasks(data);
        } catch (err) {
          console.error("Error fetching tasks:", err);
        }
      }; 

      const openProjectDetails = (project) => {
        setSelectedProject(project);
        setSelectedStatus(project.status);
        setShowModal(true);
        setActiveModal("projectDetails")
        handleOpenModal("projectDetails")
  }; 

  // Function to open a modal (closes all other modals)
  const handleOpenModal = (modalName) => {
    setActiveModal(modalName);
  }; 

  // Function to close all modals
  const closeAllModals = (e) => {
    setActiveModal(null);
  };  

const toggleMenu = (projectId) => {
  setMenuOpen(menuOpen === projectId ? null : projectId);
}; 

const stopPropagation = (e) => {
  e.stopPropagation();
}; 

const handleStatusChange = (status) => {
  setSelectedStatus(status);
}; 

const handleStatusUpdate = async () => {
  if (!selectedProject) return;

  try {
    const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/projects/${selectedProject._id}`, {
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

//fetching the team members by team id
const fetchTeamAndMembers = async (studentId) => {
  try {
    const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/student/team/${studentId}`);
    const data = await response.json();

    if (response.ok) {
      console.log("Team data:", data);
      setTeamId(data.teamName); // Set team name 
      const filteredTeamMembers=data.teamMembers.filter(member => member._id!==studentId)
      setTeamMembers(filteredTeamMembers); // Set members list
    } else {
      console.warn("No team found for this student.");
      setTeamMembers([]);
    }
  } catch (error) {
    console.error("Error fetching team info:", error);
  }
}; 

const sendEmailToMember = (recipientEmail) => {
  // Retrieve student details from localStorage
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
    `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmail}&su=Team%20Update&body=Hello,%20this%20is%20${username}.`,
    "_blank"
  );
};  



const fetchMessages = async () => {
  try {
    const res = await fetch("https://project-management-system-m1ro.onrender.com/api/messages/get");
    const data = await res.json();
    setMessages(data);

  } catch (error) {
    console.error("Error fetching messages", error);
  }
};

const sendMessage = async () => {
  if (!newMessage.trim()) return;

  try {
    const res = await fetch("https://project-management-system-m1ro.onrender.com/api/messages/send", {
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

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!workUpdate.trim()) {
    alert("Please enter your work update before submitting.");
    return;
  }

  try {
    setLoading(true);

    const response = await fetch('https://project-management-system-m1ro.onrender.com/api/workupdates/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: loggedUser._id,
        studentName: loggedUser.username,
        workUpdate: workUpdate,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit work update');
    }

    const data = await response.json();

    setSuccessMessage("Work update submitted successfully!");
    setWorkUpdate("");
  } catch (error) {
    console.error("Error submitting work update:", error.response ? error.response.data : error);
    alert(error.response?.data?.error || "Something went wrong! Check backend logs.");
  }finally {
    setLoading(false);
  }
};





    return (
        <div className="student-dashboard"> 
           {/* Navbar */}
            <div className="navbar">
               <div className="navbar-left">
                  <img src="https://res.cloudinary.com/dd7kbp3ke/image/upload/v1744269984/ChatGPT_Image_Apr_10__2025__12_41_08_PM-removebg-preview_ylmgbg.png"
                       alt="Project Management System"
                       className="project-management-logo"
                  />
                  <h1 className="navbar-heading">Student Dashboard</h1>
                </div>
           
                <div className="navbar-right">
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

            {/* Sidebar */}
            <div className="sidebar">
              <ul className="sidebar-menu">
                  <li className="sidebar-item" onClick={() => setView("project")} >
                    <FontAwesomeIcon icon={faProjectDiagram} className="sidebar-icon" />
                    <span>Project</span>
                  </li>
                  <li className="sidebar-item" onClick={() => setView("assignedTask")}>
                        <FontAwesomeIcon icon={faListCheck} className="sidebar-icon" />
                        <span>Assigned Tasks</span>
                  </li>
                  <li className="sidebar-item" onClick={() => setView("teamMembers")}>
                        <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
                        <span>Team Members</span>
                  </li>
                  <li className="sidebar-item" onClick={() => setView("workUpdate")}>
                        <FontAwesomeIcon icon={faChartBar} className="sidebar-icon" />
                        <span>Work Update</span>
                  </li>
                  <li className="sidebar-item" onClick={() => setView("communication")}>
                        <FontAwesomeIcon icon={faComments} className="sidebar-icon" />
                        <span>communication</span>
                  </li>
              </ul>
            </div> 

            {/* Main container */} 
          <div className="main-container">

            {view === "project" && (
                <div>
                  <h2 className="project-view-heading">Assigned Projects</h2>
                  <ul>
                      {projects.length === 0 ? (
                        <p>No projects found.</p>
                        ) : (
                          projects.map((project) => (
                            <li key={project._id} className="project-item">
                              <div className="project-container">
                                <h2 onClick={() => openProjectDetails(project)} className="project-name-project-container">{project.projectId.projectName}</h2>
                                <p>Created: {new Date(project.projectId.createdAt).toLocaleString()}</p>
                              </div>
                            </li>
                          ))
                        )}
                  </ul>
                </div>
            )} 

            {view === "assignedTask" && (
                <div>
                  <h2 className="task-view-container">Assigned Tasks</h2>
                  <ul className="task-container">{tasks.map(task => 
                    <li key={task._id} className="project-item">
                      <div className="project-container">
                        <h2 className="project-name-project-container">{task.taskName}</h2> 
                        <p className="task-para">Status:{task.status}</p> 
                        <div className="task-button-container"> 
                        <button className="update-task-container" onClick={() => navigate(`/project-details/${task.projectId._id}`, { state: { project: task.projectId } })}>Update</button>
                        </div> 
                      </div> 
                    </li>)}
                  </ul>
                </div>
            )}  

            {view === "teamMembers" && (
              <div>
                <h2 className="task-view-container mb-3">Team Members</h2>
                {teamMembers.length > 0 ? (
                  <div className="student-dashboard-team-members-container">
                    <h3 className="team-name-heading">Team Name: {teamId}</h3>
                    <ul className="team-members-list">
                      {teamMembers.map((member) => (
                        <li key={member._id} className="team-member-card"> 
                          <div>
                            <p><strong>Name:</strong> {member.username}</p>
                            <p><strong>Email:</strong> {member.email}</p>
                          </div>
                          <div>
                            <button className="connect-button m-1" onClick={() => sendEmailToMember(member.email)}>
                              Connect
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
               </div>
              ) : (
                  <p>No team members found or you are not part of any team.</p>
              )}
               </div>
            )}

            {view === "workUpdate" && (
                <div className="work-update-form-container">
                  <form onSubmit={handleSubmit} className="work-update-form">
                    <h2 className="form-title">Submit Your Work Update</h2> {/* Title inside form */}
                    <textarea
                      value={workUpdate}
                      onChange={(e) => setWorkUpdate(e.target.value)}
                      placeholder="Describe your work progress here..."
                      rows="6"
                      className="work-update-textarea"
                      required
                    ></textarea>
                    <button type="submit" className="send-button" disabled={loading}>
                      {loading ? "Sending..." : "Send Update"}
                    </button>
                    {successMessage && <p className="success-message">{successMessage}</p>}
                  </form>
                </div>
            )} 

            {view === "communication" && (
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
              </div>
            )}

          </div> 

          {/*All modals*/ }
          {activeModal && (
            <div className="modal-overlay" onClick={closeAllModals}>
              <div className="modal-content" onClick={stopPropagation}>
                <button className="close-modal" onClick={closeAllModals}><FontAwesomeIcon icon={faTimes} /></button>
          
                {activeModal === "projectDetails" && selectedProject && (
                  <>
                    <p className="project-detail-modal-title">Project Title: <span className="project-details-modal-title-span-element"> {selectedProject.projectId.projectName}</span></p>
                    <p className="project-detail-modal-title">Description: <span className="project-details-modal-title-span-element"> {selectedProject.projectId.description}</span></p>
                    <p className="project-detail-modal-title">Created By: <span className="project-details-modal-title-span-element">{selectedProject.projectId.assignedBy}</span></p>
                    <p className="project-detail-modal-title">Assigned To: <span className="project-details-modal-title-span-element">{selectedProject.projectId.assignedTo}</span></p>
                    <p className="project-detail-modal-title">Milestones: <span className="project-details-modal-title-span-element">{selectedProject.projectId.milestone}</span></p>
                    <p className="project-detail-modal-title">Status:</p>
                    <div className="status-options">
                      {["Ongoing", "Completed", "Pending Approval"].map((status) => (
                        <button key={status} className={selectedStatus === status ? "selected-status" : ""} onClick={() => handleStatusChange(status)}>
                          {status}
                        </button>
                      ))}
                    </div>
                    <div>
                      <button className="edit-btn-modal"  title="Click to edit status of the project" onClick={handleStatusUpdate}>Update</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

        </div>
    )

}





export default StudentDashboard

