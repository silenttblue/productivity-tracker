// Get HTML elements
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const undoPopup = document.getElementById("undoPopup");
const undoBtn = document.getElementById("undoBtn");
const message = document.getElementById("message");
const appreciationPopup = document.getElementById("appreciationPopup");

let lastRemovedTask = null; // store last completed task temporarily
let undoTimeout;  // to cancel timer if undo is clicked
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
// Create an empty array to store tasks
//let tasks = []; ---> replace empty array initialization add localstorage to update tasks change to not lost tasks after refreshing page

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask() {
    const taskText = taskInput.value.trim(); //get wht user type remove xtra space
    if (taskText == "") return;  //if input box empty do nothing just return
    tasks.push({ text: taskText, completed: false, createdAt: new Date().toISOString() }); //add new element at end on array
    saveTasks();
    taskInput.value = ""; //clear box after add
    displayTasks(); //refresh screen
}


// whatever code inside this func will run for each element in the list or array
function createTaskElement(task, index) {
    const li = document.createElement("li"); // create new <li> element in HTML element in memory
    li.textContent = task.text; //  show task name inside bullet points  // set its text
    li.dataset.index = index;  //store its position in an array
    // Show completed tasks with the completed class
    if (task.completed) {
        li.classList.add("completed");
    }
    //removal after completion
    li.addEventListener("click", function () {
        if (li.classList.contains("completed")) return;
        // Don't do anything if already completed
        li.classList.add("completed");
        task.completed = true; // Mark the task as completed in the array
        saveTasks();
        lastRemovedTask = { text: task.text, index: index };
        undoPopup.style.display = "flex";

        undoTimeout = setTimeout(() => {
            tasks.splice(index, 1);
            saveTasks();
            displayTasks();
            undoPopup.style.display = "none";
            // Check for appreciation message AFTER removing the task
            checkAllTasksCompleted();
        }, 2500);
         // Check for appreciation message when task is marked completed
        checkAllTasksCompleted();
    });

    taskList.appendChild(li); // taskList is the big box ul, appendChild means putting task li inside the big box ul to make it appear on screen
}

function displayTasks() { //whenevr i call this func it will refresh the task list visible on screen
    taskList.innerHTML = "";  // here inner HTML represent content inside the <ul> "" <- this means clear old tasks from list before showing new one

    const today = new Date().toDateString();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toDateString();

    let todayTasks = [];
    let yesterdayTasks = [];  
    //separate tasks
    tasks.forEach(task => {
        const taskDate = new Date(task.createdAt).toDateString();
        if (taskDate === today) {
            todayTasks.push(task);
        } else if (taskDate === yesterday) {
            yesterdayTasks.push(task);
        }
    });
    // Show Today Section
    if (todayTasks.length > 0) {
        const todayHeading = document.createElement("h3");
        todayHeading.textContent = "Today";
        taskList.appendChild(todayHeading);
        todayTasks.forEach((task, index) => {
            createTaskElement(task, tasks.indexOf(task)); 
        });
    }
    // Show Yesterday Section
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
    clearTimeout(undoTimeout);  //stop timer
    if (lastRemovedTask) {
        tasks[lastRemovedTask.index].completed = false;
        saveTasks();
    }
    displayTasks();
    undoPopup.style.display = "none";
    appreciationPopup.style.display = "none"; // This hides the appreciation message
});

addTaskBtn.addEventListener("click", addTask);

taskInput.addEventListener("keydown", function (e) {
    // this func will check if a key is pressed inside the input box what key it is e is the event
    if (e.key == "Enter") {
        addTaskBtn.click(); // if event e is enter i.e enter key press then act like add task button is pressed
   
    }
});

displayTasks();*/
