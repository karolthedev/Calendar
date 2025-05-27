document.addEventListener("DOMContentLoaded", function() {
    // Function to load tasks from the backend using a GET request.
    function loadTasks() {
        fetch("http://localhost:3000/tasks")
            .then(response => {
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                return response.json();
            })
            .then(data => {
                // data is an object like { tasks: [ ... ] }
                displayTasks(data.tasks);
            })
            .catch(error => {
                console.error("Error loading tasks:", error);
            });
    }

    // Function to display tasks within their corresponding calendar cells.
    // Assumes each .date-cell displays a day number matching the task's date day.
    function displayTasks(tasks) {
        // Convert NodeList of .date-cell elements into an array
        const cells = Array.from(document.querySelectorAll(".date-cell"));
        tasks.forEach(task => {
            // Extract the day number from the task.date
            const taskDay = new Date(task.date).getDate();
            // Find the cell where the text content (day) matches taskDay
            const cell = cells.find(c => c.textContent.trim() == taskDay);
            if (cell) {
                // Create a new element to display the task title
                const taskItem = document.createElement("div");
                taskItem.textContent = task.title;
                taskItem.classList.add("task-item");
                cell.appendChild(taskItem);
            }
        });
    }

    // Function to send a POST request to create a new task.
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
            console.log("Created Task:", newTask);
            // Update the UI immediately by appending the new task to its cell.
            appendTaskToCell(newTask);
        })
        .catch(error => {
            console.error("Error creating task:", error);
        });
    }

    // Function to append a new task element to the correct calendar cell.
    function appendTaskToCell(task) {
        const cells = Array.from(document.querySelectorAll(".date-cell"));
        const taskDay = new Date(task.date).getDate();
        const cell = cells.find(c => c.textContent.trim() == taskDay);
        if (cell) {
            const taskItem = document.createElement("div");
            taskItem.textContent = task.title;
            taskItem.classList.add("task-item");
            cell.appendChild(taskItem);
        }
    }

    // Initial load: fetch and display tasks from the backend.
    loadTasks();

    // Get references to modal elements.
    const modal = document.getElementById("task-modal");
    const closeModalButton = document.getElementById("close-modal");

    // When the close button is clicked, hide the modal.
    closeModalButton.addEventListener("click", function() {
        modal.classList.remove("active");
    });

    // Add click event listeners to each date cell to open the modal.
    document.querySelectorAll(".date-cell").forEach(cell => {
        cell.addEventListener("click", function() {
            // Open the modal.
            modal.classList.add("active");

            // Set the default value of the task date field based on the clicked cell.
            // This assumes there's an input element with the id "taskDate" in the modal.
            let currentYear = new Date().getFullYear();
            let currentMonth = (new Date().getMonth() + 1).toString().padStart(2, "0");
            let day = cell.textContent.trim().padStart(2, "0");
            document.getElementById("taskDate").value = `${currentYear}-${currentMonth}-${day}`;
        });
    });

    // Handle the form submission for creating a new task.
    // Assumes there is a form with id "taskForm" in the modal, along with inputs:
    // "taskDate", "taskTitle", and "taskDescription".
    document.getElementById("taskForm").addEventListener("submit", function(e) {
        e.preventDefault(); // Prevent the default form submission.

        // Gather values from the form fields.
        const taskDate = document.getElementById("taskDate").value;
        const taskTitle = document.getElementById("taskTitle").value;
        const taskDescription = document.getElementById("taskDescription").value;

        // Create a task object from the form data.
        const newTaskData = {
            date: taskDate,
            title: taskTitle,
            description: taskDescription
        };

        // Send a POST request to create the new task.
        createTask(newTaskData);

        // Optionally, clear the form after submission.
        document.getElementById("taskForm").reset();

        // Close the modal.
        modal.classList.remove("active");
    });
});
