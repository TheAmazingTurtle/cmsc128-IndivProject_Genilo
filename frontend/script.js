const dueTimeInput = document.getElementById("due-time-input")
const titleInput = document.getElementById("title-input");
const submitBtn = document.getElementById("submit-btn");
const formModal = document.getElementById("modal-add-task-form");
const openBtn = document.getElementById("add-task-button");
const closeFormBtn = document.getElementById("close-btn");

let lastDeletedTask = null;
let toastTimer = null;
let currentSort = "date_added";
let taskToDelete;

document.getElementById("add-task-form").addEventListener("submit", function(event) {
  event.preventDefault();
  addTodo();
});

document.getElementById("edit-task-form").addEventListener("submit", function(event) {
  event.preventDefault();
  document.getElementById("modal-edit-task-form").style.display = "none";
  saveTask();
});

document.getElementById("edit-title-input").addEventListener("input", () => {
  checkEditTitle();
})

document.getElementById("sortSelect").addEventListener("change", (e) => {
  currentSort = e.target.value;
  fetchTodos();
});

function sortTasks(tasks) {
  return tasks.sort((a, b) => {
    if (currentSort === "date_added") {
      const dateA = a.date_and_time_added ? new Date(a.date_and_time_added) : new Date(0);
      const dateB = b.date_and_time_added ? new Date(b.date_and_time_added) : new Date(0);
      return dateA - dateB;
    }
    if (currentSort === "due_date") {
      const dateA = a.due_date ? new Date(a.due_date + (a.due_time ? "T" + a.due_time : "")) : null;
      const dateB = b.due_date ? new Date(b.due_date + (b.due_time ? "T" + b.due_time : "")) : null;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      return dateB - dateA;
    }
    if (currentSort === "priority") {
      const rank = { High: 3, Medium: 2, Low: 1 };
      return (rank[a.priority] || 99) - (rank[b.priority] || 99);
    }
    return 0;
  });
}

async function fetchTodos() {
  const res = await fetch("http://127.0.0.1:5000/todo_list");
  let tasks = await res.json();

  if (tasks.length == 0){
    document.getElementById("space-buffer").style.display = "none";
    document.getElementById("modal-add-task").style.display = "flex";
    document.getElementById("add-task-button").style.display = "none";
    return
  }
  else {
    document.getElementById("space-buffer").style.display = "flex";
    document.getElementById("modal-add-task").style.display = "none";
    document.getElementById("add-task-button").style.display = "flex";
  }

  tasks = sortTasks(tasks);
  
  const container = document.getElementById("task-inner-container");
  container.innerHTML = "";

  tasks.forEach(task => {
    const taskDiv = document.createElement("div");
    const dueLabel = formatDueDate(task.due_date, task.due_time);
    taskDiv.className = "tasks";

    taskDiv.innerHTML = `
      <div id="task-${task.task_id}">
    `
      + (!task.done_status ? `<i class="far fa-square task-icon checkbox-icon" title="Mark as Done"></i>` : `<i class="far fa-check-square task-icon checkbox-icon" title="Mark as Undone"></i>`) +
    `
      </div>
      
      <div class="task-content`+ (task.done_status ? " completed-task" : "") +`">
        <h2>${task.title}</h2>
    `
      + (task.description ? `<p class="description">${task.description}</p>` : "") + (task.done_status ? `` : `<p class="due-msg">${dueLabel}</p>`) +
    `
      </div>
      
      <i class="fas fa-trash task-icon delete-icon" title="Delete"></i>
    `;

    taskDiv.querySelector(".checkbox-icon").addEventListener("click", () => {
      toggleDoneStatus(task);
    });
    
    taskDiv.querySelector(".delete-icon").addEventListener("click", () => {
      taskToDelete = task.task_id
      document.getElementById("delete-modal-text").textContent = `Are you sure you want to delete \{${task.title}\} task?`;
      document.getElementById("delete-confirm-modal").style.display = "flex";
    });

    taskDiv.querySelector(".task-content").addEventListener("click", () => {
      showTaskModal(task);
    });

    container.appendChild(taskDiv);
  });
}

