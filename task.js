/**
 * ScholarSync Tasks Engine Implementation Architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Node Object Hook Pointer Selectors
    const taskModal = document.getElementById('taskModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const taskForm = document.getElementById('taskForm');
    const tasksGrid = document.getElementById('tasksGrid');
    const taskDeadlineInput = document.getElementById('taskDeadline');
    const modalTitle = taskModal.querySelector('h3');

    // State Storage Logic: Initialize Task Array Mapping Array Structure
    let tasksCollection = JSON.parse(localStorage.getItem('scholarsync_tasks_db')) || [];
    
    // Tracking pointer variables for operational editing mode states
    let currentEditTaskId = null; 

    // Core Lifecycles Engine Initial Bootstrap execution
    renderUIElements();
    restrictPastDates();

    /* --- Validation Restriction Logic Engine --- */
    function restrictPastDates() {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Month index validation adjustment offset
        let dd = today.getDate();

        // Zero-padding string conversion format compliance checking
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;

        const formattedTodayString = `${yyyy}-${mm}-${dd}`;
        
        // Block calendar selection interaction rules for historical time records
        taskDeadlineInput.setAttribute('min', formattedTodayString);
    }

    /* --- Interactive Modal Interface Window Controllers --- */
    openModalBtn.addEventListener('click', () => {
        currentEditTaskId = null; // Clear pointer context (means we are building a new task)
        modalTitle.innerText = "Create New Task";
        restrictPastDates();
        
        // Provide standard baseline default choices
        document.getElementById('prio-high').checked = true; 
        taskModal.classList.add('is-active');
        document.getElementById('taskName').focus();
    });

    const triggerModalClosure = () => {
        taskModal.classList.remove('is-active');
        taskForm.reset();
        currentEditTaskId = null;
    };

    closeModalBtn.addEventListener('click', triggerModalClosure);
    
    // Dismiss window if clicked outside transparent modal bounding container box
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) triggerModalClosure();
    });

    /* --- Data Validation & Input Processing Pipelines --- */
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameValue = document.getElementById('taskName').value.trim();
        const deadlineValue = taskDeadlineInput.value; // Receives date input values format: YYYY-MM-DD
        const priorityValue = document.querySelector('input[name="priority"]:checked').value;

        if (!nameValue || !deadlineValue) return;

        if (currentEditTaskId) {
            // MODE: MUTATE EXISTING OBJECTS
            tasksCollection = tasksCollection.map(taskItem => {
                if (taskItem.id === currentEditTaskId) {
                    return {
                        ...taskItem,
                        name: nameValue,
                        time: deadlineValue,
                        priority: priorityValue
                    };
                }
                return taskItem;
            });
        } else {
            // MODE: INSTANTIATE NEW OBJECT
            const computedTaskPayload = {
                id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 4),
                name: nameValue,
                time: deadlineValue, 
                priority: priorityValue,
                completed: false
            };
            tasksCollection.push(computedTaskPayload);
        }

        synchronizePersistentStorage();
        renderUIElements();
        triggerModalClosure();
    });

    /* --- Trigger Mutation Interface Routine --- */
    window.openEditTaskModal = function(targetId) {
        const structuralMatch = tasksCollection.find(t => t.id === targetId);
        if (!structuralMatch) return;

        currentEditTaskId = targetId;
        modalTitle.innerText = "Edit Task Specified";

        // Lift historical date baseline configuration out so user can save unchanged dates safely
        taskDeadlineInput.removeAttribute('min');

        // Populate dynamic values inside the modal input structures
        document.getElementById('taskName').value = structuralMatch.name;
        taskDeadlineInput.value = structuralMatch.time;
        
        if (structuralMatch.priority === 'High') {
            document.getElementById('prio-high').checked = true;
        } else {
            document.getElementById('prio-low').checked = true;
        }

        taskModal.classList.add('is-active');
        document.getElementById('taskName').focus();
    };

    /* --- Persistent Storage State Syncer Module --- */
    function synchronizePersistentStorage() {
        localStorage.setItem('scholarsync_tasks_db', JSON.stringify(tasksCollection));
    }

    /* --- Global Interactive Action Access Handlers --- */
    window.toggleTaskStatus = function(targetId) {
        tasksCollection = tasksCollection.map(taskItem => {
            if (taskItem.id === targetId) {
                taskItem.completed = !taskItem.completed;
            }
            return taskItem;
        });
        synchronizePersistentStorage();
        renderUIElements();
    };

    window.executeTaskDeletion = function(targetId) {
        tasksCollection = tasksCollection.filter(taskItem => taskItem.id !== targetId);
        synchronizePersistentStorage();
        renderUIElements();
    };

    /* --- Date Format Compilation Processing Transformer --- */
    function transformInputDateToHumanReadable(rawDateString) {
        if (!rawDateString) return '';
        const optionalParts = rawDateString.split('-');
        if (optionalParts.length !== 3) return rawDateString;

        const parsedDateObj = new Date(optionalParts[0], optionalParts[1] - 1, optionalParts[2]);
        
        return parsedDateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /* --- Workspace Render Matrix UI Compilation Engine --- */
    function renderUIElements() {
        tasksGrid.innerHTML = '';

        if (tasksCollection.length === 0) {
            tasksGrid.innerHTML = `
                <div class="empty-matrix-msg">
                    No active tasks are assigned on your desk. Click "Add Task" to initialize one!
                </div>`;
            return;
        }

        const todayObj = new Date();
        const yyyy = todayObj.getFullYear();
        let mm = todayObj.getMonth() + 1;
        let dd = todayObj.getDate();
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;
        const todayString = `${yyyy}-${mm}-${dd}`;

        tasksCollection.forEach(task => {
            const isOverdue = !task.completed && (task.time < todayString);
            const cardNode = document.createElement('div');
            
            let cardClasses = ['task-card'];
            if (task.completed) cardClasses.push('is-completed');
            if (isOverdue) cardClasses.push('is-overdue');
            cardNode.className = cardClasses.join(' ');
            
            const badgeModifierClass = task.priority === 'High' ? 'badge-high' : 'badge-low';
            const readableDeadline = transformInputDateToHumanReadable(task.time);

            const overdueLabelMarkup = isOverdue 
                ? `<div class="task-card-overdue-label"><i class="fas fa-exclamation-circle"></i> Overdue</div>` 
                : '';

            cardNode.innerHTML = `
                <div class="task-card-header">
                    <span class="task-card-title">${sanitizeHtmlEntities(task.name)}</span>
                    <div class="task-header-right-block">
                        <button class="btn-task-edit" onclick="openEditTaskModal('${task.id}')" title="Edit Task parameters">
                            <i class="fas fa-pen"></i>
                        </button>
                        <span class="badge-priority ${badgeModifierClass}">${task.priority}</span>
                    </div>
                </div>
                <div class="task-card-footer">
                    <div class="task-card-time" style="flex-direction: column; align-items: flex-start; gap: 0;">
                        <div><i class="far fa-calendar-alt"></i> Deadline: ${sanitizeHtmlEntities(readableDeadline)}</div>
                        ${overdueLabelMarkup}
                    </div>
                    <div class="task-card-actions">
                        <button class="btn-action btn-action-complete" onclick="toggleTaskStatus('${task.id}')" title="Toggle execution parameters">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-action btn-action-delete" onclick="executeTaskDeletion('${task.id}')" title="Purge data node">
                            <i class="far fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
            tasksGrid.appendChild(cardNode);
        });
    }

    /* --- XSS Mitigation Sanitization Parser Engine --- */
    function sanitizeHtmlEntities(inputRawString) {
        const dummyBuffer = document.createElement('div');
        dummyBuffer.innerText = inputRawString;
        return dummyBuffer.innerHTML;
    }
});