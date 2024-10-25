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
    let touchStartY;
    let currentIndex;
    let longPressTimer;
    let isDragging = false;

    taskItem.addEventListener('touchstart', function(e) {
        touchStartY = e.touches[0].clientY;
        currentIndex = Array.from(taskItem.parentNode.children).indexOf(taskItem);
        
        longPressTimer = setTimeout(() => {
            isDragging = true;
            taskItem.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            taskItem.style.transform = 'scale(1.05)';
            
            // Set opacity for non-selected items
            const taskList = taskItem.parentNode;
            Array.from(taskList.children).forEach(item => {
                if (item !== taskItem) {
                    item.style.transition = 'opacity 0.2s ease';
                    item.style.opacity = '0.5';
                }
            });
        }, 300);
    }, { passive: false });

    taskItem.addEventListener('touchmove', function(e) {
        e.preventDefault();
        clearTimeout(longPressTimer);

        if (!isDragging) return;

        const touchY = e.touches[0].clientY;
        const diff = touchY - touchStartY;
        // taskItem.style.transform = `scale(1.05) translateY(${diff}px)`;

        const taskList = taskItem.parentNode;
        const tasks = Array.from(taskList.children);
        const newIndex = tasks.reduce((closest, child, index) => {
            const box = child.getBoundingClientRect();
            const offset = touchY - box.top - box.height / 4;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, index: index };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).index;

        if (newIndex !== currentIndex) {
            taskList.insertBefore(taskItem, tasks[newIndex]);
            currentIndex = newIndex;
        }
    }, { passive: false });

    taskItem.addEventListener('touchend', function() {
        clearTimeout(longPressTimer);
        if (isDragging) {
            taskItem.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
            taskItem.style.transform = 'scale(1)';
            
            // Reset opacity for all items
            const taskList = taskItem.parentNode;
            Array.from(taskList.children).forEach(item => {
                item.style.transition = 'opacity 0.2s ease';
                item.style.opacity = '1';
            });
            
            setTimeout(() => {
                taskItem.style.transition = '';
                taskItem.style.transform = '';
                Array.from(taskList.children).forEach(item => {
                    item.style.transition = '';
                });
            }, 200);
            saveTasks();
            updateEmptyListMessage();
        }
        isDragging = false;
    });
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
    
    input.addEventListener('blur', function() {
        exitEditMode(taskItem, taskLabel, input);
    });

    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            exitEditMode(taskItem, taskLabel, input);
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
    taskItem.removeChild(input);
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