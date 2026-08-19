if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");
const progressPercent = document.getElementById("progressPercent");
const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const darkModeBtn = document.getElementById("darkModeBtn");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const undoPopup = document.getElementById("undoPopup");
const undoBtn = document.getElementById("undoBtn");
const message = document.getElementById("message");
const appreciationPopup = document.getElementById("appreciationPopup");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const welcomePage = document.getElementById("welcomePage");
const todoPage = document.getElementById("todoPage");
const statsPage = document.getElementById("statsPage");
const nameInput = document.getElementById("nameInput");
const getStartedBtn = document.getElementById("getStartedBtn");
const statsBtn = document.getElementById("statsBtn");
const backBtn = document.getElementById("backBtn");

let currentFilter = "all";
let currentSort = "default";
let lastCompletedTask = null;
let undoTimeout;
let draggedTask = null;
let didDrag = false;
let appreciationTimeout;

function loadTasks() {
    try {
        const raw = localStorage.getItem("tasks");
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        return parsed.map(function (task) {
            return {
                text: task.text || "",
                completed: Boolean(task.completed),
                createdAt: task.createdAt || new Date().toISOString(),
                dueDate: task.dueDate || "",
                priority: task.priority === "high" || task.priority === "low" ? task.priority : "medium",
                completedAt: task.completedAt || null
            };
        });
    } catch (err) {
        return [];
    }
}

let tasks = loadTasks();

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function parseDueDate(dateString) {
    return new Date(dateString + "T00:00:00");
}

function formatDate(dateString) {
    return parseDueDate(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === "") {
        taskInput.classList.add("is-invalid");
        taskInput.focus();
        return;
    }

    taskInput.classList.remove("is-invalid");
    tasks.push({
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDateInput.value,
        priority: "medium",
        completedAt: null
    });
    saveTasks();
    taskInput.value = "";
    dueDateInput.value = "";
    displayTasks();
}

function createTaskElement(task) {
    const li = document.createElement("li");
    li.classList.add("task-item");
    addDragAndDrop(li, task);

    if (task.priority === "high") li.classList.add("priority-high");
    else if (task.priority === "medium") li.classList.add("priority-medium");
    else if (task.priority === "low") li.classList.add("priority-low");

    const taskTextSpan = document.createElement("span");
    taskTextSpan.classList.add("task-text");
    taskTextSpan.textContent = task.text;
    li.appendChild(taskTextSpan);

    const menuBtn = document.createElement("button");
    menuBtn.type = "button";
    menuBtn.textContent = "⋮";
    menuBtn.classList.add("menu-btn");
    menuBtn.setAttribute("aria-label", "Task options");

    const taskMenu = document.createElement("div");
    taskMenu.classList.add("task-menu");

    const editOption = document.createElement("button");
    editOption.type = "button";
    editOption.textContent = "✏️ Edit";
    editOption.classList.add("task-menu-item");

    editOption.addEventListener("click", function (e) {
        e.stopPropagation();
        taskMenu.classList.remove("show");
        startEdit(li, taskTextSpan, task);
    });

    const priorityLabel = document.createElement("div");
    priorityLabel.textContent = "🎯 Priority";
    priorityLabel.classList.add("task-menu-item", "priority-label");

    const priorityOptions = document.createElement("div");
    priorityOptions.classList.add("priority-options");

    [
        { label: "🔴 High", value: "high" },
        { label: "🟡 Medium", value: "medium" },
        { label: "🟢 Low", value: "low" }
    ].forEach(function (option) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = option.label;
        btn.classList.add("priority-option");
        if (task.priority === option.value) btn.classList.add("selected");
        btn.addEventListener("click", function (e) {
            e.stopPropagation();
            task.priority = option.value;
            saveTasks();
            displayTasks();
        });
        priorityOptions.appendChild(btn);
    });

    const deleteOption = document.createElement("button");
    deleteOption.type = "button";
    deleteOption.textContent = "🗑️ Delete";
    deleteOption.classList.add("task-menu-item", "delete");
    deleteOption.addEventListener("click", function (e) {
        e.stopPropagation();
        const index = tasks.indexOf(task);
        if (index === -1) return;
        if (lastCompletedTask === task) {
            clearTimeout(undoTimeout);
            lastCompletedTask = null;
            undoPopup.style.display = "none";
        }
        tasks.splice(index, 1);
        saveTasks();
        displayTasks();
    });

    taskMenu.appendChild(editOption);
    taskMenu.appendChild(priorityLabel);
    taskMenu.appendChild(priorityOptions);
    taskMenu.appendChild(deleteOption);

    menuBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        document.querySelectorAll(".task-menu.show").forEach(function (m) {
            if (m !== taskMenu) m.classList.remove("show");
        });
        taskMenu.classList.toggle("show");
    });

    li.appendChild(menuBtn);
    li.appendChild(taskMenu);

    if (task.dueDate) {
        const badge = document.createElement("span");
        badge.classList.add("due-badge");
        const due = parseDueDate(task.dueDate);

        if (!task.completed && due < startOfToday()) {
            badge.classList.add("overdue");
            badge.textContent = "⚠️ Overdue: " + formatDate(task.dueDate);
        } else {
            badge.textContent = "📅 " + formatDate(task.dueDate);
        }
        li.appendChild(badge);
    }

    if (task.completed) {
        li.classList.add("completed");
    }

    li.addEventListener("click", function (e) {
        if (didDrag) return;
        if (e.target.closest(".menu-btn, .task-menu, .edit-input, .save-btn")) return;
        if (li.querySelector(".edit-input")) return;
        toggleTaskCompletion(task);
    });

    taskList.appendChild(li);
}

