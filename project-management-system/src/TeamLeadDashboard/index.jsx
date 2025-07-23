import React, { useState, useEffect, useRef } from 'react' 
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
    faPlus,
    faEnvelope,
  } from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow } from "date-fns";
import './index.css' 


const TeamLeadDashboard=() => {
      const [showProfile, setShowProfile] = useState(false);
      const [loggedUser, setLoggedUser] = useState(null);
      const [myProjects, setMyProjects] = useState([]);
      const [projects, setProjects] = useState([]);
      const [view, setView] = useState("myProjects");
      const [menuOpen, setMenuOpen] = useState(null);
      const [teamDashboardMenu , setTeamDashboardMenu]=useState(null);
      const [selectedProject, setSelectedProject] = useState(null);
      const [showModal, setShowModal] = useState(false);
      const [selectedStatus, setSelectedStatus] = useState("");
      const [showTeamModal, setShowTeamModal] = useState(false);
      const [teamName, setTeamName] = useState("");
      const [students, setStudents] = useState([]);
      const [selectedMembers, setSelectedMembers]=useState([]);
      const [teams, setTeams] = useState([]);
      const [selectedTeam, setSelectedTeam] = useState(null);
      const [teamMembers, setTeamMembers] = useState([]);
      const [showTeamMembers, setShowTeamMembers] = useState(false);
      const [createdTeams,setCreatedTeams]=useState([])
      const [showAddMemberModal, setShowAddMemberModal] = useState(false);
      const [allUsers, setAllUsers] = useState([]); // All users fetched
      const [membersNotInTeam, setMembersNotInTeam] = useState([]); // Users not in the selected team
      const [selectedTeamId, setSelectedTeamId] = useState(null);
      const [showAssignModal, setShowAssignModal] = useState(false);
      const [activeModal, setActiveModal] = useState(null);
      const [facultyId, setFacultyId] = useState("");
      const menuRef = useRef(null);
      const navigate = useNavigate();
      const [stats, setStats] = useState({totalProjects: 0,ongoingProjects: 0,completedProjects: 0,pendingApproval: 0}); 
      const [messages, setMessages] = useState([]);
      const [newMessage, setNewMessage] = useState("");


    useEffect(() => {
      fetchTeams();
    })

    useEffect(() => {
      setActiveModal(null);
    }, [view]);  

    useEffect(() => {
      if (view === "stats") {
        fetchProjectStats();
      }
    }, [view]);
    

    useEffect(() => {
      if (showTeamModal) {
          fetch("https://project-management-system-m1ro.onrender.com/api/users/students")
              .then((res) => res.json())
              .then((data) => setStudents(data))
              .catch((err) => console.error("Error fetching students:", err));
      }
    }, [showTeamModal]);
  
    //getting logged user
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
          setLoggedUser(storedUser);
        } else {
          navigate("/login");
        }
      }, [navigate]); 

    // fetching projects
    useEffect(() => {
      if (!loggedUser || !loggedUser.username) {
        console.error("User not found in localStorage");
        return;
      }
  
      console.log("Fetching projects for user:", loggedUser.username);
  
      const fetchProjects = async () => {
        try {
          let url =
            view === "myProjects"
              ? `https://project-management-system-m1ro.onrender.com/api/projects/assigned-to/${loggedUser.username}`
              : "https://project-management-system-m1ro.onrender.com/api/projects";
  
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Error fetching projects: ${response.status}`);
          }
  
          const data = await response.json();
          console.log(`${view} Data:`, data);
  
          if (view === "myProjects") {
            setMyProjects(data);
          } else {
            setProjects(data);
          }
        } catch (err) {
          console.error(`Error fetching ${view}:`, err);
        }
      };
  
      fetchProjects();
    }, [view, loggedUser]); 

    //fetching the messages
    useEffect(() => {
          if (view === "communication" && loggedUser) {
            fetchMessages();
          }
    }, [view, loggedUser]); 

    const user = loggedUser? {
        userid: loggedUser._id,
        name: loggedUser.username,
        role: loggedUser.role,
      }
    : null;
    


    useEffect(() => {
      console.log("Current view:", view);
    }, [view]); 

    useEffect(() => {
      console.log("Modal Open:", showTeamModal);
    }, [showTeamModal]);
  
    //fetching students
    useEffect(() => {
      const fetchStudents = async () => {
        try {
          const response = await fetch("https://project-management-system-m1ro.onrender.com/api/users/students"); // Check if this API endpoint is correct!
          const data = await response.json();
          console.log("Fectching students:", data); // Debugging step
          setStudents(data); // Store students in state
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      };
    
      fetchStudents();
    }, []);
    

    // Fetch all teams from the backend
    useEffect(() => {
      const fetchTeams = async () => {
        try {
          if (!loggedUser || !loggedUser._id) return; // Ensure loggedUser exists before accessing _id
    
          const teamLeadId = loggedUser._id; // Define teamLeadId after the check
    
          const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/teams?teamLeadId=${teamLeadId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch teams");
          }
    
          const data = await response.json();
          setTeams(data);
        } catch (error) {
          console.error("Error fetching teams:", error);
        }
      };
    
      fetchTeams();
    }, [loggedUser]); // Depend on loggedUser, so it updates when user data is available
    

    useEffect(() => {
        fetchTeams();
        fetchUsers();
    }, []);

   // Step 2: Detect clicks outside the menu
   useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setTeamDashboardMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  const fetchUsers = async () => {
      try {
          const response = await fetch("https://project-management-system-m1ro.onrender.com/api/users");
          const data = await response.json();
          setAllUsers(data); // Set users who are not yet added to any team
      } catch (error) {
          console.error("Error fetching users:", error);
      }
  };
    


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
          `https://project-management-system-m1ro.onrender.com/api/teams/${encodeURIComponent(teamId)}`
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
  
  
  // Fetch faculty ID for team lead
  const fetchFacultyId = async () => {
    const teamLeadId=loggedUser._id;
    try {
      const response = await fetch.get(`https://project-management-system-m1ro.onrender.com/api/faculty/${teamLeadId}`);
      setFacultyId(response.data.faculty);
    } catch (error) {
      console.error("Error fetching faculty ID:", error);
    }
  };

    
  const handleCreateTeam = async () => {
    console.log("Create Team Button Clicked");

    const user = JSON.parse(localStorage.getItem("user")); 
    const teamLeadId = user?._id;

    if (!teamName.trim() || selectedMembers.length === 0) {
        alert("Please enter a team name and select at least one member.");
        return;
    }

    if (!teamLeadId) {
        alert("Team lead information is missing. Please log in again.");
        return;
    }

    try {
        // Fetch user IDs from usernames
        const studentResponse = await fetch("https://project-management-system-m1ro.onrender.com/api/get-user-ids", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usernames: selectedMembers })
        });

        if (!studentResponse.ok) {
            throw new Error("Failed to fetch user IDs.");
        }

        const studentData = await studentResponse.json();
        const userIds = studentData.userIds; 

        console.log("Received user IDs:", userIds);

        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error("Invalid user IDs received.");
        }

        console.log("Sending request with teamMemberIds:", userIds);

        // Create team request
        const createTeamResponse = await fetch("https://project-management-system-m1ro.onrender.com/api/create-team", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                teamName, 
                teamMembers: userIds, 
                teamLeadId ,
                facultyId,
            })
        });

        const createTeamData = await createTeamResponse.json();

        if (!createTeamResponse.ok) {
            throw new Error(createTeamData.message || "Failed to create team.");
        }

        // ✅ Close modal BEFORE showing alert
        

        // ✅ Alert for success
        alert("Team created successfully!");
        setActiveModal(null);

        // ✅ Fetch updated teams immediately
        await fetchTeams(teamLeadId);

        // ✅ Reset form fields
        setTeamName("");
        setSelectedMembers([]);

    } catch (error) {
        console.error("Error creating team:", error);
        alert(`Error: ${error.message}`);
    }
};

 // New function to fetch teams correctly
 const fetchTeams = async () => {
  const user = JSON.parse(localStorage.getItem("user"));  
  const teamLeadId = user?._id;  // Ensure teamLeadId is correctly retrieved

  if (!teamLeadId) {
      console.error("Error: teamLeadId is undefined.");
      return;
  }

  try {
      const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/teams?teamLeadId=${teamLeadId}`);

      if (!response.ok) {
          throw new Error("Failed to fetch updated teams.");
      }

      const updatedTeams = await response.json();
      setCreatedTeams(updatedTeams);
  } catch (error) {
      console.error("Error fetching teams:", error);
  }
};










  const handleCloseModal = () => {
      setShowTeamModal(false);
  };

  const onCreateProject=()=> {
        navigate("/create-project")
  }

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

  
  const toggleTeamMenu=(teamId) => {
    setTeamDashboardMenu(teamDashboardMenu === teamId ? null : teamId);
  }
    
  const handleDelete = async (projectId) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/projects/${projectId}`, {
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
        handleOpenModal("projectDetails")
  };
    
  const closeProjectDetails = () => {
    console.log("Closing modal");
    setSelectedProject(null);
    setShowTeamMembers(false);
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
    
  const formatTimeAgo = (timestamp) => {
        if (!timestamp) return "Unknown";
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Function to select a team member
  const handleSelectMember = (event) => {
      const selectedStudent = event.target.value;
      if (selectedStudent && !selectedMembers.includes(selectedStudent)) {
          setSelectedMembers([...selectedMembers, selectedStudent]);
      }
  };

  // Function to remove a selected team member
  const handleRemoveMember = (member) => {
      setSelectedMembers(selectedMembers.filter((m) => m !== member));
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

  // Open modal and filter users not in the team
  const handleAddMemberClick = async (teamId) => {
    try {
      handleOpenModal("addMembers")
      // Fetch team data
      const response = await fetch(
        `https://project-management-system-m1ro.onrender.com/api/teams/${encodeURIComponent(teamId)}`
      );
      const teamData = await response.json();
      console.log("Fetched team data:", teamData);
      if (!teamData || !Array.isArray(teamData.teamMembers)) {
        console.error("Invalid team data received", teamData);
        return;
      }
      // Fetch all students
      const studentsResponse = await fetch("https://project-management-system-m1ro.onrender.com/api/users/students");
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
  

  const handleDeleteTeam = async (teamId) => {
    const confirmDelete=window.confirm("Are you sure you want to delete this team?");
    if (!confirmDelete) return  
    try {
      const response=await fetch(`https://project-management-system-m1ro.onrender.com/api/teams/${teamId}`,{
        method:"DELETE"
      }) 

      if(response.ok){
        alert("Team is deleted Successfully!") 
        setTeams((prevTeam) => prevTeam.filter(team => team._id !== teamId))
      }
      else{
        alert("Failed to delete team")
      }

    } 
    catch(error){
      console.log("Error occur while deleting the team: ",error)
    }

  }  

   // Handle assign button click - Show project list
  const handleAssignProjectTeam = (teamId) => {
    setSelectedTeam(teamId);
    setShowAssignModal(true);
    fetchProjects();// Load projects when modal opens
    handleOpenModal("assignProject") 
  };


// Handle actual assignment
const assignProjectToTeam = async (projectId) => {
  const teamLead = JSON.parse(localStorage.getItem("user"));  // Get logged-in Team Lead
  if (!teamLead || !selectedTeam) {
      alert("Invalid team or user.");
      return;
  }

  try {
      const response = await fetch("https://project-management-system-m1ro.onrender.com/api/assignProject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              teamLeadId: teamLead._id,   // Ensure it's an ObjectId
              teamId: selectedTeam,       // Ensure it's selected
              projectId: projectId,       // Project ID
          }),
      });

      if (response.ok) {
          alert("Project assigned successfully!");
          setShowAssignModal(false);
          fetchTeams(); // Refresh team list
      } else {
          const errorData = await response.json();
          alert(`Failed to assign project: ${errorData.message}`);
      }
  } catch (error) {
      console.error("Error assigning project:", error);
      alert("An error occurred while assigning the project.");
  }
};



// Fetch projects assigned to the logged-in team lead
const fetchProjects = async () => {
  const teamLead = JSON.parse(localStorage.getItem("user"));

  if (!teamLead || !teamLead.username) {
      console.error("No team lead name found in localStorage.");
      return;
  }

  console.log("Fetching unassigned projects for teamLeadName:", teamLead.username);

  try {
      const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/projects/unassigned/${encodeURIComponent(teamLead.username)}`);

      console.log("Response Status:", response.status);

      if (!response.ok) {
          console.error("Failed to fetch unassigned projects. Status:", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
          setProjects([]);
          return;
      }

      const data = await response.json();
      console.log("Unassigned Projects fetched:", data);
      setProjects(Array.isArray(data) ? data : []);
  } catch (error) {
      console.error("Error fetching unassigned projects:", error);
  }
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
      `https://project-management-system-m1ro.onrender.com/api/teams/${encodeURIComponent(selectedTeamId)}/add-members`,
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

  

   // Fetch team details and filter members not in the team
   const fetchTeamDetails = async (teamId) => {
    try {
        const response = await fetch(`https://project-management-system-m1ro.onrender.com/api/teams/${teamId}`);
        const data = await response.json();
        setTeamMembers(data.members); // Store team members

        // Ensure all users are loaded before filtering
        if (allUsers.length > 0) {
            const notInTeam = allUsers.filter(user => !data.members.includes(user._id));
            setMembersNotInTeam(notInTeam);
        }
    } catch (error) {
        console.error("Error fetching team details:", error);
    }
   };

  const TaskProjectDetails = (project) => {
    
    navigate(`/project-details/${project._id}`, { state: { project } });
  };
  
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

  //report and analysis
  const fetchProjectStats = async () => {
    try {
      const res = await fetch("https://project-management-system-m1ro.onrender.com/api/project/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
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



    return (
        <div>
            {/*navbar*/}
            <div className="navbar">
                <div className="navbar-left">
                    <img
                        src="https://res.cloudinary.com/dd7kbp3ke/image/upload/v1744269984/ChatGPT_Image_Apr_10__2025__12_41_08_PM-removebg-preview_ylmgbg.png"
                        alt="Project Management System"
                        className="project-management-logo"
                      />
                    <h1 className="navbar-heading">Team Lead Dashboard</h1>
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
                    <li className="sidebar-item" onClick={() => setView("myProjects")}>
                       <FontAwesomeIcon icon={faProjectDiagram} className="sidebar-icon" />
                       <span>My Projects</span>
                    </li>
                    <li className="sidebar-item" onClick={() => setView("allProjects")}>
                       <FontAwesomeIcon icon={faProjectDiagram} className="sidebar-icon" />
                       <span>All Projects</span>
                    </li>
                    <li className="sidebar-item" onClick={() => setView("teamMembers")}>
                        <FontAwesomeIcon icon={faUsers} className="sidebar-icon" />
                        <span>Teams</span>
                    </li>
                    <li className="sidebar-item" onClick={() => setView("stats")}>
                        <FontAwesomeIcon icon={faChartBar} className="sidebar-icon" />
                        <span>Report/Analysis</span>
                    </li>
                    <li className="sidebar-item"  onClick={() => setView("communication")}>
                        <FontAwesomeIcon icon={faComments} className="sidebar-icon" />
                        <span>Communication</span>
                    </li>
                </ul>
            </div>
            
            {/* Main Content */}
            <div className="main-content">
                {view === "teamMembers" ? (
                  <div className="team-members-container">
                    <button type="button" className="create-team-btn" onClick={() => handleOpenModal("createTeam")}>
                      <FontAwesomeIcon icon={faPlus} /> Create Team
                    </button>
                    {/* Display Created Teams */}
                    {teams.length === 0 ? (
                      <p>No teams available.</p>  // Message when no teams are available
                       ) : (
                          <ul>
                              {teams.map((team) => (
                                <li key={team._id}>
                                  <div className="team-container">
                                    <h3 className="project-name-project-container"  onClick={() => handleTeamClick(team._id)}>{team.teamName}</h3>
                                    <div className='team-menu-container'>
                                      <button className="add-members-btn" onClick={() => handleAddMemberClick(team._id)}>Add Members</button> 
                                      <div className="menu-icon-container" onClick={() => toggleTeamMenu(team._id)}>
                                        <FontAwesomeIcon
                                        icon={faEllipsisV}
                                        className="menu-icon"
                                         />
                                      </div>
                                    </div>
                                  </div> 
                                  {teamDashboardMenu === team._id && (
                                    <div className="dropdown-modal" ref={menuRef}>
                                        <button className="modal-button" onClick={()=> handleAssignProjectTeam(team._id)}><FontAwesomeIcon icon={faEdit} /> Assign</button>
                                        <button className="modal-button" onClick={() => handleDeleteTeam(team._id)}><FontAwesomeIcon icon={faTrash} /> Delete</button>
                                    </div>
                                    )}  
                                </li> 
                              ))}
                          </ul>
                    )}
                  </div> ) : view === "stats" ? (
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
                    ) : view==="communication" ? (
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
                    ) : (
                      <div className="project-list">
                        {view === "myProjects" ? (
                          <div>
                            <h2 className="sidebar-details-heading">My Projects</h2>
                            <ul>
                              {myProjects.length === 0 ? (
                                <p>No projects found.</p>
                              ) : (
                                myProjects.map((project) => (
                                  <li key={project._id} className="project-item">
                                    <div className="project-container">
                                      <h2 onClick={() => openProjectDetails(project)} className="project-name-project-container">
                                        {project.projectName}
                                      </h2>
                                      <p  onClick={() => TaskProjectDetails(project)}>Created: {new Date(project.createdAt).toLocaleString()}</p>
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
                        ) : (
                          <div>
                            <h2 className="sidebar-details-heading">All Projects</h2>
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
                                      <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
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
                        )}
                      </div>
                )} 
            </div>

            {/*All modals*/ }
            {activeModal && (
              <div className="modal-overlay" onClick={closeAllModals}>
                <div className="modal-content" onClick={stopPropagation}>
                    <button className="close-modal" onClick={closeAllModals}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>

                    {activeModal === "projectDetails" && selectedProject && (
                      <>
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
                      </>
                    )}

                    {activeModal === "createTeam" && (
                      <>
                        <h2 className='create-team-heading'>Create Team</h2>

                        {/* Team Name Input */}
                        <div>
                          <label className='team-creation-form-label'>Team Name:</label>
                          <input type="text" value={teamName} onChange={(e) => setTeamName(e.target.value)} placeholder="Enter team name" className='team-creation-form-input'/>
                        </div>

                        {/* Team Members Dropdown */}
                        <div>
                          <label className='team-creation-form-label'>Team Members:</label>
                          <select onChange={handleSelectMember} defaultValue="" className='team-creation-form-input'>
                            <option value="" disabled>Select team members</option>
                            {students.map((student) => (
                              <option key={student._id} value={student.username}>
                                {student.username}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Display Selected Members */}
                        <div>
                         <label className='team-creation-form-label'>Selected Team Members:</label>
                         <div className="selected-members">
                        {selectedMembers.length === 0 ? (
                          <p className='m-3'>No members selected</p>
                          ) : (
                            selectedMembers.map((member) => (
                              <div key={member} className="selected-member">
                                {member}
                                <button onClick={() => handleRemoveMember(member)} className='m-2'>
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              </div>
                            ))
                          )}
                         </div>
                        </div>

                        {/* Create Team Button */}
                        <button className="create-team" onClick={() => handleCreateTeam(teamName, selectedMembers)}>
                            Create
                        </button>
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
                                  <button
                                    className="email-button m-1"
                                    onClick={() => sendEmailToMember(member.email)}
                                  >
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

                    {activeModal === "assignProject" && (
                      <>
                        <h2 className='project-assign-modal-heading'>Unassigned Projects</h2>
                        <ul>
                            {projects.length === 0 ? (
                                <p>No projects available for assignment.</p>
                            ) : (
                                projects.map((project, index) => (
                                    <li key={project._id} className="project-item-assign">
                                        <div className='projects-assignbtn-container'>
                                            <p>{index + 1}. {project.projectName}{" "}</p>
                                            <button className="assign-btn" onClick={() => assignProjectToTeam(project._id)}>
                                                Assign
                                            </button>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                        <button className="close-btn" onClick={closeAllModals}>
                            Close
                        </button>
                      </>
                    )}
                </div>
              </div>
            )}
        </div>
    )
}
export default TeamLeadDashboard
