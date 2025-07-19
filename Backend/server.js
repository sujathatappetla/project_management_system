const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { ObjectId } = require("mongoose").Types; // Import ObjectId for MongoDB queries
const dotenv = require("dotenv");

const app = express(); 

dotenv.config();

// Middleware
app.use(cors({ origin: "http://localhost:3000" }));
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema and Model
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ["Faculty", "Student", "Team Lead"] },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: function () { return this.role === "Team Lead"; } }
});


const User = mongoose.model("User", UserSchema);

//Project Schema and Model
const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  projectType: { type: String, required: true },
  assignedBy: { type: String, required: true },
  assignedTo: { type: String, required: true },
  milestone: { type: String, required: true },
  description: { type: String, required: true },
  status:{ type:String , required: true},
  createdAt : { type:Date , default:Date.now },
}, 
  { timestamps:true }
);

const Project = mongoose.model("Project", ProjectSchema);  

//Team Schema anda Model 

const TeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Reference User model 
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Faculty ID
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const Team = mongoose.model("Team", TeamSchema);  

//Assign project to the team details

const AssignedProjectSchema = new mongoose.Schema({
  teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  assignedDate: { type: Date, default: Date.now },
});

const AssignedProject = mongoose.model("AssignedProject", AssignedProjectSchema); 

//Task Ceation 
const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
  taskName: { type: String, required: true },
  description: { type: String, required: true },
  assignTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // 🔥 Fix here
  deadline: { type: Date, required: true },
  status: { type: String, enum: ["To Do", "In Progress", "Completed"], default: "To Do" }
});

const Task = mongoose.model("Task", TaskSchema); 

//Pending team request schema 

const PendingTeamRequestSchema = new mongoose.Schema({
  teamName: { type: String, required: true },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],
  teamLead: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
});

const PendingTeamRequest = mongoose.model("PendingTeamRequest", PendingTeamRequestSchema); 

//create post schema 

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  meetingDate: { type: String, required: true },
  meetingTime: { type: String, required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
});

const Post = mongoose.model("Post", PostSchema);


// Message Schema 

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, enum: ['Student', 'Faculty', 'TeamLead'], required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}); 

const Message=mongoose.model("Message",MessageSchema); 

const WorkUpdateSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  teamLeadId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workUpdate: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
});

const WorkUpdate = mongoose.model('WorkUpdate', WorkUpdateSchema);

// Register User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, email, password, role, faculty } = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10); 

    let newUser;
    if (role === "Team Lead") {
      if (!faculty) {
        return res.status(400).json({ message: "Faculty selection is required for Team Leads" });
      }

      const facultyExists = await User.findById(faculty);
      if (!facultyExists || facultyExists.role !== "Faculty") {
        return res.status(400).json({ message: "Invalid faculty selection" });
      }

      newUser = new User({ username, email, password: hashedPassword, role, faculty });
    } else {
      newUser = new User({ username, email, password: hashedPassword, role });
    }

    // Save user (password is automatically hashed by the schema)
    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Fetch all faculty members for Team Lead selection