function startEdit(li, taskTextSpan, task) {
    const input = document.createElement("input");
    input.type = "text";
    input.value = task.text;
    input.classList.add("edit-input");
    input.maxLength = 200;

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.textContent = "Save";
    saveBtn.classList.add("save-btn");

    taskTextSpan.replaceWith(input);
    input.insertAdjacentElement("afterend", saveBtn);
    input.focus();
    input.select();

    function saveEdit() {
        const newText = input.value.trim();
        if (newText === "") {
            input.classList.add("is-invalid");
            input.focus();
            return;
        }
        task.text = newText;
        saveTasks();
        displayTasks();
    }

    saveBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        saveEdit();
    });

    input.addEventListener("click", function (e) {
        e.stopPropagation();
    });

    input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") displayTasks();
    });
}

function toggleTaskCompletion(task) {
    if (task.completed) {
        task.completed = false;
        task.completedAt = null;
        saveTasks();
        displayTasks();
        return;
    }

    task.completed = true;
    task.completedAt = new Date().toISOString();
    saveTasks();
    lastCompletedTask = task;
    undoPopup.style.display = "flex";

    clearTimeout(undoTimeout);
    undoTimeout = setTimeout(function () {
        undoPopup.style.display = "none";
        lastCompletedTask = null;
    }, 2500);

    displayTasks();
    checkAllTasksCompleted();
}

function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(function (task) { return task.completed; }).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressFill.style.width = percentage + "%";
    progressFill.classList.toggle("is-empty", percentage === 0);
    progressText.textContent = completed + " of " + total + " tasks done";
    progressPercent.textContent = percentage + "%";
}

function addDragAndDrop(li, task) {
    li.draggable = true;

    li.addEventListener("dragstart", function (e) {
        if (e.target.closest(".menu-btn, .task-menu, .edit-input, .save-btn")) {
            e.preventDefault();
            return;
        }
        didDrag = true;
        li.classList.add("dragging");
        draggedTask = task;
    });

    li.addEventListener("dragend", function () {
        li.classList.remove("dragging");
        document.querySelectorAll(".task-item").forEach(function (el) {
            el.classList.remove("drag-over");
        });
        draggedTask = null;
        setTimeout(function () { didDrag = false; }, 0);
    });

    li.addEventListener("dragover", function (e) {
        e.preventDefault();
        document.querySelectorAll(".task-item").forEach(function (el) {
            el.classList.remove("drag-over");
        });
        if (draggedTask !== task) li.classList.add("drag-over");
    });

    li.addEventListener("drop", function (e) {
        e.preventDefault();
        li.classList.remove("drag-over");
        if (!draggedTask || draggedTask === task) return;

        didDrag = true;
        const oldIndex = tasks.indexOf(draggedTask);
        const newIndex = tasks.indexOf(task);
        if (oldIndex === -1 || newIndex === -1) return;

        tasks.splice(oldIndex, 1);
        tasks.splice(newIndex, 0, draggedTask);
        saveTasks();
        displayTasks();
    });
}

function getFilteredAndSortedTasks() {
    let result = tasks.slice();

    if (currentFilter === "completed") {
        result = result.filter(function (task) { return task.completed; });
    } else if (currentFilter === "high" || currentFilter === "medium" || currentFilter === "low") {
        result = result.filter(function (task) { return task.priority === currentFilter; });
    }

    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        result = result.filter(function (task) {
            return task.text.toLowerCase().includes(query);
        });
    }

    if (currentSort === "priority") {
        const order = { high: 1, medium: 2, low: 3 };
        result.sort(function (a, b) {
            return (order[a.priority] || 99) - (order[b.priority] || 99);
        });
    } else if (currentSort === "dueDate") {
        result.sort(function (a, b) {
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return parseDueDate(a.dueDate) - parseDueDate(b.dueDate);
        });
    }

    return result;
}

function appendSection(title, sectionTasks) {
    if (sectionTasks.length === 0) return;
    const heading = document.createElement("h3");
    heading.textContent = title;
    taskList.appendChild(heading);
    sectionTasks.forEach(function (task) {
        createTaskElement(task);
    });
}

function showEmptyState(text) {
    message.textContent = text;
    message.classList.add("visible");
}

