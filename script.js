const taskInput = document.getElementById("taskInput");
const dueDateInput = document.getElementById("dueDateInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const undoPopup = document.getElementById("undoPopup");
const undoBtn = document.getElementById("undoBtn");
const message = document.getElementById("message");
const appreciationPopup = document.getElementById("appreciationPopup");

let lastRemovedTask = null;
let undoTimeout;
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText == "") return;
    const dueDate = dueDateInput.value;
    tasks.push({
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString(),
        dueDate: dueDate,
        priority: "medium"
    });
    saveTasks();
    taskInput.value = "";
    displayTasks();
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function createTaskElement(task, index) {
    const li = document.createElement("li");

    if (task.priority === "high") {
        li.classList.add("priority-high");
    } else if (task.priority === "medium") {
        li.classList.add("priority-medium");
    } else if (task.priority === "low") {
        li.classList.add("priority-low");
    }

    li.dataset.index = index;

    const taskTextSpan = document.createElement("span");
    taskTextSpan.textContent = task.text;
    li.appendChild(taskTextSpan);

    const menuBtn = document.createElement("button");
    menuBtn.textContent = "⋮";
    menuBtn.classList.add("menu-btn");

    const taskMenu = document.createElement("div");
    taskMenu.classList.add("task-menu");

    const editOption = document.createElement("button");
    editOption.textContent = "✏️ Edit";
    editOption.classList.add("task-menu-item");
    editOption.addEventListener("click", function(e) {
        e.stopPropagation();
        taskMenu.classList.remove("show");
        const input = document.createElement("input");
        input.type = "text";
        input.value = task.text;
        input.classList.add("edit-input");
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.classList.add("save-btn");
        taskTextSpan.replaceWith(input);
        input.insertAdjacentElement("afterend", saveBtn);
        input.focus();

        function saveEdit() {
            const newText = input.value.trim();
            if (newText === "") return;
            task.text = newText;
            tasks[index].text = newText;
            saveTasks();
            displayTasks();
        }

        saveBtn.addEventListener("click", function(e) {
            e.stopPropagation();
            saveEdit();
        });

        input.addEventListener("keydown", function(e) {
            if (e.key === "Enter") saveEdit();
            if (e.key === "Escape") displayTasks();
        });
    });

    const priorityLabel = document.createElement("button");
    priorityLabel.textContent = "🎯 Priority";
    priorityLabel.classList.add("task-menu-item");
    priorityLabel.style.cursor = "default";

    const priorityOptions = document.createElement("div");
    priorityOptions.classList.add("priority-options");

    ["🔴 High", "🟡 Medium", "🟢 Low"].forEach(function(label) {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.classList.add("priority-option");
        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            const val = label.includes("High") ? "high" : label.includes("Medium") ? "medium" : "low";
            task.priority = val;
            tasks[index].priority = val;
            saveTasks();
            displayTasks();
        });
        priorityOptions.appendChild(btn);
    });

    const deleteOption = document.createElement("button");
    deleteOption.textContent = "🗑️ Delete";
    deleteOption.classList.add("task-menu-item", "delete");
    deleteOption.addEventListener("click", function(e) {
        e.stopPropagation();
        tasks.splice(index, 1);
        saveTasks();
        displayTasks();
    });

    taskMenu.appendChild(editOption);
    taskMenu.appendChild(priorityLabel);
    taskMenu.appendChild(priorityOptions);
    taskMenu.appendChild(deleteOption);

    menuBtn.addEventListener("click", function(e) {
        e.stopPropagation();
        document.querySelectorAll(".task-menu.show").forEach(m => m.classList.remove("show"));
        taskMenu.classList.toggle("show");
    });

    li.appendChild(menuBtn);
    li.appendChild(taskMenu);

    if (task.dueDate) {
        const badge = document.createElement("span");
        badge.classList.add("due-badge");
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(task.dueDate);
        if (!task.completed && due < today) {
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

    li.addEventListener("click", function() {
        if (li.classList.contains("completed")) return;
        li.classList.add("completed");
        task.completed = true;
        saveTasks();
        lastRemovedTask = { text: task.text, index: index };
        undoPopup.style.display = "flex";
        undoTimeout = setTimeout(() => {
            tasks.splice(index, 1);
            saveTasks();
            displayTasks();
            undoPopup.style.display = "none";
            checkAllTasksCompleted();
        }, 2500);
        checkAllTasksCompleted();
    });

    taskList.appendChild(li);
}

function displayTasks() {
    taskList.innerHTML = "";
    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();
    let todayTasks = [];
    let yesterdayTasks = [];

    tasks.forEach(task => {
        const taskDate = new Date(task.createdAt).toDateString();
        if (taskDate === today) {
            todayTasks.push(task);
        } else if (taskDate === yesterday) {
            yesterdayTasks.push(task);
        }
    });

    if (todayTasks.length > 0) {
        const todayHeading = document.createElement("h3");
        todayHeading.textContent = "Today";
        taskList.appendChild(todayHeading);
        todayTasks.forEach((task) => {
            createTaskElement(task, tasks.indexOf(task));
        });
    }

    if (yesterdayTasks.length > 0) {
        const yesterdayHeading = document.createElement("h3");
        yesterdayHeading.textContent = "Yesterday";
        taskList.appendChild(yesterdayHeading);
        yesterdayTasks.forEach((task) => {
            createTaskElement(task, tasks.indexOf(task));
        });
    }

    checkAllTasksCompleted();
}

function checkAllTasksCompleted() {
    if (tasks.length > 0 && tasks.every(task => task.completed)) {
        appreciationPopup.style.display = "block";
        setTimeout(() => {
            appreciationPopup.style.display = "none";
        }, 4000);
    }
}

undoBtn.addEventListener("click", () => {
    clearTimeout(undoTimeout);
    if (lastRemovedTask) {
        tasks[lastRemovedTask.index].completed = false;
        saveTasks();
    }
    displayTasks();
    undoPopup.style.display = "none";
    appreciationPopup.style.display = "none";
});

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function(e) {
    if (e.key == "Enter") {
        addTaskBtn.click();
    }
});

document.addEventListener("click", function(e) {
    if (!e.target.closest(".task-menu") && !e.target.closest(".menu-btn")) {
        document.querySelectorAll(".task-menu.show").forEach(m => m.classList.remove("show"));
    }
});

displayTasks();