async function addTodo() {
  let title = document.getElementById("title-input").value;
  let description = document.getElementById("description-input").value;
  let dueDate = document.getElementById("due-date-input").value;
  let dueTime = document.getElementById("due-time-input").value;
  let priority = document.getElementById("priority-input").value;

  
  await fetch("http://127.0.0.1:5000/todo_list", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      title,
      description,
      dueDate,
      dueTime,
      priority})
  });
  
  fetchTodos();
  resetAddTaskForm();
  formModal.style.display = "none";
}

async function deleteTask(taskId) {
  const task = (await (await fetch("http://127.0.0.1:5000/todo_list")).json())
    .find(t => t.task_id === taskId);

  const res = await fetch(`http://127.0.0.1:5000/todo_list/${taskId}`, {
    method: "DELETE"
  });

  if (res.ok) {
    fetchTodos();
    showToast(`Task "${task.title}" deleted`, task);
  }
}

async function editTask(task) {
  document.getElementById("modal-edit-task-form").style.display = "flex";
  document.getElementById("edit-btn").disabled = false;
  document.getElementById("edit-task-id").value = task.task_id;
  document.getElementById("edit-title-input").value = task.title;
  document.getElementById("edit-description-input").value = task.description || "";
  document.getElementById("edit-priority-input").value = task.priority;
  document.getElementById("edit-due-date-input").value = task.due_date;
  document.getElementById("edit-due-time-input").value = task.due_time;
}

async function saveTask() {
  let task_id = document.getElementById("edit-task-id").value;
  let title = document.getElementById("edit-title-input").value;
  let description = document.getElementById("edit-description-input").value;
  let dueDate = document.getElementById("edit-due-date-input").value;
  let dueTime = document.getElementById("edit-due-time-input").value;
  let priority = document.getElementById("edit-priority-input").value;

  if (!title) return;

  await fetch(`http://127.0.0.1:5000/todo_list/${task_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, dueDate, dueTime, priority })
  });

  currentEditTaskId = null;
  fetchTodos();
}

async function toggleDoneStatus(task) {
  const newStatus = !task.done_status; // flip true/false

  await fetch(`http://127.0.0.1:5000/todo_list/${task.task_id}/done`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ done_status: newStatus })
  });

  fetchTodos(); // refresh the task list
}

function resetAddTaskForm() {
  document.getElementById("title-input").value = "";
  document.getElementById("description-input").value = "";
  document.getElementById("priority-input").value = "mid";
  document.getElementById("due-date-input").value = "";
  document.getElementById("due-time-input").value = "";
}

function formatDueDate(dueDate, dueTime) {
  if (!dueDate) return "No due date";

  let dueString = dueDate;
  if (dueTime) {
    dueString += "T" + dueTime;
  }

  const due = new Date(dueString);
  const now = new Date();

  const diffMs = due - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMs >= 0) {
    if (diffMinutes < 60) return "Due within an hour";
    if (diffHours < 24) return `Due in ${diffHours} hour${diffHours > 1 ? "s" : ""}`;
    if (diffDays === 0) return "Due Today";
    if (diffDays === 1) return "Due Tomorrow";

    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears >= 1) return `Due in ${diffYears} year${diffYears > 1 ? "s" : ""}`;
    if (diffMonths >= 1) return `Due in ${diffMonths} month${diffMonths > 1 ? "s" : ""}`;
    return `Due in ${diffDays} days`;
  } else {
    // already late
    const lateDays = Math.abs(diffDays);
    if (lateDays === 0) return "Due earlier today";
    if (lateDays === 1) return "1 day late";

    const lateMonths = Math.floor(lateDays / 30);
    const lateYears = Math.floor(lateDays / 365);

    if (lateYears >= 1) return `${lateYears} year${lateYears > 1 ? "s" : ""} late`;
    if (lateMonths >= 1) return `${lateMonths} month${lateMonths > 1 ? "s" : ""} late`;
    return `${lateDays} days late`;
  }
}

function checkEditTitle(){
  if (document.getElementById("edit-title-input").value == ""){
    document.getElementById("edit-btn").disabled = true;

  }
  else {
    document.getElementById("edit-btn").disabled = false;
  }
}


fetchTodos();


























titleInput.addEventListener("input", function()  {
  if (titleInput.value.trim() === "") {
    submitBtn.disabled = true;
  } else {
    submitBtn.disabled = false;
  }
});

