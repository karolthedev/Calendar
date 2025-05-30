document.addEventListener("DOMContentLoaded", function () {
    // Initialize current date reference (defaults to today)
    let currentDate = new Date();

    // Function to update the calendar with the correct week
    function updateCalendar() {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Move to Sunday

        // Weekday names for the calendar
        const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        // Update week display
        document.getElementById("weekDisplay").textContent =
            `Week of ${startOfWeek.toDateString()}`;

        // Clear current grid
        const calendarGrid = document.getElementById("calendarGrid");
        calendarGrid.innerHTML = "";

        // Add weekday headers
        weekdays.forEach(day => {
            const dayHeader = document.createElement("div");
            dayHeader.classList.add("day-header");
            dayHeader.textContent = day;
            calendarGrid.appendChild(dayHeader);
        });

        // Populate calendar dates dynamically
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);

            // Create a date cell
            const cell = document.createElement("div");
            cell.classList.add("date-cell");
            cell.textContent = dayDate.getDate(); // Display only day number
            cell.dataset.date = dayDate.toISOString().split("T")[0]; // Store full date for backend matching

            // Attach event listener for opening modal
            cell.addEventListener("click", function () {
                document.getElementById("task-modal-add").classList.add("active");
                document.getElementById("taskDate").value = this.dataset.date;
            });

            calendarGrid.appendChild(cell);
        }

        // Load tasks for the current week
        loadTasks(startOfWeek);
    }

    // Navigation buttons
    document.getElementById("prevWeek").addEventListener("click", function () {
        currentDate.setDate(currentDate.getDate() - 7); // Move back a week
        updateCalendar();
    });

    document.getElementById("nextWeek").addEventListener("click", function () {
        currentDate.setDate(currentDate.getDate() + 7); // Move forward a week
        updateCalendar();
    });

    // Function to load tasks from the backend using a GET request
    function loadTasks(weekStart) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6); // End of the current week

        fetch("http://localhost:3000/tasks")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                displayTasks(data.tasks, weekStart, weekEnd);
            })
            .catch(error => {
                console.error("Error loading tasks:", error);
            });
    }

    // Function to display tasks within their corresponding calendar cells
    function displayTasks(tasks, weekStart, weekEnd) {
        const cells = Array.from(document.querySelectorAll(".date-cell"));

        tasks.forEach(task => {
            const taskDate = new Date(task.date);
            const taskDay = taskDate.getDate();

            // Ensure the task is **within the displayed week**
            if (taskDate >= weekStart && taskDate <= weekEnd) {
                const cell = cells.find(c => c.dataset.date === task.date); // Match with correct date
                if (cell) {
                    const taskItem = document.createElement("div");
                    taskItem.textContent = task.title;
                    taskItem.classList.add("task-item");
                    taskItem.setAttribute("id",task.id);
                    
                    // Attach event listener for opening modal
                    cell.addEventListener("click", function () {
                        document.getElementById("task-modal-modify").classList.add("active");
                    });

                    cell.appendChild(taskItem);
                    //make task cell a clickable button
                }
            }
        });
    }

    // Function to send a POST request to create a new task
    function createTask(taskData) {
        fetch("http://localhost:3000/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Failed to create task");
                }
                return response.json();
            })
            .then(newTask => {
                appendTaskToCell(newTask);
            })
            .catch(error => {
                console.error("Error creating task:", error);
            });
    }

    // Function to append a new task element to the correct calendar cell
    function appendTaskToCell(task) {
        const cells = Array.from(document.querySelectorAll(".date-cell"));
        const cell = cells.find(c => c.dataset.date === task.date);
        if (cell) {
            const taskItem = document.createElement("div");
            taskItem.textContent = task.title;
            taskItem.classList.add("task-item");
            taskItem.setAttribute("id",task.id);
            // Attach event listener for opening modal
            cell.addEventListener("click", function () {
                document.getElementById("task-modal-modify").classList.add("active");
            });
            cell.appendChild(taskItem);
        }
    }

    // Initial load: fetch and display tasks from the backend
    updateCalendar();

    // Close modal functionality
    document.getElementById("close-modal").addEventListener("click", function () {
        document.getElementById("task-modal-add").classList.remove("active");
        document.getElementById("task-modal-modify").classList.remove("active");
    });

    // Handle task form submission
    document.getElementById("taskForm").addEventListener("submit", function (e) {
        e.preventDefault();

        // Gather values from the form fields
        const taskDate = document.getElementById("taskDate").value;
        const taskTitle = document.getElementById("taskTitle").value;
        const taskDescription = document.getElementById("taskDescription").value;

        // Create a task object from the form data
        const newTaskData = {
            date: taskDate,
            title: taskTitle,
            description: taskDescription
        };

        // Send a POST request to create the new task
        createTask(newTaskData);

        // Clear the form and close the modal
        document.getElementById("taskForm").reset();
        document.getElementById("task-modal-add").classList.remove("active");
        document.getElementById("task-modal-modify").classList.remove("active");
    });
});
