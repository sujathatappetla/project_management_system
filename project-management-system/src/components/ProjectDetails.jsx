import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState , useEffect } from "react";
import "./ProjectDetails.css";
import TaskCreation from "./TaskCreation";

const ProjectDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const project = location.state?.project; 

  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null); // Track which task is being edited
  const [selectedStatus, setSelectedStatus] = useState(""); // Track selected status

  const handleTaskCreation = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
    setShowForm(false);
  }; 

  useEffect(() => {
    const fetchTasks = async () => {
      if (!project?._id) return; 
  
      try {
        const response = await fetch(`http://localhost:5000/api/tasks/${project._id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched tasks in frontend:", data); // Debugging
  
        setTasks(data);
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
      }
    };
  
    fetchTasks();
  }, [project?._id]);
    

  if (!project) {
    return <p className="error-message">Project details not found.</p>;
  }  

  const handleStatusUpdate = async (taskId) => {
    try {
      if (!selectedStatus) {
        alert("Please select a status before updating.");
        return;
      }
  
      const response = await fetch(`http://localhost:5000/api/tasks/update-status/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update task status");
      }
  
      const updatedTask = await response.json();
      console.log("Updated task received:", updatedTask); // ✅ Debugging
  
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task._id === taskId ? { ...updatedTask, assignTo: task.assignTo } : task
        )
      );
  
      setEditingTaskId(null);
      setSelectedStatus("");
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };
  


  return (
    <div className="project-details-page">
      <div className="project-details-container">
        <h1 className="project-details-heading">{project.projectName}</h1>
        <p className="project-details-para">
          <strong>Project Type:</strong> {project.projectType}
        </p>
        <p className="project-details-para">
          <strong>Assigned By:</strong> {project.assignedBy}
        </p>
        <p className="project-details-para">
          <strong>Description:</strong> {project.description}
        </p>
        <p className="project-details-para">
          <strong>Milestone:</strong> {project.milestone}
        </p>
        <p className="project-details-para">
          <strong>Status:</strong> {project.status}
        </p>
      </div>
      <div className="button-container">
        <button className="create-task-btn" onClick={()=> setShowForm(!showForm)}>Create Task</button>
        <button className="back-btn" onClick={() => navigate(-1)}>Back</button>
      </div> 

      {showForm && (
        <div>
          <TaskCreation projectId={project._id} onTaskCreated={handleTaskCreation} />
        </div>
      )}  

      <h1 className="Tasks-heading">Tasks Status</h1>

      <div className="three-task-sections">
        <div className="task-section">
          <h3 className="task-section-heading">To-Do</h3>
          {tasks.filter(task => task.status === "To Do").map(task => (
            <div key={task._id} className="task-item">
              <div className="task-item-content">
                <h1 className="task-item-heading">{task.taskName}</h1>
                {editingTaskId === task._id ? (
                    <>
                      <select
                        className="status-dropdown"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        type="button"
                        className="update-btn-task-item"
                        onClick={() => handleStatusUpdate(task._id)}
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="update-btn-task-item"
                      onClick={() => {
                        setEditingTaskId(task._id);
                        setSelectedStatus(task.status); // Pre-select current status
                      }}
                    >
                      Update
                    </button>
                  )}
              </div> 
              <div className="task-item-assignto">
                {task.assignTo && task.assignTo.username ? (
                  <div className="assignee-initial">
                    {task.assignTo.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="assignee-initial">?</div>
                )}
              </div>
            </div>
          ))}
        </div> 

        <div className="task-section">
          <h3 className="task-section-heading">In Progress</h3>
          {tasks.filter(task => task.status === "In Progress").map(task => (
            <div key={task._id} className="task-item">
              <div className="task-item-content">
                <h1 className="task-item-heading">{task.taskName}</h1>
                {editingTaskId === task._id ? (
                    <>
                      <select
                        className="status-dropdown"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        type="button"
                        className="update-btn-task-item"
                        onClick={() => handleStatusUpdate(task._id)}
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="update-btn-task-item"
                      onClick={() => {
                        setEditingTaskId(task._id);
                        setSelectedStatus(task.status); // Pre-select current status
                      }}
                    >
                      Update
                    </button>
                  )}
              </div> 
              <div className="task-item-assignto">
               {task.assignTo && task.assignTo.username ? (
                  <div className="assignee-initial">
                    {task.assignTo.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="assignee-initial">?</div>
                )}
              </div>
          </div>
          ))}
        </div>

        <div className="task-section">
          <h3 className="task-section-heading">Completed</h3>
          {tasks.filter(task => task.status === "Completed").map(task => (
            <div key={task._id} className="task-item">
              <div className="task-item-content">
                <h1 className="task-item-heading">{task.taskName}</h1>
                {editingTaskId === task._id ? (
                    <>
                      <select
                        className="status-dropdown"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button
                        type="button"
                        className="update-btn-task-item"
                        onClick={() => handleStatusUpdate(task._id)}
                      >
                        Update
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="update-btn-task-item"
                      onClick={() => {
                        setEditingTaskId(task._id);
                        setSelectedStatus(task.status); // Pre-select current status
                      }}
                    >
                      Update
                    </button>
                  )}
              </div> 
              <div className="task-item-assignto">
                {task.assignTo && task.assignTo.username ? (
                  <div className="assignee-initial">
                    {task.assignTo.username.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className="assignee-initial">?</div>
                )}
              </div>
          </div>
          ))}
        </div>
      </div> 

    </div>
  );
};

export default ProjectDetails;