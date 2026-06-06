document.addEventListener('DOMContentLoaded', () => {
    // DOM Node Object Hook Pointer Selectors
    const taskModal = document.getElementById('taskModal');
    const openModalBtn = document.getElementById('openModalBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const taskForm = document.getElementById('taskForm');
    const tasksGrid = document.getElementById('tasksGrid');
    const taskDeadlineInput = document.getElementById('taskDeadline');
    const modalTitle = taskModal.querySelector('h3');
    const taskSearchInput = document.getElementById('taskSearchInput');
    const taskSortFilter = document.getElementById('taskSortFilter'); 

    // State Storage Logic: Initialize Task Array Mapping Array Structure (per-user namespaced)
    function getCurrentUser() {
        const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    }

    const currentUser = getCurrentUser();
    const tasksKey = currentUser ? `scholarsync_tasks_db_${currentUser.username}` : 'scholarsync_tasks_db';
    // Namespace preference key specifically linked to the logged-in user
    const filterPrefKey = currentUser ? `scholarsync_filter_pref_${currentUser.username}` : 'scholarsync_filter_pref';

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    let tasksCollection = JSON.parse(localStorage.getItem(tasksKey)) || [];
    let currentSearchQuery = ""; 
    
    // Retrieve saved filter choice from localStorage, or default to "none"
    let currentSortMode = localStorage.getItem(filterPrefKey) || "none"; 

    // Sync the dropdown selector visual state to match the loaded setting
    if (taskSortFilter) {
        taskSortFilter.value = currentSortMode;
    }

    // Update welcome name in UI
    const welcomeNameEl = document.getElementById('welcomeName');
    if (welcomeNameEl && currentUser) welcomeNameEl.textContent = currentUser.firstName || currentUser.username || 'Friend';

    /* --- FIXED: Uniform Logout Logic Control Engine --- */
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    if (logoutBtn && logoutModal) {
        // Show modal natively using structural overlay active tracking configurations
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logoutModal.classList.add('is-active');
        });

        // Hide modal cleanly when cancelled
        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', () => {
                logoutModal.classList.remove('is-active');
            });
        }

        // Close modal overlay window completely if clicking outside card target container area
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('is-active');
            }
        });

        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', () => {
                // Persistent cleanup sequences before clearing system instance routes
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
        }
    }
    
    // Tracking pointer variables for operational editing mode states
    let currentEditTaskId = null; 

    // Core Lifecycles Engine Initial Bootstrap execution
    renderUIElements();
    restrictPastDates();

    /* --- Interactive Change Listeners Engine --- */
    if (taskSearchInput) {
        taskSearchInput.addEventListener('input', (e) => {
            currentSearchQuery = e.target.value.toLowerCase().trim();
            renderUIElements(); 
        });
    }

    if (taskSortFilter) {
        taskSortFilter.addEventListener('change', (e) => {
            currentSortMode = e.target.value;
            // Write selection change immediately to browser memory storage
            localStorage.setItem(filterPrefKey, currentSortMode);
            renderUIElements(); 
        });
    }

    /* --- Validation Restriction Logic Engine --- */
    function restrictPastDates() {
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; 
        let dd = today.getDate();

        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;

        const formattedTodayString = `${yyyy}-${mm}-${dd}`;
        if (taskDeadlineInput) {
            taskDeadlineInput.setAttribute('min', formattedTodayString);
        }
    }

    /* --- Interactive Modal Interface Window Controllers --- */
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            currentEditTaskId = null; 
            modalTitle.innerText = "Create New Task";
            restrictPastDates();
            
            document.getElementById('prio-high').checked = true; 
            taskModal.classList.add('is-active');
            document.getElementById('taskName').focus();
        });
    }

    const triggerModalClosure = () => {
        taskModal.classList.remove('is-active');
        taskForm.reset();
        currentEditTaskId = null;
    };

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', triggerModalClosure);
    }
    
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) triggerModalClosure();
    });

    /* --- Data Validation & Input Processing Pipelines --- */
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameValue = document.getElementById('taskName').value.trim();
        const deadlineValue = taskDeadlineInput.value; 
        const priorityValue = document.querySelector('input[name="priority"]:checked').value; 

        if (!nameValue || !deadlineValue) return;

        if (currentEditTaskId) {
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
            const computedTaskPayload = {
                id: 'task_' + Date.now() + Math.random().toString(36).substr(2, 4),
                name: nameValue,
                time: deadlineValue, 
                priority: priorityValue,
                completed: false,
                isCompleted: false 
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
        taskDeadlineInput.removeAttribute('min');

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
        localStorage.setItem(tasksKey, JSON.stringify(tasksCollection));
        
        window.dispatchEvent(new StorageEvent('storage', {
            key: tasksKey,
            newValue: JSON.stringify(tasksCollection)
        }));
    }

    /* --- Global Interactive Action Handlers --- */
    window.toggleTaskStatus = function(targetId) {
        tasksCollection = tasksCollection.map(taskItem => {
            if (taskItem.id === targetId) {
                taskItem.completed = !taskItem.completed;
                taskItem.isCompleted = taskItem.completed; 
            }
            return taskItem;
        });
        synchronizePersistentStorage();
        renderUIElements();
    };

    let taskIdToDelete = null; 

    window.executeTaskDeletion = function(targetId) {
        taskIdToDelete = targetId;
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.add('is-active');
        }
    };

    window.closeDeleteModal = function() {
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.classList.remove('is-active');
        }
        taskIdToDelete = null; 
    };

    window.executeDeletion = function() {
        if (!taskIdToDelete) return;

        tasksCollection = tasksCollection.filter(taskItem => taskItem.id !== taskIdToDelete);
        
        synchronizePersistentStorage();
        renderUIElements();
        closeDeleteModal();
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

    /* --- Single Task Card UI Renderer Component --- */
    function generateTaskCardHtml(task, todayString) {
        const isOverdue = !task.completed && (task.time < todayString);
        const badgeModifierClass = task.priority === 'High' ? 'badge-high' : 'badge-low';
        const readableDeadline = transformInputDateToHumanReadable(task.time);
        const overdueLabelMarkup = isOverdue ? `<div class="task-card-overdue-label"><i class="fas fa-exclamation-circle"></i> Overdue</div>` : '';

        return `
            <div class="task-card ${task.completed ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''}">
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
            </div>`;
    }

    /* --- Workspace Render Matrix UI Compilation Engine --- */
    function renderUIElements() {
        tasksGrid.innerHTML = '';

        if (tasksCollection.length === 0) {
            tasksGrid.innerHTML = `
                <div class="empty-matrix-msg" style="grid-column: 1 / -1;">
                    No active tasks are assigned on your desk. Click "Add Task" to initialize one!
                </div>`;
            return;
        }

        const filteredTasks = tasksCollection.filter(task => 
            task.name.toLowerCase().includes(currentSearchQuery)
        );

        if (filteredTasks.length === 0) {
            tasksGrid.innerHTML = `
                <div class="empty-matrix-msg" style="grid-column: 1 / -1;">
                    No tasks found matching "${sanitizeHtmlEntities(taskSearchInput.value)}".
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

        // MODE A: ARRANGEMENT CATEGORIZATION BY PRIORITY TIER
        if (currentSortMode === "priority") {
            const highPriorityTasks = filteredTasks.filter(t => t.priority === 'High');
            const lowPriorityTasks = filteredTasks.filter(t => t.priority !== 'High');

            let gridContent = '';

            if (highPriorityTasks.length > 0) {
                gridContent += `<div class="filter-group-header" style="grid-column: 1 / -1; font-weight:700; font-size:16px; color:#ff6b6b; margin: 15px 0 5px 0;"><i class="fa-solid fa-circle-exclamation"></i> High Priority Tasks (${highPriorityTasks.length})</div>`;
                highPriorityTasks.forEach(task => gridContent += generateTaskCardHtml(task, todayString));
            }
            if (lowPriorityTasks.length > 0) {
                gridContent += `<div class="filter-group-header" style="grid-column: 1 / -1; font-weight:700; font-size:16px; color:#51cf66; margin: 25px 0 5px 0;"><i class="fa-solid fa-circle-minus"></i> Low Priority Tasks (${lowPriorityTasks.length})</div>`;
                lowPriorityTasks.forEach(task => gridContent += generateTaskCardHtml(task, todayString));
            }
            
            tasksGrid.innerHTML = gridContent;

        // MODE B: ARRANGEMENT CATEGORIZATION BY EXACT DATES (1-BY-1)
        } else if (currentSortMode === "date") {
            const tasksByDateGroup = {};
            
            filteredTasks.forEach(task => {
                const dateKey = task.time;
                if (!tasksByDateGroup[dateKey]) {
                    tasksByDateGroup[dateKey] = [];
                }
                tasksByDateGroup[dateKey].push(task);
            });

            const sortedUniqueDates = Object.keys(tasksByDateGroup).sort();
            let gridContent = '';

            sortedUniqueDates.forEach(dateKey => {
                const readableSectionTitle = transformInputDateToHumanReadable(dateKey);
                const sectionTasks = tasksByDateGroup[dateKey];
                
                const isSectionToday = (dateKey === todayString);
                const headingColor = isSectionToday ? '#fcc419' : '#4dabf7';
                const iconClass = isSectionToday ? 'fa-hourglass-half' : 'fa-calendar-days';

                gridContent += `
                    <div class="filter-group-header" style="grid-column: 1 / -1; font-weight:700; font-size:16px; color:${headingColor}; margin: 20px 0 5px 0;">
                        <i class="fa-solid ${iconClass}"></i> Due on ${readableSectionTitle} (${sectionTasks.length})
                    </div>`;
                
                sectionTasks.forEach(task => {
                    gridContent += generateTaskCardHtml(task, todayString);
                });
            });

            tasksGrid.innerHTML = gridContent;

        // MODE C: FIXED DEFAULT FLAT LIST RENDER VIEW (Safe template execution engine strings)
        } else {
            let gridContent = '';
            filteredTasks.forEach(task => {
                gridContent += generateTaskCardHtml(task, todayString);
            });
            tasksGrid.innerHTML = gridContent;
        }
    }

    /* --- XSS Mitigation Sanitization Parser Engine --- */
    function sanitizeHtmlEntities(inputRawString) {
        if (!inputRawString) return '';
        const dummyBuffer = document.createElement('div');
        dummyBuffer.innerText = inputRawString;
        return dummyBuffer.innerHTML;
    }
});