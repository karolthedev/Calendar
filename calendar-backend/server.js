// Import required modules
const express = require("express");
const cors = require("cors");
const pool = require("./db"); // PostgreSQL connection
const path = require("path");
const fs = require("fs");

// Create an instance of Express
const app = express();

// Define the port number or use an environment variable
const port = 3000;

// Ensure logs directory exists
const logDir = path.resolve(__dirname, "./logs");
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, "access.log");

// Enable trust proxy if behind a reverse proxy (nginx, cloudflare)
app.set("trust proxy", true);

// Request logging middleware
app.use((req, res, next) => {
    const clientIP =
        req.headers["x-forwarded-for"]?.split(",").shift()?.trim() || req.ip;
    const start = process.hrtime();

    res.on("finish", () => {
        const duration = process.hrtime(start);
        const ms = (duration[0] * 1e3 + duration[1] / 1e6).toFixed(2);
        const now = new Date().toLocaleString();;

        // Only log body for POST, PUT, or PATCH
        let bodyLog = '';
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
            try {
                bodyLog = ` BODY=${JSON.stringify(req.body)}`;
            } catch (e) {
                bodyLog = ' BODY=[Unloggable]';
            }
        }

        const logLine = `[${now}] ${clientIP} - ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms${bodyLog}\n`;

        fs.appendFile(logFile, logLine, err => {
            if (err) console.error("Failed to write log:", err);
        });
    });

    next();
});


// Enable CORS to allow frontend requests
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// GET endpoint to retrieve all tasks
app.get("/tasks", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM tasks");
        const formattedTasks = rows.map(task => ({
            ...task,
            date: task.date instanceof Date ? task.date.toISOString().split("T")[0] : task.date
        }));
        res.json({ tasks: formattedTasks });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get task by ID
app.get("/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Task not found" });
        }

        const formattedTask = {
            ...rows[0],
            date: rows[0].date instanceof Date ? rows[0].date.toISOString().split("T")[0] : rows[0].date
        };

        res.json({ task: formattedTask });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// POST endpoint to create a new task
app.post("/tasks", async (req, res) => {
    try {
        const { date, title, description } = req.body;
        const id = Date.now();

        if (!date || !title) {
            return res.status(400).json({ error: "date and title are required" });
        }

        await pool.query(
            "INSERT INTO tasks (id, date, title, description) VALUES ($1, $2, $3, $4)",
            [id, date, title, description || null]
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

        const query = `UPDATE tasks SET date = $1, title = $2, description = $3 WHERE id = $4`;
        const values = [date, title, description, id];

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

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
