import React, { useEffect, useState, useCallback } from 'react';
import './TaskCreation.css';

const TaskCreation = ({ projectId, onTaskCreated }) => {
    const [taskName, setTaskName] = useState("");
    const [description, setDescription] = useState("");
    const [assignTo, setAssignTo] = useState("");
    const [deadline, setDeadline] = useState("");
    const [status, setStatus] = useState("To Do");
    const [teamMembers, setTeamMembers] = useState([]);


   
    // Memoize fetch function to avoid re-creating it on every render
    const fetchTeamMembers = useCallback(async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/team-members/${projectId}`);
            if (response.ok) {
                const data = await response.json();
                console.log("Fetched team members:", data.teamMembers); 
                setTeamMembers(data.teamMembers);
            } else {
                console.error("Failed to fetch team members");
            }
        } catch (error) {
            console.error("Error fetching team members:", error);
        }
    }, [projectId]); 

    useEffect(() => {
        fetchTeamMembers();
    }, [fetchTeamMembers]);


     

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const taskData = {
            projectId,
            taskName,
            description,
            assignTo: assignTo.trim(), // Ensure it's a valid ObjectId
            deadline,
            status,
        };
    
        console.log("Sending Task Data:", taskData);
    
        try {
            const response = await fetch("http://localhost:5000/api/tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
            });
    
            const result = await response.json();
            if (response.ok) {
                alert("Task is created succressfully")
                console.log("Task created successfully:", result);
                onTaskCreated(result.task);
            } else {
                alert("Failsed to create task")
                console.error("Failed to create task:", result);
            }
        } catch (error) {
            console.error("Error submitting task:", error);
        }
    };
    


    return (
        <form className='task-creation-form' onSubmit={(e) => e.preventDefault()}>
            <h1 className='task-creation-form-heading'>Create Task</h1> 
            
            <div className='mb-3'>
                <label><strong>Task Name:</strong></label> 
                <input type='text' className='input-value' placeholder='Task Name' value={taskName} onChange={(e) => setTaskName(e.target.value)} required />
            </div>

            <div className='mb-3'>
                <label><strong>Description:</strong></label> 
                <textarea className='input-value' placeholder='Task Description' value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>

            <div className='mb-3'>
                <label><strong>Assigned To:</strong></label> 
                <select className='input-value' value={assignTo} onChange={(e) => setAssignTo(e.target.value)} required>
                    <option value="">Select Team Member</option>
                    {teamMembers.map(member => (
                        <option key={member._id} value={member._id}>
                            {member.username ? member.username : member.email} 
                        </option>
                    ))}
                </select>
            </div>

            <div className='mb-3'>
                <label><strong>Deadline:</strong></label>
                <input type='date' className='input-value' value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
            </div>

            <div className='mb-3'>
                <label><strong>Status:</strong></label> 
                <select className='input-value' value={status} onChange={(e) => setStatus(e.target.value)}> 
                    <option value="To Do">To Do</option> 
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            <button type='submit' onClick={handleSubmit} className="create-task-button">Create</button>
        </form>
    );
}

export default TaskCreation;
