// Global Storage Keys
const STORAGE_KEYS = {
    TASKS: 'scholarsync_tasks',
    EVENTS: 'scholarsync_events',
    NOTES: 'scholarsync_notes'
};

// Reusable Helper Functions
function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    // Dispatch a storage event so other open tabs/windows can sync immediately if needed
    window.dispatchEvent(new Event('storage'));
}

function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

// Date Utility helper to check if a date string falls in the current week (Sunday to Saturday)
function isCurrentWeek(dateString) {
    if (!dateString) return false;
    const targetDate = new Date(dateString);
    const now = new Date();
    
    // Get start of current week (Sunday)
    const currentWeekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Get end of current week (Saturday)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);
    
    return targetDate >= currentWeekStart && targetDate <= currentWeekEnd;
}