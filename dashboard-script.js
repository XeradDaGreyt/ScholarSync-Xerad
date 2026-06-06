document.addEventListener('DOMContentLoaded', () => {

    /* --- Session & Authentication Handling --- */
    function getCurrentUser() {
        const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    }

    const currentUser = getCurrentUser();
    const welcomeNameEl = document.getElementById('welcomeName');

    // Protect the route: if no session exists, bounce back to login
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Set the welcome banner text safely
    if (welcomeNameEl) {
        welcomeNameEl.textContent = currentUser.firstName || currentUser.username || 'Friend';
    }

    /* --- Logout Logic --- */
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    if (logoutBtn && logoutModal) {
        
        // Open Modal Configuration
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Stop bubbling up
            logoutModal.classList.add('active');
        });

        // Close Modal Configuration via Cancel Button
        if (cancelLogoutBtn) {
            cancelLogoutBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                logoutModal.style.display = 'none';
            });
        }

        // Close Modal safely only when clicking the background overlay layer grid explicitly
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
            }
        });

        // Destructive Session Storage Engine Eraser
        if (confirmLogoutBtn) {
            confirmLogoutBtn.addEventListener('click', () => {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isLoggedIn');
                sessionStorage.removeItem('currentUser');
                window.location.replace('index.html'); // Using replace prevents "back-arrow" loop issues
            });
        }
    }


    /* --- Global Chart Variable --- */
    let productivityChartInstance = null;

    /* --- Chart Renderer Engine --- */
    function renderProgressChart(totalTasks, completedTasks) {
        const chartCanvas = document.getElementById('productivityChart');
        const progressMsg = document.getElementById('progress-msg');
        const progressContent = document.getElementById('progress-content');

        if (!chartCanvas || !progressMsg) return;

        // EMPTY STATE BEHAVIOR: If no tasks exist, clean up and show empty state message
        if (totalTasks === 0) {
            chartCanvas.style.display = 'none';
            progressMsg.style.display = 'block';
            if (progressContent) progressContent.classList.add('empty-state');
            
            if (productivityChartInstance) {
                productivityChartInstance.destroy();
                productivityChartInstance = null;
            }
            return;
        }

        // Otherwise, reveal chart canvas and suppress empty text element
        chartCanvas.style.display = 'block';
        progressMsg.style.display = 'none';
        if (progressContent) progressContent.classList.remove('empty-state');

        const remainingTasks = totalTasks - completedTasks;

        // Clear previous reference footprint to avoid stacking canvas tooltips
        if (productivityChartInstance) {
            productivityChartInstance.destroy();
        }

        const ctx = chartCanvas.getContext('2d');
        
        // Build the Doughnut Chart instance config profile
        productivityChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [completedTasks, remainingTasks],
                    backgroundColor: ['#2ecc71', '#9f9999'], 
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#495057',
                            font: {
                                family: "'Open Sans', sans-serif",
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw || 0;
                                const percentage = totalTasks > 0 ? ((value / totalTasks) * 100).toFixed(0) : 0;
                                return ` ${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }


    /* --- Dashboard Content Loaders --- */
    function loadTasksForDashboard() {
        const perKey = `scholarsync_tasks_db_${currentUser.username}`;
        const tasks = JSON.parse(localStorage.getItem(perKey)) || [];
        const taskListEl = document.getElementById('task-list');
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.isCompleted || t.completed).length;

        renderProgressChart(totalTasks, completedTasks);
        
        if (!taskListEl) return;
        
        // Match both 'isCompleted' or 'completed' status flags from your payload
        const activeTasks = tasks.filter(t => !(t.isCompleted || t.completed));
        
        if (activeTasks.length === 0) {
            taskListEl.classList.add('empty-state');
            taskListEl.innerHTML = `<p>There is no task for today</p>`;
            return;
        }
        
        taskListEl.classList.remove('empty-state');
        
        // --- UPDATED SORTING ENGINE: Prioritize by Date Order first ---
        activeTasks.sort((a, b) => {
            const dateA = a.time || "";
            const dateB = b.time || "";
            
            // 1. Compare dates chronologically (Ascending: earliest dates first)
            if (dateA < dateB) return -1;
            if (dateA > dateB) return 1;
            
            // 2. If dates are equal, tie-break by Priority (High priority goes first)
            if (a.priority === 'High' && b.priority !== 'High') return -1;
            if (a.priority !== 'High' && b.priority === 'High') return 1;
            
            return 0;
        });

        // Get today's local timestamp normalized strictly to 'YYYY-MM-DD'
        const todayObj = new Date();
        const yyyy = todayObj.getFullYear();
        let mm = todayObj.getMonth() + 1;
        let dd = todayObj.getDate();
        if (mm < 10) mm = '0' + mm;
        if (dd < 10) dd = '0' + dd;
        const todayString = `${yyyy}-${mm}-${dd}`;

        // Process up to top 5 chronological elements cleanly
        const limitedTasks = activeTasks.slice(0, 5);

        let listHtml = limitedTasks
            .map(t => {
                const taskTitle = t.name || 'Untitled Task';
                const escapedTitle = taskTitle.replace(/[&<>'"]/g, tag => 
                    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
                );
                
                // Priority badge assignment
                const priorityBadge = (t.priority === 'High') ? '<span style="color: #ff6b6b; font-weight: bold; font-size: 11px; margin-left: 8px;">[HIGH]</span>' : '';
                
                // --- Safe Local Overdue Engine ---
                let overdueBadge = '';
                if (t.time) {
                    if (t.time < todayString) {
                        overdueBadge = '<span style="color: #ff6b6b; font-weight: bold; font-size: 11px; margin-right: 8px;"><i class="fas fa-exclamation-circle"></i> [OVERDUE]</span>';
                    }
                }
                
                return `<div class="dash-task-item">${overdueBadge}${escapedTitle}${priorityBadge}</div>`;
            })
            .join('');
            
        if (activeTasks.length > 5) {
            listHtml += `<div class="dash-overflow-link" onclick="window.location.href='task.html'">...more</div>`;
        }
                    
        taskListEl.innerHTML = listHtml;
    }

    function loadNotesForDashboard() {
        const perKey = `notes_${currentUser.username}`;
        const notes = JSON.parse(localStorage.getItem(perKey)) || [];
        const notesEl = document.getElementById('notes-container');
        
        if (!notesEl) return;
        
        if (!notes || notes.length === 0) {
            notesEl.classList.add('empty-state');
            notesEl.innerHTML = `<p>There is no notes</p>`;
            return;
        }
        
        notesEl.classList.remove('empty-state');
        
        let listHtml = notes
            .slice(0, 5)
            .map(n => {
                const noteTitle = n.title || 'Untitled';
                const noteContent = n.content || '';
                return `
                    <div class="dash-item dash-note-card">
                        <strong>${noteTitle}</strong>
                        <div class="dash-note-preview">${noteContent}</div>
                    </div>
                `;
            })
            .join('');
            
        if (notes.length > 5) {
            listHtml += `<div class="dash-overflow-link" onclick="window.location.href='notes.html'">...more</div>`;
        } 
        notesEl.innerHTML = listHtml;
    }

    // Run dynamic view component loaders
    loadTasksForDashboard();
    loadNotesForDashboard();

    // Handle cross-tab or cross-window updates smoothly
    window.addEventListener('storage', (event) => {
        const targetTaskKey = `scholarsync_tasks_db_${currentUser.username}`;
        if (event.key === targetTaskKey) {
            loadTasksForDashboard();
        }
    });

    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            loadTasksForDashboard();
        }
    });


    /* ==========================================================================
        DASHBOARD WEEKLY CALENDAR CONTROLLER ENGINE
    ========================================================================== */

    // Weekly Calendar Configuration & State Variables
    let currentWeeklyFocusDate = new Date(); 
    const monthNamesArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const calendarMonthYearDisplay = document.getElementById('calendarMonthYearDisplay');
    const calendarDaysGridNode = document.getElementById('calendarDaysGridNode');
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');

    function createDateStringISOKey(dateObject) {
        const year = dateObject.getFullYear();
        const month = String(dateObject.getMonth() + 1).padStart(2, '0');
        const day = String(dateObject.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function formatDisplayReadableTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        let numericalHour = parseInt(hours);
        const stringAmPm = numericalHour >= 12 ? 'PM' : 'AM';
        numericalHour = numericalHour % 12 || 12;
        return `${numericalHour}:${minutes} ${stringAmPm}`;
    }

    function computeRenderGridWeeklyFrame() {
        if (!calendarMonthYearDisplay || !calendarDaysGridNode) return;

        calendarDaysGridNode.innerHTML = "";

        const userEventsStorageKey = `scholarSyncEventsCalendar_${currentUser.username}`;
        const eventsRegistry = JSON.parse(localStorage.getItem(userEventsStorageKey)) || [];

        const realTimeTodayInstance = new Date();
        
        const currentDayOfWeekIndex = currentWeeklyFocusDate.getDay(); 
        const sundayAnchorDate = new Date(currentWeeklyFocusDate);
        sundayAnchorDate.setDate(currentWeeklyFocusDate.getDate() - currentDayOfWeekIndex);

        calendarMonthYearDisplay.textContent = `${monthNamesArray[currentWeeklyFocusDate.getMonth()]} ${currentWeeklyFocusDate.getFullYear()}`;

        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const loopsTargetDateInstance = new Date(sundayAnchorDate);
            loopsTargetDateInstance.setDate(sundayAnchorDate.getDate() + dayOffset);

            const computedDateISOKey = createDateStringISOKey(loopsTargetDateInstance);

            const dayCellContainerNode = document.createElement('div');
            dayCellContainerNode.className = 'date-cell weekly-cell';
            dayCellContainerNode.dataset.dateStringKey = computedDateISOKey;

            if (loopsTargetDateInstance.getDate() === realTimeTodayInstance.getDate() &&
                loopsTargetDateInstance.getMonth() === realTimeTodayInstance.getMonth() &&
                loopsTargetDateInstance.getFullYear() === realTimeTodayInstance.getFullYear()) {
                dayCellContainerNode.classList.add('current-today');
            }

            const cellNumberNode = document.createElement('span');
            cellNumberNode.className = 'date-number';
            cellNumberNode.textContent = loopsTargetDateInstance.getDate();
            dayCellContainerNode.appendChild(cellNumberNode);

            const filteredCellEventsArray = eventsRegistry
                .filter(event => event.date === computedDateISOKey)
                .sort((alpha, beta) => alpha.time.localeCompare(beta.time));

            const eventsStackWrapperDiv = document.createElement('div');
            eventsStackWrapperDiv.className = 'cell-events-stack';

            const maximumVisibleCellPreviews = 2;
            filteredCellEventsArray.slice(0, maximumVisibleCellPreviews).forEach(eventItem => {
                const inlinePillSpan = document.createElement('span');
                inlinePillSpan.className = 'micro-event-pill';
                const eventTitleText = eventItem.title || eventItem.name || 'Untitled Event';
                inlinePillSpan.textContent = `${formatDisplayReadableTime(eventItem.time)} ${eventTitleText}`;
                eventsStackWrapperDiv.appendChild(inlinePillSpan);
            });

            if (filteredCellEventsArray.length > maximumVisibleCellPreviews) {
                const extraItemsCountLabelSpan = document.createElement('span');
                extraItemsCountLabelSpan.className = 'micro-event-overflow';
                extraItemsCountLabelSpan.textContent = `+${filteredCellEventsArray.length - maximumVisibleCellPreviews} more...`;
                eventsStackWrapperDiv.appendChild(extraItemsCountLabelSpan);
            }

            dayCellContainerNode.appendChild(eventsStackWrapperDiv);
            calendarDaysGridNode.appendChild(dayCellContainerNode);
        }
    }

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentWeeklyFocusDate.setDate(currentWeeklyFocusDate.getDate() - 7);
            computeRenderGridWeeklyFrame();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentWeeklyFocusDate.setDate(currentWeeklyFocusDate.getDate() + 7);
            computeRenderGridWeeklyFrame();
        });
    }

    computeRenderGridWeeklyFrame();
});