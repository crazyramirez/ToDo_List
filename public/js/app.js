// Event listener for adding a task when the add button is clicked
document.getElementById('addTaskButton').addEventListener('click', function() {
    const taskInput = document.getElementById('taskInput');
    const taskText = taskInput.value.trim();
    if (taskText !== '') {
        addTask(taskText, false, 0);  // Changed to add at the beginning
        taskInput.value = '';
        saveTasks();
        updateEmptyListMessage();
    } else {
        animateEmptyInput(taskInput);
    }
});

// Event listener for adding a task when Enter
document.getElementById('taskInput').addEventListener('keypress', function(event) {
    if (event.key === 'Enter' || event.key === 'OK') {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();
        if (taskText !== '') {
            addTask(taskText, false, 0);  // Changed to add at the beginning
            taskInput.value = '';
            saveTasks();
            updateEmptyListMessage();
        } else {
            animateEmptyInput(taskInput);
        }
    }
});

// Function to animate the input field when it's empty
function animateEmptyInput(input) {
    input.style.transition = 'transform 0.1s, box-shadow 0.1s';
    input.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.7)';
    
    setTimeout(() => {
        input.style.transform = 'translateX(5px)';
    }, 100);
    
    setTimeout(() => {
        input.style.transform = 'translateX(0)';
    }, 200);
    
    setTimeout(() => {
        input.style.boxShadow = 'none';
        input.style.transition = '';
    }, 1000);
}

// Function to add a new task to the list
function addTask(taskText, isCompleted = false, position = 0) {  // Changed default position to 0
    const taskList = document.getElementById('taskList');
    const taskItem = document.createElement('li');
    taskItem.draggable = true;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = isCompleted;
    checkbox.addEventListener('change', function() {
        // Animate checkbox
        this.style.transition = 'transform 0.2s ease';
        this.style.transform = 'scale(1.2)';
        setTimeout(() => {
            this.style.transform = 'scale(1)';
        }, 200);
        
        saveTasks();
    });

    const taskLabel = document.createElement('span');
    taskLabel.textContent = taskText;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = '-';
    deleteButton.addEventListener('click', function() {
        const dialog = document.createElement('dialog');
        dialog.innerHTML = `
            <p>¿Estás seguro de que quieres eliminar esta tarea?</p>
            <div class="buttons-container">
                <button id="cancelDelete">Cancelar</button>
                <button id="confirmDelete">Eliminar</button>
            </div>
        `;
        document.body.appendChild(dialog);
        dialog.showModal();

        dialog.querySelector('#confirmDelete').addEventListener('click', () => {
            dialog.close();
            taskItem.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            taskItem.style.transform = 'translateX(-100%)';
            taskItem.style.opacity = '0';
            setTimeout(() => {
                taskList.removeChild(taskItem);
                saveTasks();
                updateEmptyListMessage();
            }, 300);
        });

        dialog.querySelector('#cancelDelete').addEventListener('click', () => {
            dialog.close();
        });

        dialog.addEventListener('close', () => {
            document.body.removeChild(dialog);
        });
    });

    taskItem.appendChild(checkbox);
    taskItem.appendChild(taskLabel);
    taskItem.appendChild(deleteButton);
    
    if (position === 0) {
        taskList.insertBefore(taskItem, taskList.firstChild);
    } else if (position >= taskList.children.length) {
        taskList.appendChild(taskItem);
    } else {
        taskList.insertBefore(taskItem, taskList.children[position]);
    }

    setupDragAndDrop(taskItem);
    setupEditOnDoubleTap(taskItem, taskLabel);
    updateEmptyListMessage();

    setTimeout(() => {
        taskItem.style.animation = 'bounce 0.5s';
        taskItem.style.animationFillMode = 'forwards';
    }, 10);
}

