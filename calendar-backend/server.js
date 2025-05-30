// Import required modules
const express = require("express");
const cors = require("cors");
const pool = require("./db"); // PostgreSQL connection

// Create an instance of Express
const app = express();

// Define the port number or use an environment variable
const port = 3000;

// Enable CORS to allow frontend requests
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// In-memory storage for tasks (temporary; in production, you'd use a database)
let tasks = [];

// GET endpoint to retrieve all tasks
app.get("/tasks", async (req, res) => {
    // Return a JSON object containing all tasks
    // res.json({ tasks: tasks });
    try {
        const { rows } = await pool.query("SELECT * FROM tasks");
        res.json({tasks: rows});
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// POST endpoint to create a new task
app.post("/tasks", async (req, res) => {
	try {
		// Extract task details from the request body
		const { date, title, description } = req.body;
		const id = Date.now();

		// Require only date and title
		if (!date || !title) {
			return res.status(400).json({ error: "date and title are required" });
		}

		await pool.query(
			"INSERT INTO tasks (id, date, title, description) VALUES ($1, $2, $3, $4)",
			[id, date, title, description || null]  // Insert null if description is missing
		);

		res.json({ message: "Task added successfully!" });
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});


// PUT endpoint to update an existing task
app.put("/tasks/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const { date, title, description } = req.body;

		let query = "UPDATE tasks SET ";
		let values = [];
		let index = 1;

		if (date) {
			query += `date = $${index}, `;
			values.push(date);
			index++;
		}
		if (title) {
			query += `title = $${index}, `;
			values.push(title);
			index++;
		}
        if (description) {
            query += `description = $${index}`;
            index++;
        }

		if (values.length === 0) {
			return res.status(400).json({ error: "At least one field must be provided" });
		}

		query = query.replace(/, $/, " ");
		query += `WHERE id = $${index}`;
		values.push(id);

		await pool.query(query, values);
		res.json({ message: "Task updated successfully!" });
	} catch (err) {
		console.error(err.message);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

// DELETE endpoint to remove a task
app.delete("/tasks/:id", async (req, res) => {
  try {
        const { id } = req.params;
        await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
        res.json({ message: "Task deleted successfully!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
