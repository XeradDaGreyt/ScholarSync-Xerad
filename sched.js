/* ==========================================================================
   A. SECURITY & AUTHENTICATION INTEGRITY FILTER CHECK
   ========================================================================== */
function getCurrentUser() {
    const raw = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}

const currentUser = getCurrentUser();
if (!currentUser) {
    window.location.href = 'index.html';
}

// DOM Pointers for the Logout Modal Element Map - SAFELY FETCHED
const logoutModalOverlay = document.getElementById('logoutModal');
const logoutBtn = document.getElementById('logoutBtn');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

// Intercept regular action to trigger our confirmation popup instead
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleModalVisibility(logoutModalOverlay, true);
    });
}

// Dismiss popup without performing destructive mutations
if (cancelLogoutBtn) {
    cancelLogoutBtn.addEventListener('click', () => {
        toggleModalVisibility(logoutModalOverlay, false);
    });
}

// User confirmed; clear persistent active contexts and force route out
if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

/* ==========================================================================
   B. ENGINE CALENDAR ARCHITECTURE INITIALIZATION INITIALS
   ========================================================================== */
// Dynamically generate key based on logged-in account username
const userEventsStorageKey = `scholarSyncEventsCalendar_${currentUser ? currentUser.username : 'guest'}`;

// Load only the events belonging to this specific user account
let applicationStateEventsArray = JSON.parse(localStorage.getItem(userEventsStorageKey)) || [];

let calendarInternalFocusDate = new Date(); 
let targetSelectedInspectedDateKey = ""; 
let internalActiveEditingEventId = null; 

// DOM Element Cache Pointers
const calendarMonthYearDisplay = document.getElementById('calendarMonthYearDisplay');
const calendarDaysGridNode = document.getElementById('calendarDaysGridNode');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');

// Modal Overlay Interface Element Pointers
const addEventModalOverlay = document.getElementById('addEventModalOverlay');
const dayInspectorModalOverlay = document.getElementById('dayInspectorModalOverlay');
const editEventModalOverlay = document.getElementById('editEventModalOverlay');

// Interactive Controls Hooks Mapping
const openAddEventModalBtn = document.getElementById('openAddEventModalBtn');
const cancelAddEventModalBtn = document.getElementById('cancelAddEventModalBtn');
const addEventSubmissionForm = document.getElementById('addEventSubmissionForm');
const closeInspectorModalBtn = document.getElementById('closeInspectorModalBtn');
const cancelEditEventModalBtn = document.getElementById('cancelEditEventModalBtn');
const editEventSubmissionForm = document.getElementById('editEventSubmissionForm');
const deleteEventActionBtn = document.getElementById('deleteEventActionBtn');

const monthNamesArray = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ==========================================================================
   C. UTILITY DATA CONVERSION HELPER MATH FUNCTIONS
   ========================================================================== */
function createDateStringISOKey(year, month, date) {
    const compiledMonth = String(month + 1).padStart(2, '0');
    const compiledDay = String(date).padStart(2, '0');
    return `${year}-${compiledMonth}-${compiledDay}`;
}

function formatDisplayReadableTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    let numericalHour = parseInt(hours);
    const stringAmPm = numericalHour >= 12 ? 'PM' : 'AM';
    numericalHour = numericalHour % 12 || 12;
    return `${numericalHour}:${minutes} ${stringAmPm}`;
}

/* ==========================================================================
   D. DOM RENDERING GRAPHICS MANAGEMENT MATRIX COMPILER
   ========================================================================== */