function hideEmptyState() {
    message.textContent = "";
    message.classList.remove("visible");
}

function displayTasks() {
    taskList.innerHTML = "";
    hideEmptyState();

    const filtered = getFilteredAndSortedTasks();

    if (tasks.length === 0) {
        showEmptyState("No tasks yet. Add one to get started.");
        updateProgress();
        return;
    }

    if (filtered.length === 0) {
        const query = searchInput.value.trim();
        if (query) showEmptyState("No tasks match your search.");
        else showEmptyState("No tasks in this filter.");
        updateProgress();
        return;
    }

    if (currentSort !== "default") {
        filtered.forEach(function (task) {
            createTaskElement(task);
        });
        updateProgress();
        return;
    }

    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    const todayTasks = [];
    const yesterdayTasks = [];
    const earlierTasks = [];

    filtered.forEach(function (task) {
        const taskDate = new Date(task.createdAt).toDateString();
        if (taskDate === today) todayTasks.push(task);
        else if (taskDate === yesterday) yesterdayTasks.push(task);
        else earlierTasks.push(task);
    });

    appendSection("Today", todayTasks);
    appendSection("Yesterday", yesterdayTasks);
    appendSection("Earlier", earlierTasks);
    updateProgress();
}

function checkAllTasksCompleted() {
    if (tasks.length === 0 || !tasks.every(function (task) { return task.completed; })) {
        return;
    }
    appreciationPopup.hidden = false;
    appreciationPopup.style.display = "block";
    clearTimeout(appreciationTimeout);
    appreciationTimeout = setTimeout(function () {
        appreciationPopup.style.display = "none";
        appreciationPopup.hidden = true;
    }, 4000);
}

function syncDarkModeButton() {
    darkModeBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️ Light" : "🌙 Dark";
}

function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
    } else {
        localStorage.removeItem("darkMode");
    }
    syncDarkModeButton();
}

function showPage(page) {
    welcomePage.hidden = page !== "welcome";
    todoPage.hidden = page !== "todo";
    statsPage.hidden = page !== "stats";
}

function greetUser(name) {
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    if (hour >= 17) greeting = "Good evening";
    document.querySelector("#todoPage h1").textContent = greeting + ", " + name + "!";
}

function isSameDay(dateValue, day) {
    if (!dateValue) return false;
    return new Date(dateValue).toDateString() === day;
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(function (task) { return task.completed; }).length;
    const rate = total === 0 ? 0 : Math.round((completed / total) * 100);
    const today = new Date().toDateString();
    const todayCompleted = tasks.filter(function (task) {
        if (!task.completed) return false;
        if (task.completedAt) return isSameDay(task.completedAt, today);
        return isSameDay(task.createdAt, today);
    }).length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statCompleted").textContent = completed;
    document.getElementById("statRate").textContent = rate + "%";
    document.getElementById("statToday").textContent = todayCompleted;
}

function initApp() {
    syncDarkModeButton();
    const savedName = localStorage.getItem("userName");
    if (savedName) {
        showPage("todo");
        greetUser(savedName);
        displayTasks();
    } else {
        showPage("welcome");
    }
}

undoBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    clearTimeout(undoTimeout);
    if (lastCompletedTask && tasks.indexOf(lastCompletedTask) !== -1) {
        lastCompletedTask.completed = false;
        lastCompletedTask.completedAt = null;
        saveTasks();
    }
    lastCompletedTask = null;
    displayTasks();
    undoPopup.style.display = "none";
    appreciationPopup.style.display = "none";
    appreciationPopup.hidden = true;
});

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("input", function () {
    taskInput.classList.remove("is-invalid");
});

taskInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTask();
});

document.addEventListener("click", function (e) {
    if (!e.target.closest(".task-menu") && !e.target.closest(".menu-btn")) {
        document.querySelectorAll(".task-menu.show").forEach(function (m) {
            m.classList.remove("show");
        });
    }
});

searchInput.addEventListener("input", displayTasks);
darkModeBtn.addEventListener("click", toggleDarkMode);

document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
        document.querySelectorAll(".filter-btn").forEach(function (b) {
            b.classList.remove("active");
        });
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        displayTasks();
    });
});

sortSelect.addEventListener("change", function () {
    currentSort = sortSelect.value;
    displayTasks();
});

getStartedBtn.addEventListener("click", function () {
    const name = nameInput.value.trim();
    if (name === "") {
        nameInput.classList.add("is-invalid");
        nameInput.focus();
        return;
    }
    localStorage.setItem("userName", name);
    showPage("todo");
    greetUser(name);
    displayTasks();
});

nameInput.addEventListener("input", function () {
    nameInput.classList.remove("is-invalid");
});

nameInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") getStartedBtn.click();
});

statsBtn.addEventListener("click", function () {
    updateStats();
    showPage("stats");
});

backBtn.addEventListener("click", function () {
    showPage("todo");
});

initApp();
