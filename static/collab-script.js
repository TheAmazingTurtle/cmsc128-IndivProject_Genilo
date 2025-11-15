const addTaskButtonToggle = document.getElementById("add-task-button");
const cancelFormButton = document.getElementById("cancel-new-task-button");
const taskContainer = document.getElementById("scrollable-task-box");
const submitTaskButton = document.getElementById("submit-new-task-button");
const collabSelect = document.getElementById("collab-select")

collabSelect.addEventListener("change", async () => await refreshTaskContainer())

addTaskButtonToggle.addEventListener("click", toggleForm)
cancelFormButton.addEventListener("click", toggleForm)

submitTaskButton.addEventListener("click", async () => {
    await addTaskToDatabase();
    document.getElementById("add-task-form").reset();
    await refreshTaskContainer();
})

function toggleForm() {
    const form = document.getElementById("add-task-form");
    form.reset();
    form.classList.toggle('hidden');
}

async function refreshPage() {
    await refreshCollabOption()
    await refreshTaskContainer()
}

async function refreshCollabOption() {
    let collabs = await getCollabFromDatabase()

    collabSelect.innerHTML = '<option value="" disabled selected hidden>Select a collab</option>';
    if (collabs.length == 0) {
        // const noTaskMsg = document.createElement("div");
        // noTaskMsg.id = "no-task-screen"
        // noTaskMsg.innerHTML = `<p>Your to-do list is empty</p> <p>Nice work!</p>`

        // taskContainer.appendChild(noTaskMsg);
        // return
    } else {
        collabs.forEach(collab => addCollabOption(collab.username));
    }
}

function addCollabOption(username) {
    let collab = document.createElement("option");

    collab.value = username;
    collab.textContent = username;

    collabSelect.appendChild(collab);
}

async function refreshTaskContainer() {
    let data = await getTasksFromDatabase()

    taskContainer.innerHTML = '';
    if (!data) {
        const noTaskMsg = document.createElement("div");
        noTaskMsg.id = "no-task-screen"
        noTaskMsg.innerHTML = `<p>Your to-do list is empty</p> <p>Nice work!</p>`

        taskContainer.appendChild(noTaskMsg);
        return
    } else {
        console.log(data)

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
    let collabUsername = collabSelect.value;

    if (collabUsername == "") return

    let title = document.getElementById("task-title-input").value;
    let dueDate = document.getElementById("task-date-input").value;
    let dueTime = document.getElementById("task-time-input").value;
    let priority = document.getElementById("task-priority-input").value;

    const response = await fetch(`/${collabUsername}/add-collab-task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, dueDate, dueTime, priority})
    });

    if (!response.ok) {
        console.error("Error:", data.error);
    } 
}

async function getTasksFromDatabase() {
    let collabUsername = collabSelect.value;
    console.log(collabUsername)

    if (collabUsername == "") return null

    const response = await fetch(`/${collabUsername}/fetch-collab-tasks`);
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

    refreshTaskContainer();
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

    refreshTaskContainer()
}

async function getCollabFromDatabase() {
    const response = await fetch('/get-collab');
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", data.error);
        return null;
    } 

    return data;
}

refreshPage()

