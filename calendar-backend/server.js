// Import Express
const express = require('express');

// Create an instance of Express
const app = express();

// Define the port number or use an environment variable
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// In-memory storage for tasks
// Each task will have an id, date, title, and description
let tasks = [];

// GET endpoint to retrieve all tasks
app.get('/tasks', (req, res) => {
    // Return a JSON object containing all tasks
    res.json({ tasks: tasks });
});

// POST endpoint to create a new task
app.post('/tasks', (req, res) => {
    // Extract task details from the request body
    const { date, title, description } = req.body;
    
    // Create a new task object and assign a unique id using the current timestamp
    const newTask = { 
        id: Date.now(), 
        date: date, 
        title: title, 
        description: description 
    };
    
    // Add the new task to the tasks array
    tasks.push(newTask);
    
    // Respond with status 201 (Created) and the new task in JSON format
    res.status(201).json(newTask);
});

// PUT endpoint to update an existing task
app.put('/tasks/:id', (req, res) => {
    // Get the task id from the URL parameters (as a number)
    const taskId = Number(req.params.id);
    
    // Find the task by its id
    const task = tasks.find(t => t.id === taskId);
    
    // If the task does not exist, respond with a 404 error
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    // Destructure any updated fields from the request body
    const { date, title, description } = req.body;
    
    // Update task properties if provided
    task.date = date !== undefined ? date : task.date;
    task.title = title !== undefined ? title : task.title;
    task.description = description !== undefined ? description : task.description;
    
    // Respond with the updated task
    res.json(task);
});

// DELETE endpoint to remove a task
app.delete('/tasks/:id', (req, res) => {
    // Convert the id from the URL parameters to a number
    const taskId = Number(req.params.id);
    
    // Find the index of the task with the given id
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    // If the task is not found, respond with a 404 error
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    // Remove the task from the tasks array
    tasks.splice(taskIndex, 1);
    
    // Respond with a message confirming deletion
    res.json({ message: 'Task deleted successfully' });
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
