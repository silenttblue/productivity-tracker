// Get HTML elements
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const undoPopup = document.getElementById("undoPopup");
const undoBtn = document.getElementById("undoBtn");
const message = document.getElementById("message");
const appreciationPopup = document.getElementById("appreciationPopup");

let lastRemovedTask = null; // store last completed task temporarily
let undoTimeout; // to cancel timer if undo is clicked


// Create an empty array to store tasks
let tasks = [];

function addTask(){
    const taskText = taskInput.value.trim();               //get wht user type remove xtra space
    if(taskText == "") return;                            //if input box empty do nothing just return
        tasks.push({text: taskText, completed: false});  //add new element at end on array
        taskInput.value = "";                           //clear box after add
        displayTasks();                                //refresh screen
}

function displayTasks() { //whenevr i call this func it will refresh the task list visible on screen
  taskList.innerHTML = ""; // here inner HTML represent content inside the <ul> "" <- this means clear old tasks from list before showing new one

  tasks.forEach((task,index)=> { //whatever code inside this func will run for each element in the list or array
    const li = document.createElement("li"); // create new <li> element in HTML element in memory
    li.textContent = task.text;      //  show task name inside bullet points           // set its text
    li.dataset.index = index; //store its position in anarray

    // Show completed tasks with the completed class
    if (task.completed) {
        li.classList.add("completed");
    }
    
    //removal after completion
    li.addEventListener("click", function(){
       if (li.classList.contains("completed")) return; // Don't do anything if already completed
       
       li.classList.add("completed");
       task.completed = true; // Mark the task as completed in the array
       lastRemovedTask = { text: task.text, index: index};
       undoPopup.style.display = "flex";

       undoTimeout = setTimeout(() => {
        tasks.splice(index, 1);
        displayTasks();
        undoPopup.style.display = "none";

        // Check for appreciation message AFTER removing the task
        checkAllTasksCompleted();
        
       }, 2500);

       // Check for appreciation message when task is marked completed
       checkAllTasksCompleted();
    });
    taskList.appendChild(li);//taskList.appendChild(li)
});
    taskInput.value = "";// taskList is the big box ul appendchild means putting task li inside the big box ul to make it appear on screen  // add it to <ul>
    
    // Also check when displaying tasks
    checkAllTasksCompleted();
}

function checkAllTasksCompleted() {
    console.log("Checking:", tasks);
    
    if (tasks.length > 0 && tasks.every(task => task.completed)) {
        console.log("SHOWING MESSAGE NOW!");
        // Show appreciation popup like undo popup
        appreciationPopup.style.display = "block";
        
        setTimeout(() => {
            appreciationPopup.style.display = "none";
        }, 4000);
    }
}

undoBtn.addEventListener("click", () => {
    clearTimeout(undoTimeout); //stop timer
    if(lastRemovedTask){
        tasks[lastRemovedTask.index].completed=false;
    }
    displayTasks();
    undoPopup.style.display="none";
    appreciationPopup.style.display = "none"; // This hides the appreciation message
});

addTaskBtn.addEventListener("click", addTask);
taskInput.addEventListener("keydown", function(e){ // this func will check if a key is pressed inside the input box what key it is e is the event
    if(e.key == "Enter"){
        addTaskBtn.click(); // if event e is eneter i.e enter key press then act like add task button is pressed
    }
});