function computeRenderGridCalendarFrame() {
    const executionFocusYear = calendarInternalFocusDate.getFullYear();
    const executionFocusMonth = calendarInternalFocusDate.getMonth();

    if (calendarMonthYearDisplay) {
        calendarMonthYearDisplay.textContent = `${monthNamesArray[executionFocusMonth]} ${executionFocusYear}`;
    }
    if (!calendarDaysGridNode) return;
    calendarDaysGridNode.innerHTML = "";

    // Calculate boundary index padding metrics
    const matrixFirstDayIndex = new Date(executionFocusYear, executionFocusMonth, 1).getDay();
    const matrixTotalDaysInMonthCount = new Date(executionFocusYear, executionFocusMonth + 1, 0).getDate();
    const matrixTotalDaysInPreviousMonthCount = new Date(executionFocusYear, executionFocusMonth, 0).getDate();

    const realTimeTodayInstance = new Date();

    // Render previous month's trailing padding dates
    for (let padIndex = matrixFirstDayIndex; padIndex > 0; padIndex--) {
        const targetDayValue = matrixTotalDaysInPreviousMonthCount - padIndex + 1;
        const deadCellDiv = document.createElement('div');
        deadCellDiv.className = 'date-cell empty-pad-day';
        deadCellDiv.innerHTML = `<span class="date-number">${targetDayValue}</span>`;
        calendarDaysGridNode.appendChild(deadCellDiv);
    }

    // Render current month's active clickable dates
    for (let operationalDayCounter = 1; operationalDayCounter <= matrixTotalDaysInMonthCount; operationalDayCounter++) {
        const computedDateISOStringStringKey = createDateStringISOKey(executionFocusYear, executionFocusMonth, operationalDayCounter);
        
        const dayCellContainerNode = document.createElement('div');
        dayCellContainerNode.className = 'date-cell';
        dayCellContainerNode.dataset.dateStringKey = computedDateISOStringStringKey;

        // Validate if today's date matches to append highlight styling classes
        if (realTimeTodayInstance.getDate() === operationalDayCounter && 
            realTimeTodayInstance.getMonth() === executionFocusMonth && 
            realTimeTodayInstance.getFullYear() === executionFocusYear) {
            dayCellContainerNode.classList.add('current-today');
        }

        // Append header indexing label node elements
        const cellNumberNode = document.createElement('span');
        cellNumberNode.className = 'date-number';
        cellNumberNode.textContent = operationalDayCounter;
        dayCellContainerNode.appendChild(cellNumberNode);

        // Collect subset of arrays matched to index key
        const filteredCellEventsArray = applicationStateEventsArray
            .filter(event => event.date === computedDateISOStringStringKey)
            .sort((alpha, beta) => alpha.time.localeCompare(beta.time));

        const eventsStackWrapperDiv = document.createElement('div');
        eventsStackWrapperDiv.className = 'cell-events-stack';

        // Display dynamic content alerts inside target cell elements
        const maximumVisibleCellPreviews = 2;
        filteredCellEventsArray.slice(0, maximumVisibleCellPreviews).forEach(eventItem => {
            const inlinePillSpan = document.createElement('span');
            inlinePillSpan.className = 'micro-event-pill';
            inlinePillSpan.textContent = `${formatDisplayReadableTime(eventItem.time)} ${eventItem.name}`;
            eventsStackWrapperDiv.appendChild(inlinePillSpan);
        });

        if (filteredCellEventsArray.length > maximumVisibleCellPreviews) {
            const extraItemsCountLabelSpan = document.createElement('span');
            extraItemsCountLabelSpan.className = 'micro-event-overflow';
            extraItemsCountLabelSpan.textContent = `+${filteredCellEventsArray.length - maximumVisibleCellPreviews} more...`;
            eventsStackWrapperDiv.appendChild(extraItemsCountLabelSpan);
        }

        dayCellContainerNode.appendChild(eventsStackWrapperDiv);

        // Attach dynamic click events
        dayCellContainerNode.addEventListener('click', () => {
            executeCellInteractionTrigger(computedDateISOStringStringKey);
        });

        calendarDaysGridNode.appendChild(dayCellContainerNode);
    }
}

/* ==========================================================================
   E. MODAL DISPLAY OVERLAYS INTERACTION CONTROLLERS
   ========================================================================== */