app.get("/api/auth/faculty", async (req, res) => {
  try {
    const facultyList = await User.find({ role: "Faculty" }).select("username _id");
    res.status(200).json(facultyList);
  } catch (error) {
    console.error("Error fetching faculty members:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Login User
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    console.log(`🔹 Login Attempt: ${email}, Role: ${role}`);

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, password, and role are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (err) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// API Endpoint: Get All Students
app.get("/api/users/students", async (req, res) => {
  try {
    const students = await User.find({ role: "Student" }).select("username email");
    console.log("Fetched Students:", students);
    res.status(200).json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API Endpoint: Get All Faculty
app.get("/api/users/faculty", async (req, res) => {
  try {
    const faculty = await User.find({ role: "Faculty" }).select("username email");
    console.log("Fetched Faculty:", faculty);
    res.status(200).json(faculty);
  } catch (err) {
    console.error("Error fetching faculty:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API Endpoint: Get All Team Leads
app.get("/api/users/team-leads", async (req, res) => {
  try {
    const teamLeads = await User.find({ role: "Team Lead" }).select("username email");
    console.log("Fetched Team Leads:", teamLeads);
    res.status(200).json(teamLeads);
  } catch (err) {
    console.error("Error fetching team leads:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API Endpoint: Get All Users by Role
app.get("/api/users/role/:role", async (req, res) => {
  const { role } = req.params;

  if (!["Faculty", "Student", "Team Lead"].includes(role)) {
    return res.status(400).json({ message: "Invalid role specified" });
  }

  try {
    const users = await User.find({ role }).select("username email");
    console.log(`Fetched ${role}s:`, users);
    res.status(200).json(users);
  } catch (err) {
    console.error(`Error fetching ${role}s:`, err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API Endpoint: Send Email Notification
app.post("/api/notify", async (req, res) => {
  console.log("Request Body:", req.body);
  const { projectName, assignedBy, assignedTo, milestone, description, email, password } = req.body;

  if (!projectName || !assignedBy || !assignedTo || !milestone || !description || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const sender = await User.findOne({ username: assignedBy, role: "Faculty" });
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }
  
    const recipient = await User.findOne({ username: assignedTo, role: "Team Lead" });
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "projectmanagementsystem05@gmail.com",
        pass: "nwoi vzjl wzrd alvm", // Ensure this is valid
      },
    });
  
    const mailOptions = {
      from: sender.email,
      to: recipient.email,
      subject: `Project Assigned: ${projectName}`,
      text: `Hi ${assignedTo},\n\nYou have been assigned a new project by ${assignedBy}.\n\nProject Details:\n- Project Name: ${projectName}\n- Description: ${description}\n- Milestone: ${milestone}\n\nBest regards,\nProject Management System`,
    };
   
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error in /api/notify:", error);
    return res.status(500).json({ message: "Failed to send email", error: error.message });
  }
});

// API Endpoint: Store Project Details in MongoDB
app.post("/api/projects", async (req, res) => {
  const { projectName, projectType, assignedBy, assignedTo, milestone, description ,status } = req.body;

  if (!projectName || !assignedBy || !assignedTo || !milestone || !description || !projectType || !status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newProject = new Project({ projectName, projectType, assignedBy, assignedTo, milestone, description, status , createdAt:new Date()});
    await newProject.save();
    res.status(200).json({ message: "Project created successfully" });
  } catch (err) {
    console.error("Error saving project:", err);
    res.status(500).json({ message: "Failed to save project" });
  }
});

// API: Get projects assigned to a specific team lead
app.get("/api/projects/assigned-to/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const projects = await Project.find({ assignedTo: username });

    if (!projects.length) {
      return res.status(404).json({ message: "No assigned projects found." });
    }

    res.status(200).json(projects);
  } catch (err) {
    console.error(`Error fetching projects for ${req.params.username}:`, err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API: Get all projects
app.get("/api/projects", async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (err) {
    console.error("Error fetching all projects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}); 


app.put("/api/projects/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ message: "Status is required" });
  }

  try {
    const updatedProject = await Project.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.status(200).json({ message: "Project status updated successfully", updatedProject });
  } catch (err) {
    console.error("Error updating project status:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// API to create a team
/*  app.post("/api/create-team", async (req, res) => { 
    let { teamName, teamMembers, teamLead } = req.body;

    if (!teamName || !teamMembers.length || !teamLead) {
        return res.status(400).json({ message: "Team name, team lead, and at least one member are required" });
    }

    try {
        // Convert usernames to ObjectIds
        const users = await User.find({ username: { $in: teamMembers } }).select("_id");
        const userIds = users.map(user => user._id);

        // Ensure teamLead is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(teamLead)) {
            return res.status(400).json({ message: "Invalid team lead ID" });
        }
        
        teamLead = new mongoose.Types.ObjectId(teamLead); // Convert teamLead to ObjectId

        // Create new team with team lead
        const newTeam = new Team({ teamName, teamMembers: userIds, teamLead });
        await newTeam.save();

        res.status(201).json({ message: "Team created successfully", team: newTeam });
    } catch (error) {
        console.error("Error creating team:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});  */



//API to get all teams
app.get("/api/teams", async (req, res) => {
  try {
    const { teamLeadId } = req.query; // Get teamLeadId from request query

    if (!teamLeadId) {
      return res.status(400).json({ message: "Team Lead ID is required" });
    }

    const teams = await Team.find({ teamLead: teamLeadId }); // Fetch teams created by the specific team lead
    res.json(teams);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});





// API to Get Team Members by Team ID
app.get("/api/teams/:teamId", async (req, res) => {
  const { teamId } = req.params;
  if (!teamId) {
    return res.status(400).json({ message: "Team ID is required" });
  }
  try {
    console.log("Fetching team with ID:", teamId);
    const team = await Team.findById(teamId).populate("teamMembers");
    if (!team) {
      console.error("Team not found for ID:", teamId);
      return res.status(404).json({ message: "Team not found" });
    }
    console.log("Found team:", team);
    // Return the team data with the field "teamMembers"
    res.json({ teamMembers: team.teamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// API: Add Members to a Team
app.put("/api/teams/:teamId/add-members", async (req, res) => {
  const { teamId } = req.params;
  const { memberIds } = req.body; // expecting an array of user IDs
  if (!mongoose.Types.ObjectId.isValid(teamId)) {
    return res.status(400).json({ message: "Invalid team ID" });
  }
  if (!memberIds || !Array.isArray(memberIds)) {
    return res.status(400).json({ message: "memberIds must be an array" });
  }
  try {
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }
    // Only add those members not already present
    const newMembers = memberIds.filter(id => !team.teamMembers.includes(id));
    team.teamMembers.push(...newMembers);
    const updatedTeam = await team.save();
    await updatedTeam.populate("teamMembers");
    res.json({ teamMembers: updatedTeam.teamMembers });
  } catch (error) {
    console.error("Error adding members to team:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

//delete project 
app.delete("/api/projects/:id", async (req, res) => {
  console.log("DELETE request for project ID:", req.params.id);
  const { id } = req.params;
  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      console.log("Project not found for ID:", id);
      return res.status(404).json({ message: "Project not found" });
    }
    console.log("Deleted project:", deletedProject);
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}); 

//delete team 
app.delete("/api/teams/:id", async (req, res) => {
  try{
    const {id}=req.params;
    const deletedTeam=await Team.findByIdAndDelete(id);
    if (!deletedTeam){
      return res.status(404).json({message: "Team is not found"})
    }
    res.json({message:"Team is deleted successfully"})
  } catch(error)
  {
    console.log("Error deleting team: ",error)
    res.status(500).json({message:"Server error"})
  }
}); 

//fetching project related to the team lead
app.get("/api/projects/teamLead/:id", async (req, res) => {
  try {
      const { id } = req.params;
      const projects = await Project.find({ teamLeadId: id });  // Fetch projects for specific team lead
      res.json(projects);
  } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Server error" });
  }
}); 

// API to assign a project to a team
app.post("/api/assignProject", async (req, res) => {
  const { teamLeadId, teamId, projectId } = req.body;

  if (!teamLeadId || !teamId || !projectId) {
      return res.status(400).json({ message: "All fields are required" });
  }

  try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(teamLeadId) ||
          !mongoose.Types.ObjectId.isValid(teamId) ||
          !mongoose.Types.ObjectId.isValid(projectId)) {
          return res.status(400).json({ message: "Invalid ID format" });
      }

      // Check if the Project exists
      const project = await Project.findById(projectId);
      if (!project) {
          return res.status(404).json({ message: "Project not found" });
      }

      // Check if the Team exists
      const team = await Team.findById(teamId);
      if (!team) {
          return res.status(404).json({ message: "Team not found" });
      }

      // Check if the Team Lead exists
      const teamLead = await User.findById(teamLeadId);
      if (!teamLead) {
          return res.status(404).json({ message: "Team Lead not found" });
      }

      // Check if project is already assigned to a team
      const existingAssignment = await AssignedProject.findOne({ projectId });
      if (existingAssignment) {
          return res.status(400).json({ message: "Project already assigned to a team." });
      }

      // Assign the project
      const assignedProject = new AssignedProject({
          teamLeadId,
          teamId,
          projectId,
      });

      await assignedProject.save();
      res.status(200).json({ message: "Project assigned successfully!", assignedProject });

  } catch (error) {
      console.error("Error assigning project:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
  }
}); 



// Fetch projects assigned to a team lead but not yet assigned to a team
app.get("/api/projects/unassigned/:teamLeadName", async (req, res) => {
  const { teamLeadName } = req.params;

  try {
      console.log("Fetching unassigned projects for Team Lead:", teamLeadName);

      // 🔹 Step 1: Find the Team Lead's ObjectId
      const teamLead = await User.findOne({ username: teamLeadName });

      if (!teamLead) {
          return res.status(404).json({ message: "Team Lead not found" });
      }

      // 🔹 Step 2: Find projects assigned to the team lead (by name)
      const projects = await Project.find({ assignedTo: teamLeadName });

      if (projects.length === 0) {
          return res.status(404).json({ message: "No projects found for this team lead" });
      }

      // 🔹 Step 3: Fetch projects already assigned to teams
      const assignedProjectIds = await AssignedProject.distinct("projectId", {
          teamLeadId: teamLead._id, // Now using ObjectId instead of a string
      });

      // 🔹 Step 4: Filter out already assigned projects
      const unassignedProjects = projects.filter(project => !assignedProjectIds.includes(project._id.toString()));

      if (unassignedProjects.length === 0) {
          return res.status(404).json({ message: "No unassigned projects available." });
      }

      res.status(200).json(unassignedProjects);
  } catch (error) {
      console.error("Error fetching unassigned projects:", error);
      res.status(500).json({ message: "Error fetching unassigned projects", error: error.message });
  }
});

// Fetch team members for a project
app.get("/api/team-members/:projectId", async (req, res) => {
  try {
      const { projectId } = req.params;

      console.log(`Fetching team members for project: ${projectId}`);

      // Find the assigned project
      const assignedProject = await AssignedProject.findOne({ projectId }).populate("teamId");

      if (!assignedProject) {
          console.log("Assigned project not found");
          return res.status(404).json({ message: "Assigned project not found" });
      }

      console.log(`Found assigned project: ${assignedProject}`);

      // Fetch the team details
      const team = await Team.findById(assignedProject.teamId);

      if (!team) {
          console.log("Team not found");
          return res.status(404).json({ message: "Team not found" });
      }

      console.log(`Team found: ${team}`);

      // Fetch user details with `username` and `email`
      const teamMembers = await User.find({ _id: { $in: team.teamMembers } }).select("username email");

      console.log(`Fetched team members:`, teamMembers);

      res.json({ teamMembers });
  } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ message: "Internal server error" });
  }
}); 

//creating the task 
app.post("/api/tasks", async (req, res) => {
  try {
    const { projectId, taskName, description, assignTo, deadline, status } = req.body;

    // Check if all required fields are present
    if (!projectId || !taskName || !description || !assignTo || !deadline || !status) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    console.log("Received Task Data:", req.body);

    // Convert projectId and assignTo into ObjectId if they are not already
    const task = new Task({
      projectId: new mongoose.Types.ObjectId(projectId),
      taskName,
      description,
      assignTo: new mongoose.Types.ObjectId(assignTo), // Fixed!
      deadline: new Date(deadline),
      status,
    });
    
    

    await task.save();
    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("Error creating task:", error); // Log the full error in the backend
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
}); 

// Fetch tasks for a project
app.get("/api/tasks/:projectId", async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate("assignTo", "username"); // Ensure "name" is being retrieved

    console.log("Fetched Tasks:", JSON.stringify(tasks, null, 2)); // Debugging

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Error fetching tasks", error });
  }
}); 

// Update Task Status
app.put("/api/tasks/update-status/:taskId", async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "Task ID is required" });
    }

    if (!["To Do", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { status },
      { new: true }
    ).populate("assignTo", "username"); // Ensure `assignTo` is populated

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Server error" });
  }
});


//  Configure Email Transporter (Using Faculty Email)
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "projectmanagementsystem05@gmail.com", // Faculty's email (sender)
    pass: "nwoi vzjl wzrd alvm", // Faculty's email password
  },
}); 

const sendApprovalRequest = async (facultyEmail, teamLeadName, teamLeadEmail) => {
  try {
    const mailOptions = {
      from: "projectmanagementsystem05@gmail.com", // Sent from Faculty's email
      to: facultyEmail, // Faculty receives the email
      subject: "Approval Request: Additional Team Creation",
      text: `Dear Faculty,\n\nTeam Lead **${teamLeadName}** (Email: ${teamLeadEmail}) is requesting approval to create an additional team.\n\nPlease review and approve or reject this request.\n\nBest Regards,\nProject Management System`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Approval request email sent successfully.");
  } catch (error) {
    console.error("Error sending approval request:", error);
  }
};

// API Route to Handle Team Creation & Email Notification
app.post("/api/create-team", async (req, res) => {
  try {
    const { teamName, teamMembers, teamLeadId } = req.body;  

    if (!teamName || !teamMembers.length || !teamLeadId) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    console.log("Received teamMemberIds from frontend:", teamMembers); // Debug log

    // Convert teamMemberIds to ObjectIds
    const teamMemberObjectIds = teamMembers.map(id => new mongoose.Types.ObjectId(id));

    // Fetch users based on ObjectIds
    const teamMemberObjects = await User.find({ _id: { $in: teamMemberObjectIds } }, "_id");

    console.log("Found team members from DB:", teamMemberObjects); // Debug log

    if (teamMemberObjects.length !== teamMembers.length) {
      return res.status(400).json({ message: "One or more team members not found." });
    }

    const teamMemberIds = teamMemberObjects.map(member => member._id);

    console.log("Final teamMemberIds:", teamMemberIds); // Debug log

    // Check if Team Lead already has a team
    const existingTeam = await Team.findOne({ teamLead: teamLeadId });

    if (existingTeam) {
      const teamLead = await User.findById(teamLeadId);

      if (!teamLead || !teamLead.faculty) {
        return res.status(400).json({ message: "Faculty not assigned to this Team Lead." });
      }

      const faculty = await User.findOne({ _id: teamLead.faculty, role: "Faculty" });

      if (!faculty) {
        return res.status(400).json({ message: "Faculty not found." });
      }

      console.log("Sending approval request to:", faculty.email); 

      // Save request to database
      const teamRequest = new PendingTeamRequest({
        teamLead: teamLeadId,
        faculty: faculty._id,
        teamName,
        teamMembers: teamMemberObjectIds,
        status: "Pending",
      });

      await teamRequest.save();

      try {
        await sendApprovalRequest(faculty.email, teamLead.username, teamLead.email, teamName, teamMembers);
        console.log("Approval request email sent successfully.");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res.status(500).json({ message: "Failed to send approval email.", error: emailError.message });
      }

      return res.status(400).json({ message: "Approval required from faculty." });
    }

    // Fetch the faculty ID from the team lead
    const teamLead = await User.findById(teamLeadId);
    if (!teamLead || !teamLead.faculty) {
      return res.status(400).json({ message: "Faculty not assigned to this Team Lead." });
    }

    const facultyId = teamLead.faculty; // Assign faculty ID from the team lead

    // Create new team
    const newTeam = new Team({ teamName, teamMembers: teamMemberIds, teamLead: teamLeadId,faculty: facultyId,  });

    await newTeam.save();

    console.log("Team created successfully:", newTeam);
    res.status(201).json({ message: "Team created successfully.", team: newTeam });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error.", error: error.message });
  }
});



app.post("/api/get-user-ids", async (req, res) => {
  try {
    const { usernames } = req.body;

    if (!usernames || !Array.isArray(usernames)) {
      return res.status(400).json({ message: "Invalid usernames provided." });
    }

    const users = await User.find({ username: { $in: usernames } }, "_id");

    if (users.length !== usernames.length) {
      return res.status(400).json({ message: "Some users were not found." });
    }

    res.status(200).json({ userIds: users.map(user => user._id) });

  } catch (error) {
    console.error("Error fetching user IDs:", error);
    res.status(500).json({ message: "Server error." });
  }
});

app.get("/api/faculty/pending-requests/:facultyId", async (req, res) => {
  try {
      const { facultyId } = req.params;
      console.log("Fetching pending requests for Faculty ID:", facultyId);

      // Validate facultyId
      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
          console.log("Invalid Faculty ID format:", facultyId);
          return res.status(400).json({ error: "Invalid Faculty ID format" });
      }

      // Populate both teamLead and teamMembers with username & email
      const pendingRequests = await PendingTeamRequest.find({ faculty: facultyId, status: "Pending" })
      .populate({ path: "teamMembers", select: "username email" })
      .populate({ path: "teamLead", select: "username email" });

      if (!pendingRequests.length) {
          console.log("No pending requests found for Faculty ID:", facultyId);
          return res.status(404).json({ message: "No pending requests found." });
      }

      res.json(pendingRequests);
  } catch (error) {
      console.error("Error fetching pending requests:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
}); 


//Approve team creation
app.post("/api/faculty/approve-team/:teamId", async (req, res) => {
  try {
      const { teamId } = req.params; 

      if (!mongoose.Types.ObjectId.isValid(teamId)) {
        return res.status(400).json({ error: "Invalid Team ID" });
      }
      
      const pendingRequest = await PendingTeamRequest.findById(teamId);
      if (!pendingRequest) {
          return res.status(404).json({ error: "Pending request not found." });
      }

      // Create the new team
      const newTeam = new Team({
          teamName: pendingRequest.teamName,
          teamMembers: pendingRequest.teamMembers,
          teamLead: pendingRequest.teamLead,
          faculty: pendingRequest.faculty,
      });

      await newTeam.save(); 

      // Update request status
    pendingRequest.status = "Approved";
    await pendingRequest.save();

    // Send Approval Email to Team Lead
    const teamLead = await User.findById(pendingRequest.teamLead);
    if (teamLead) {
        await sendEmail(
            teamLead.email,
            "Team Creation Approved",
            `Dear ${teamLead.name},\n\nYour team "${pendingRequest.teamName}" has been approved by the faculty!\n\nYou can now start working on your project.\n\nBest Regards,\nProject Management System`
        );
    }

      res.json({ message: "Team approved and created successfully!" });
  } catch (error) {
      console.error("Error approving team request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
}); 

// Reject team request
app.post("/api/faculty/reject-team/:requestId", async (req, res) => {
  try {
      const { requestId } = req.params;

      console.log("Rejecting Team Request ID:", requestId); //  Debugging log

      if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ error: "Invalid Request ID format" });
      }
      
      const pendingRequest = await PendingTeamRequest.findById(requestId);
      if (!pendingRequest) {
          return res.status(404).json({ error: "Request not found." });
      }

      // Update status to Rejected
      pendingRequest.status = "Rejected";
      await pendingRequest.save();

     // Send Rejection Email to Team Lead
     const teamLead = await User.findById(pendingRequest.teamLead);
     if (teamLead) {
         await sendEmail(
             teamLead.email,
             "Team Creation Rejected",
             `Dear ${teamLead.name},\n\nYour request to create team "${pendingRequest.teamName}" was rejected by the faculty.\n\nIf you have any questions, please contact your faculty advisor.\n\nBest Regards,\nProject Management System`
         );
     }

      res.json({ message: "Team request rejected successfully!" });
  } catch (error) {
      console.error("Error rejecting team request:", error.message);
      res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to Send Email
const sendEmail = async (to, subject, text) => {
  try {
    const mailOptions = {
      from: "projectmanagementsystem05@gmail.com",
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};


app.post("/api/faculty/respond-request", async (req, res) => {
  try {
    const { requestId, action } = req.body;
    const pendingRequest = await PendingTeamRequest.findById(requestId);

    if (!pendingRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (action === "approve") {
      // Create the team
      const newTeam = new Team({
        teamName: pendingRequest.teamName,
        teamMembers: pendingRequest.teamMembers,
        teamLead: pendingRequest.teamLead,
      });

      await newTeam.save();
      pendingRequest.status = "Approved";

      // Notify the Team Lead about approval
      const teamLead = await User.findById(pendingRequest.teamLead);
      await sendEmail(teamLead.email, "Team Creation Approved", `Your team "${pendingRequest.teamName}" has been approved!`);
    } else {
      pendingRequest.status = "Rejected";

      // Notify the Team Lead about rejection
      const teamLead = await User.findById(pendingRequest.teamLead);
      await sendEmail(teamLead.email, "Team Creation Rejected", `Your request to create team "${pendingRequest.teamName}" was rejected.`);
    }

    await pendingRequest.save();
    res.status(200).json({ message: `Request ${action}d successfully` });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}); 

// Fetch teams for a specific faculty
app.get("/api/teams/faculty/:facultyId", async (req, res) => {
  try {
      const facultyId = req.params.facultyId;
      console.log("Faculty ID received in API:", facultyId);

      if (!mongoose.Types.ObjectId.isValid(facultyId)) {
          console.log("Invalid Faculty ID format");
          return res.status(400).json({ message: "Invalid Faculty ID format" });
      }

      const teams = await Team.find({ faculty: new mongoose.Types.ObjectId(facultyId) });

      if (!teams || teams.length===0) {
          console.log("No teams found for this faculty:", facultyId);
          return res.status(404).json({ message: "Team not found" });
      }

      console.log("Teams found:", teams);
      res.json(teams);
  } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});  

// Function to send an email
const sendMail = async (to, subject, text) => {
  const mailOptions = {
    from: "projectmanagementsystem05@gmail.com",
    to,
    subject,
    text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.response}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

 
// Create Post and Notify Team Leads
app.post("/api/posts/create", async (req, res) => {
  const { title, description, meetingDate, meetingTime, facultyId } = req.body;

  if (!title || !description || !meetingDate || !meetingTime || !facultyId) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }

  try {
    // Create and Save the Post
    const newPost = new Post({ title, description, meetingDate, meetingTime, facultyId });
    await newPost.save();
    console.log("Post saved successfully!");

    // Fetch Team Leads under this Faculty
    const teamLeads = await User.find({ role: "Team Lead", faculty: facultyId });

    console.log("Found Team Leads:", teamLeads.map((lead) => lead.email));

    // Send Emails
    if (teamLeads.length > 0) {
      await Promise.all(
        teamLeads.map(async (lead) => {
          try {
            await sendMail(
              lead.email,
              "New Post from Faculty",
              `Hello ${lead.username},\n\nYour faculty has posted an update:\n\nTitle: ${title}\nDescription: ${description}\nMeeting Date: ${meetingDate}\nMeeting Time: ${meetingTime}\nInform your team members and attend the meeting.\n\nBest Regards,\nProject Management System`
            );
          } catch (error) {
            console.error(`Error sending email to ${lead.email}:`, error);
          }
        })
      );
    } else {
      console.log("No Team Leads found under this faculty.");
    }

    res.status(201).json({ success: true, message: "Post created and emails sent" });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ success: false, message: "Error creating post" });
  }
});

// Get assigned projects for logged-in student
app.get("/api/student/assigned-projects/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const assignedProjects = await AssignedProject.find().populate("teamId").populate("projectId");

    const filteredProjects = assignedProjects.filter((project) =>
      project.teamId.teamMembers.includes(userId)
    );

    res.status(200).json(filteredProjects);
  } catch (err) {
    res.status(500).json({ error: "Error fetching assigned projects" });
  }
}); 

// Get tasks assigned to logged-in user students
app.get("/api/tasks/student/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = await Task.find({ assignTo: userId }).populate("projectId");

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

// Get team and members by student (user) ID
app.get("/api/student/team/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;

    const team = await Team.findOne({ teamMembers: studentId })
      .populate("teamMembers", "username email");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      _id: team._id,
      teamName: team.teamName,
      teamMembers: team.teamMembers,
    });
  } catch (error) {
    console.error("Error fetching student team:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//report and analysis
app.get("/api/project/stats", async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const ongoingProjects = await Project.countDocuments({ status: { $regex: /^ongoing$/i } });
    const completedProjects = await Project.countDocuments({ status: { $regex: /^completed$/i } });
    const pendingApproval = await Project.countDocuments({ status: { $regex: /^pending approval$/i } });

    res.json({
      totalProjects,
      ongoingProjects,
      completedProjects,
      pendingApproval
    });
  } catch (error) {
    console.error("Error fetching project stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}); 

// Get all messages
app.get("/api/messages/get", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
app.post("/api/messages/send", async (req, res) => {
  const { senderId, senderName, senderRole, message } = req.body;

  try {
    const newMessage = new Message({ senderId, senderName, senderRole, message });
    await newMessage.save();
    res.status(200).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
}); 


// Submit Work Update
app.post('/api/workupdates/submit', async (req, res) => {
  const { studentId, studentName, workUpdate } = req.body;

  try {
    // 1. Find the team where the student is a team member
    const team = await Team.findOne({ teamMembers: studentId }).populate('teamLead');

    if (!team) {
      return res.status(404).json({ message: "Team not found for the student." });
    }

    const teamLead = team.teamLead;
    if (!teamLead || !teamLead.email) {
      return res.status(404).json({ message: "Team Lead not found or email missing." });
    }

    // 2. Save work update into DB
    const newWorkUpdate = new WorkUpdate({
      studentId,
      studentName,
      teamLeadId: teamLead._id,
      workUpdate,
    });

    await newWorkUpdate.save(); 

    // 3. Get student's email properly
    const student = await User.findById(studentId);   // <-- Corrected line
    if (!student || !student.email) {
      return res.status(404).json({ message: "Student email not found." });
    }

    // 4. Send email to Team Lead
    const mailOptions = {
      from: student.email,
      to: teamLead.email,
      subject: `New Work Update from ${studentName}`,
      text: `Student ${studentName} has submitted the following work update:\n\n${workUpdate}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Work update submitted and email sent successfully!" });

  } catch (error) {
    console.error("Error submitting work update:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message, stack: error.stack });
  }
});









// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports=Project;