// Function to set up drag and drop functionality for a task item
function setupDragAndDrop(taskItem) {
    let currentIndex;
    let isDragging = false;

    const startDragging = () => {
        isDragging = true;
        taskItem.style.transform = 'scale(1.05)';
        Array.from(taskItem.parentNode.children).forEach(child => {
            child.style.opacity = child === taskItem ? '1' : '0.5';
        });
    };

    const handleDragMove = (clientY) => {
        if (!isDragging) return;
        const taskList = taskItem.parentNode;
        const tasks = Array.from(taskList.children);
        const newIndex = tasks.findIndex(child => {
            const box = child.getBoundingClientRect();
            return clientY < box.top + box.height / 2;
        });
        if (newIndex !== -1 && newIndex !== currentIndex) {
            taskList.insertBefore(taskItem, tasks[newIndex] || null);
            currentIndex = newIndex;
        }
    };

    const endDragging = () => {
        if (!isDragging) return;
        isDragging = false;
        taskItem.style.transform = '';
        Array.from(taskItem.parentNode.children).forEach(child => {
            child.style.opacity = '1';
        });
        saveTasks();
        updateEmptyListMessage();
    };

    // Touch events
    taskItem.addEventListener('touchstart', (e) => {
        currentIndex = Array.from(taskItem.parentNode.children).indexOf(taskItem);
        setTimeout(startDragging, 300);
    }, { passive: true });
    taskItem.addEventListener('touchmove', (e) => {
        e.preventDefault();
        handleDragMove(e.touches[0].clientY);
    }, { passive: false });
    taskItem.addEventListener('touchend', endDragging);

    // Mouse events
    taskItem.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDragging();
    });
    document.addEventListener('mousemove', (e) => handleDragMove(e.clientY));
    document.addEventListener('mouseup', endDragging);
}

// Function to set up edit on double tap functionality for a task item
function setupEditOnDoubleTap(taskItem, taskLabel) {
    let lastTap = 0;
    const delay = 300; // milliseconds

    taskItem.addEventListener('click', function(event) {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < delay && tapLength > 0) {
            event.preventDefault();
            enterEditMode(taskItem, taskLabel);
        }
        lastTap = currentTime;
    });

    taskItem.addEventListener('dblclick', function(event) {
        event.preventDefault();
        enterEditMode(taskItem, taskLabel);
    });
}
// Function to enter edit mode for a task item
function enterEditMode(taskItem, taskLabel) {
    const currentText = taskLabel.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentText;
    taskLabel.style.visibility = 'hidden';
    taskItem.insertBefore(input, taskLabel);
    input.focus();
    input.style.width = '100%';
    taskLabel.style.display = 'none';
    
    const handleExit = function() {
        if (input.parentNode === taskItem) {
            exitEditMode(taskItem, taskLabel, input);
        }
    };

    input.addEventListener('blur', handleExit);

    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleExit();
        }
    });
}

// Function to exit edit mode for a task item
function exitEditMode(taskItem, taskLabel, input) {
    const newText = input.value.trim();
    if (newText !== '') {
        taskLabel.textContent = newText;
    }
    taskLabel.style.display = '';
    taskLabel.style.visibility = 'visible';
    if (input && input.parentNode === taskItem) {
        taskItem.removeChild(input);
    }
    saveTasks();
}

// Function to save tasks to local storage
function saveTasks() {
    const tasks = [];
    document.querySelectorAll('#taskList li').forEach((taskItem, index) => {
        const taskText = taskItem.querySelector('span').textContent;
        const isCompleted = taskItem.querySelector('input[type="checkbox"]').checked;
        tasks.push({ text: taskText, completed: isCompleted, position: index });
    });
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateEmptyListMessage();
}

// Function to load tasks from local storage
function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.sort((a, b) => a.position - b.position);
    tasks.forEach(task => addTask(task.text, task.completed, task.position));
    updateEmptyListMessage();
}

// Function to update the empty list message
function updateEmptyListMessage() {
    const taskList = document.getElementById('taskList');
    const emptyListMessage = document.getElementById('emptyListMessage');
    
    if (taskList.children.length === 0) {
        emptyListMessage.style.display = 'block';
    } else {
        emptyListMessage.style.display = 'none';
    }
}

// Load tasks when the page is loaded
document.addEventListener('DOMContentLoaded', loadTasks);