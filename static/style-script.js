const addTaskButtonToggle = document.getElementById("add-task-button");
const cancelFormButton = document.getElementById("cancel-new-task-button");
const taskContainer = document.getElementById("scrollable-task-box");
const submitTaskButton = document.getElementById("submit-new-task-button");
const collabContainer = document.getElementById("scrollable-collab-container");


addTaskButtonToggle.addEventListener("click", toggleForm)
cancelFormButton.addEventListener("click", toggleForm)

submitTaskButton.addEventListener("click", async () => {
    await addTaskToDatabase();
    document.getElementById("add-task-form").reset();
    await refreshTaskContainer()();
})

document.getElementById("manage-collab-button").addEventListener("click", () => {
    document.getElementById("collab-modal").classList.toggle("hidden")
    document.getElementById("add-collab-form").reset()
})

document.getElementById("add-collab-form").addEventListener("submit", addCollabToDatabase)

function toggleForm() {
    const form = document.getElementById("add-task-form");
    form.reset();
    form.classList.toggle('hidden');
}

async function refreshPage() {
    await refreshTaskContainer()
    await refreshCollabContainer()
}

async function refreshTaskContainer() {
    let data = await getTasksFromDatabase()

    taskContainer.innerHTML = '';
    if (data.length == 0) {
        const noTaskMsg = document.createElement("div");
        noTaskMsg.id = "no-task-screen"
        noTaskMsg.innerHTML = `<p>Your to-do list is empty</p> <p>Nice work!</p>`

        taskContainer.appendChild(noTaskMsg);
        return
    } else {
        data.forEach(task => {
            addTaskToPage(
                task.doneStatus,
                task.id,
                task.title,
                task.createdOn,
                task.dueDate,
                task.dueTime,
                task.priority
            );
        });
    }
}

async function refreshCollabContainer() {
    let collabs = await getCollabFromDatabase()

    collabContainer.innerHTML = ''
    if (collabs.length == 0) {
        // const noTaskMsg = document.createElement("div");
        // noTaskMsg.id = "no-task-screen"
        // noTaskMsg.innerHTML = `<p>Your to-do list is empty</p> <p>Nice work!</p>`

        // taskContainer.appendChild(noTaskMsg);
        // return
    } else {
        collabs.forEach(collab => addCollabToPage(collab.username));
    }
}

function addTaskToPage(isComplete, id, title, createdOn, dueDate, dueTime, priority) {
    let task = document.createElement("div");
    task.className = "task";

    task.innerHTML = 
    `<div class="task-checkbox"><i class="fa-regular ${(isComplete ? "fa-square-check" : "fa-square")} button checkbox-icon"></i></div>
    <div class="task-content">
        <h3>${title}</h3>
        <p class="task-date-created">Created on: ${createdOn}</p>
        <div class="task-details">
            <p>${(dueDate ? `Due on ${dueDate}` + (dueTime ? ` at ${dueTime}` : "") : "No due date")}</p>
            <p>Priority: ${priority}</p>
        </div>
    </div>
    <div class="task-actions">
        <div><i class="fa-solid fa-pen button edit-icon"></i></div>
        <div><i class="fa-solid fa-trash button delete-icon"></i></div>
    </div>`;

    task.querySelector(".checkbox-icon").addEventListener("click", () => {
        updateStatus(id, isComplete)
    });

    task.querySelector(".edit-icon").addEventListener("click", () => {
        console.log(`Edit ID no.: ${id}`)
    });
    
    task.querySelector(".delete-icon").addEventListener("click", () => {
        deleteTask(id);
    });

    taskContainer.appendChild(task);
}

async function addTaskToDatabase(){
    let title = document.getElementById("task-title-input").value;
    let dueDate = document.getElementById("task-date-input").value;
    let dueTime = document.getElementById("task-time-input").value;
    let priority = document.getElementById("task-priority-input").value;

    const response = await fetch('/add-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate, dueTime, priority})
    });

    if (!response.ok) {
        console.error("Error:", data.error);
    } 
}

async function getTasksFromDatabase() {
    const response = await fetch('/fetch-tasks');
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", data.error);
        return null;
    } 

    return data;
}

async function deleteTask(taskId) {
    const res = await fetch(`/${taskId}/delete-task`, {method: "DELETE"});

    if (!res.ok) {
        console.error("Error:", data.error);
        
    }

    //   showToast(`Task "${task.title}" deleted`, task);

    await refreshTaskContainer();
}

async function updateStatus(id, isComplete) {
    const newStatus = !isComplete; // flip true/false

    let response = await fetch(`/${id}/toggle-done`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done_status: newStatus })
    });

    if (!response.ok) {
        console.error("Error:", data.error);
    } 

    await refreshTaskContainer()
}

async function getCollabFromDatabase() {
    const response = await fetch('/get-collabee');
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", data.error);
        return null;
    } 

    return data;
}

async function addCollabToDatabase() {
    let collabUsername = document.getElementById("collab-username-input").value;

    const response = await fetch('/add-collab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collabUsername })
    });

    let msg = document.getElementById("collab-error-msg");
    if (!response.ok) {
        console.error("Error:", data.error);
        msg.textContent = data.error;
    } else {
        msg.textContent = "Collab added successfully";
    }

    await refreshCollabContainer()
}

function addCollabToPage(username) {
    let collab = document.createElement("div");
    collab.className = "collab";

    collab.innerHTML = 
    `<p>${username}</p> <div><i class="fa-solid fa-trash button delete-icon"></i></div>`;
    
    collab.querySelector(".delete-icon").addEventListener("click", () => {
        removeCollab(username);
    });

    collabContainer.appendChild(collab);
}

async function removeCollab(username) {
    const res = await fetch(`/${username}/delete-collab`, {method: "DELETE"});

    if (!res.ok) {
        console.error("Error:", data.error);
        return
    }

    await refreshCollabContainer()
}

refreshPage()