dueTimeInput.addEventListener("input", function () {               // if time has value, but date is null, set date to today
  let dueDateInput = document.getElementById("due-date-input");

  if (!dueDateInput.value && this.value) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dueDateInput.value = `${year}-${month}-${day}`; // YYYY-MM-DD (local)
  }
});

openBtn.addEventListener("click", () => {
  formModal.style.display = "flex";
});

closeFormBtn.addEventListener("click", () => {
  formModal.style.display = "none";
  resetAddTaskForm();
});

window.addEventListener("click", (e) => {
  if (e.target === formModal) {
    formModal.style.display = "none";
    resetAddTaskForm();
  }
});


function showTaskModal(task) {
  document.getElementById("modal-title").innerText = task.title;
  document.getElementById("modal-description").innerText = task.description || "No description";
  
  document.getElementById("modal-due").innerText = getDueDetails(task.due_date, task.due_time);
  
  document.getElementById("modal-priority").innerText = "Priority: " + task.priority[0].toUpperCase() + task.priority.slice(1);

  document.getElementById("modal-added").innerText = getDateAndTimeAddedDetails(task.date_and_time_added);
  document.getElementById("modal-view-task-detail").style.display = "flex";

  document.getElementById("edit-task-btn").addEventListener("click", () => {
    document.getElementById("modal-view-task-detail").style.display = "none";
    editTask(task);
  });

  document.getElementById("delete-task-btn").addEventListener("click", () => {
    document.getElementById("modal-view-task-detail").style.display = "none";
    document.getElementById("delete-modal-text").textContent = `Are you sure you want to delete \{${task.title}\} task?`;
    taskToDelete = task.task_id;
    document.getElementById("delete-confirm-modal").style.display = "flex";
  });
}

function getDueDetails(due_date, due_time) {
  if (due_date) {
    let dueString = due_date;
    if (due_time) {
      dueString += "T" + due_time;
    }

    const due = new Date(dueString);
    let options = {
      year: "numeric",
      month: "long",
      day: "2-digit"
    };

    if (due_time) {
      options.hour = "2-digit";
      options.minute = "2-digit";
      options.hour12 = true;
    }

    const formattedDue = due.toLocaleString("en-US", options);
    return "Due on " + formattedDue;
  } else {
    return "No due date";
  }
}

function getDateAndTimeAddedDetails(date_and_time_added) {
  if (date_and_time_added) {
    const added = new Date(date_and_time_added);
    const addedFormatted = added.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    return "Added: " + addedFormatted;
  } else {
    return "Added: Unknown";
  }
}

document.getElementById("close-details-btn").onclick = function() {
  document.getElementById("modal-view-task-detail").style.display = "none";
};

window.onclick = function(event) {
  const modal = document.getElementById("modal-view-task-detail");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

document.getElementById("close-edit-btn").onclick = function() {
  document.getElementById("modal-edit-task-form").style.display = "none";
};

window.onclick = function(event) {
  const modal = document.getElementById("modal-edit-task-form");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

document.getElementById("close-delete-modal").onclick = function() {
  document.getElementById("delete-confirm-modal").style.display = "none";
};

document.getElementById("cancel-delete-btn").onclick = function() {
  document.getElementById("delete-confirm-modal").style.display = "none";
};

document.getElementById("confirm-delete-btn").onclick = function() {
  deleteTask(taskToDelete);
  taskToDelete = ""
  document.getElementById("delete-confirm-modal").style.display = "none";
};

window.onclick = function(event) {
  const modal = document.getElementById("delete-confirm-modal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};









































function showToast(message, task) {
  const toast = document.getElementById("toast");

  toast.innerHTML = `
    <span>${message}</span>
    <button id="undoBtn">Undo</button>
  `;

  toast.className = "toast show";
  lastDeletedTask = task;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
    lastDeletedTask = null;
  }, 5000);

  document.getElementById("undoBtn").onclick = () => {
    undoDelete();
    toast.className = "toast";
    clearTimeout(toastTimer);
  };
}

async function undoDelete() {
  if (!lastDeletedTask) return;

  await fetch("http://127.0.0.1:5000/todo_list", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(lastDeletedTask)
  });

  fetchTodos();
  lastDeletedTask = null;
}






