function toggleModalVisibility(targetOverlayNode, setVisibleBooleanFlag) {
    if (!targetOverlayNode) return;
    
    // Support both '.active' and layout-specific '.is-active' classes smoothly
    if (setVisibleBooleanFlag) {
        targetOverlayNode.classList.add('active', 'is-active');
    } else {
        targetOverlayNode.classList.remove('active', 'is-active');
    }
}

function executeCellInteractionTrigger(dateISOKeyString) {
    targetSelectedInspectedDateKey = dateISOKeyString;
    const matchedTargetEventsList = applicationStateEventsArray.filter(evt => evt.date === dateISOKeyString);

    if (matchedTargetEventsList.length === 0) {
        const inputDateEl = document.getElementById('eventInputDate');
        const inputNameEl = document.getElementById('eventInputName');
        const inputTimeEl = document.getElementById('eventInputTime');
        
        if (inputDateEl) inputDateEl.value = dateISOKeyString;
        if (inputNameEl) inputNameEl.value = "";
        if (inputTimeEl) inputTimeEl.value = "";
        
        alert("No event on this date");
        toggleModalVisibility(addEventModalOverlay, true);
    } else {
        renderDateInspectorModalListViewContents(matchedTargetEventsList, dateISOKeyString);
    }
}

function renderDateInspectorModalListViewContents(eventsArraySubset, dateISOKeyString) {
    const splitPieces = dateISOKeyString.split('-');
    const customDateObject = new Date(splitPieces[0], splitPieces[1] - 1, splitPieces[2]);
    
    const titleLabel = document.getElementById('inspectorModalTitleDateLabel');
    if (titleLabel) {
        titleLabel.textContent = customDateObject.toLocaleDateString('en-US', {
            weekday: 'short', month: 'long', day: 'numeric', year: 'numeric'
        });
    }

    const targetStackNode = document.getElementById('inspectorEventsListStackNode');
    if (!targetStackNode) return;
    targetStackNode.innerHTML = "";

    eventsArraySubset.forEach(eventItem => {
        const blockRowWrapperDiv = document.createElement('div');
        blockRowWrapperDiv.className = 'inspected-event-item';

        blockRowWrapperDiv.innerHTML = `
            <div class="inspected-item-details">
                <h4>${eventItem.name}</h4>
                <p><i class="far fa-clock" style="margin-right: 4px;"></i>${formatDisplayReadableTime(eventItem.time)}</p>
            </div>
            <div class="inspected-item-actions">
                <button class="action-icon-btn edit" title="Edit" onclick="initiateEventEditWorkflow(${eventItem.id})">
                    <i class="fas fa-pen"></i>
                </button>
                <button class="action-icon-btn delete" title="Delete" onclick="executeDirectDeletionWorkflow(${eventItem.id})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        targetStackNode.appendChild(blockRowWrapperDiv);
    });

    toggleModalVisibility(dayInspectorModalOverlay, true);
}

/* ==========================================================================
   F. CORE CRUD APPLICATION LOGIC OPERATIONS HANDLERS
   ========================================================================== */
function persistStateAndRefreshViews() {
    localStorage.setItem(userEventsStorageKey, JSON.stringify(applicationStateEventsArray));
    computeRenderGridCalendarFrame();
}

function handleEventSubmission(inputNameId, inputDateId, inputTimeId, optionalDescId = null) {
    const nameEl = document.getElementById(inputNameId);
    const dateEl = document.getElementById(inputDateId);
    const timeEl = document.getElementById(inputTimeId);
    const descEl = optionalDescId ? document.getElementById(optionalDescId) : null;

    if (!nameEl || !dateEl || !timeEl) return false;

    const inputStringName = nameEl.value.trim();
    const inputStringDate = dateEl.value;
    const inputStringTime = timeEl.value;
    const inputStringDesc = descEl ? descEl.value.trim() : "";

    if (!inputStringName || !inputStringDate || !inputStringTime) {
        alert("All input tracking fields are mandatory required variables.");
        return false;
    }

    const collisionPreCheckCount = applicationStateEventsArray.filter(e => e.date === inputStringDate).length;
    if (collisionPreCheckCount >= 20) {
        alert("Maximum events reached for this date.");
        return false;
    }

    const newGeneratedEventObject = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: inputStringName,
        title: inputStringName, 
        date: inputStringDate,
        time: inputStringTime,
        desc: inputStringDesc
    };

    applicationStateEventsArray.push(newGeneratedEventObject);
    persistStateAndRefreshViews();
    return true;
}

if (addEventSubmissionForm) {
    addEventSubmissionForm.addEventListener('submit', (syntheticEvent) => {
        syntheticEvent.preventDefault();
        const success = handleEventSubmission('eventInputName', 'eventInputDate', 'eventInputTime');
        if (success) {
            toggleModalVisibility(addEventModalOverlay, false);
            addEventSubmissionForm.reset();
        }
    });
}

const alternateEventForm = document.getElementById('addEventForm');
const alternateModalOverlay = document.getElementById('eventModalOverlay');
if (alternateEventForm) {
    alternateEventForm.addEventListener('submit', (syntheticEvent) => {
        syntheticEvent.preventDefault();
        const success = handleEventSubmission('eventName', 'eventDate', 'eventTime', 'eventDesc');
        if (success) {
            if (alternateModalOverlay) alternateModalOverlay.classList.remove('active');
            alternateEventForm.reset();
        }
    });
}

window.initiateEventEditWorkflow = function(targetEventIdentityKey) {
    const targetedEventItem = applicationStateEventsArray.find(e => e.id === targetEventIdentityKey);
    if (!targetedEventItem) return;

    internalActiveEditingEventId = targetEventIdentityKey;

    document.getElementById('editInputName').value = targetedEventItem.name;
    document.getElementById('editInputDate').value = targetedEventItem.date;
    document.getElementById('editInputTime').value = targetedEventItem.time;

    toggleModalVisibility(dayInspectorModalOverlay, false);
    toggleModalVisibility(editEventModalOverlay, true);
};

if (editEventSubmissionForm) {
    editEventSubmissionForm.addEventListener('submit', (syntheticEvent) => {
        syntheticEvent.preventDefault();

        const modifiedNameString = document.getElementById('editInputName').value.trim();
        const modifiedDateString = document.getElementById('editInputDate').value;
        const modifiedTimeString = document.getElementById('editInputTime').value;

        if (!modifiedNameString || !modifiedDateString || !modifiedTimeString) {
            alert("All update verification parameters must contain complete entries.");
            return;
        }

        const primaryEventIndex = applicationStateEventsArray.findIndex(e => e.id === internalActiveEditingEventId);
        if (primaryEventIndex === -1) return;

        const existingDateValueString = applicationStateEventsArray[primaryEventIndex].date;

        if (existingDateValueString !== modifiedDateString) {
            const potentialBlockCount = applicationStateEventsArray.filter(e => e.date === modifiedDateString).length;
            if (potentialBlockCount >= 20) {
                alert("Maximum events reached for this date.");
                return;
            }
        }

        applicationStateEventsArray[primaryEventIndex].name = modifiedNameString;
        applicationStateEventsArray[primaryEventIndex].title = modifiedNameString;
        applicationStateEventsArray[primaryEventIndex].date = modifiedDateString;
        applicationStateEventsArray[primaryEventIndex].time = modifiedTimeString;

        persistStateAndRefreshViews();
        toggleModalVisibility(editEventModalOverlay, false);
    });
}

window.executeDirectDeletionWorkflow = function(targetEventIdentityKey) {
    if (confirm("Are you certain you wish to delete this scheduled event permanently?")) {
        applicationStateEventsArray = applicationStateEventsArray.filter(e => e.id !== targetEventIdentityKey);
        persistStateAndRefreshViews();
        
        const runtimeReCheckArray = applicationStateEventsArray.filter(e => e.date === targetSelectedInspectedDateKey);
        if (runtimeReCheckArray.length > 0) {
            renderDateInspectorModalListViewContents(runtimeReCheckArray, targetSelectedInspectedDateKey);
        } else {
            toggleModalVisibility(dayInspectorModalOverlay, false);
        }
    }
};

if (deleteEventActionBtn) {
    deleteEventActionBtn.addEventListener('click', () => {
        if (internalActiveEditingEventId) {
            toggleModalVisibility(editEventModalOverlay, false);
            executeDirectDeletionWorkflow(internalActiveEditingEventId);
        }
    });
}

/* ==========================================================================
   G. EVENT LISTENERS CONNECTIVITY MAPPINGS BINDINGS
   ========================================================================== */
if (prevMonthBtn) {
    prevMonthBtn.addEventListener('click', () => {
        calendarInternalFocusDate.setMonth(calendarInternalFocusDate.getMonth() - 1);
        computeRenderGridCalendarFrame();
    });
}

if (nextMonthBtn) {
    nextMonthBtn.addEventListener('click', () => {
        calendarInternalFocusDate.setMonth(calendarInternalFocusDate.getMonth() + 1);
        computeRenderGridCalendarFrame();
    });
}

if (openAddEventModalBtn) {
    openAddEventModalBtn.addEventListener('click', () => {
        const todayObjectString = new Date();
        const compiledISOStringStringKey = createDateStringISOKey(todayObjectString.getFullYear(), todayObjectString.getMonth(), todayObjectString.getDate());
        
        const inputDate = document.getElementById('eventInputDate');
        if (inputDate) inputDate.value = compiledISOStringStringKey;
        
        const inputName = document.getElementById('eventInputName');
        if (inputName) inputName.value = "";
        
        const inputTime = document.getElementById('eventInputTime');
        if (inputTime) inputTime.value = "09:00";
        
        toggleModalVisibility(addEventModalOverlay, true);
    });
}

const alternateOpenBtn = document.getElementById('openAddEventModal');
if (alternateOpenBtn && alternateModalOverlay) {
    alternateOpenBtn.addEventListener('click', () => alternateModalOverlay.classList.add('active'));
}

if (cancelAddEventModalBtn) cancelAddEventModalBtn.addEventListener('click', () => toggleModalVisibility(addEventModalOverlay, false));
if (closeInspectorModalBtn) closeInspectorModalBtn.addEventListener('click', () => toggleModalVisibility(dayInspectorModalOverlay, false));
if (cancelEditEventModalBtn) cancelEditEventModalBtn.addEventListener('click', () => toggleModalVisibility(editEventModalOverlay, false));

const alternateCloseBtn = document.getElementById('closeEventModal');
if (alternateCloseBtn && alternateModalOverlay) {
    alternateCloseBtn.addEventListener('click', () => alternateModalOverlay.classList.remove('active'));
}

window.addEventListener('click', (syntheticEvent) => {
    if (syntheticEvent.target === addEventModalOverlay) toggleModalVisibility(addEventModalOverlay, false);
    if (syntheticEvent.target === dayInspectorModalOverlay) toggleModalVisibility(dayInspectorModalOverlay, false);
    if (syntheticEvent.target === editEventModalOverlay) toggleModalVisibility(editEventModalOverlay, false);
    if (syntheticEvent.target === alternateModalOverlay) alternateModalOverlay.classList.remove('active');
    if (syntheticEvent.target === logoutModalOverlay) toggleModalVisibility(logoutModalOverlay, false);
});

/* ==========================================================================
   H. COLD APP EXECUTION APPLICATION SPINUP START BOOT
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const welcomeEl = document.getElementById('welcomeName');
    if (welcomeEl && currentUser) {
        welcomeEl.textContent = currentUser.firstName || currentUser.username || 'Friend';
    }
    
    computeRenderGridCalendarFrame();
});