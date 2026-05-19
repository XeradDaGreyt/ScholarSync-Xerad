const startButton = document.getElementById('startTimer');
const pauseButton = document.getElementById('pauseTimer');
const resetButton = document.getElementById('resetTimer');
const timerDisplay = document.getElementById('timer-display');

// 2. Define timer states
let countdownInterval = null;
let secondsLeft = 25 * 60; // 25 minutes converted to seconds (1500s)

// 3. Helper function to format and update the time on screen
function updateTimerUI() {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    
    // padStart ensures numbers look like "05" instead of "5"
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    
    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

// 4. Action function: Start
function startTimer() {
    // Prevent creating multiple intervals if 'Start' is clicked repeatedly
    if (countdownInterval !== null) return;

    countdownInterval = setInterval(() => {
        if (secondsLeft > 0) {
            secondsLeft--;
            updateTimerUI();
        } else {
            // Timer hits 00:00
            clearInterval(countdownInterval);
            countdownInterval = null;
            alert("Time is up! Great work.");
        }
    }, 1000); // Runs every 1 second (1000 milliseconds)
}

// 5. Action function: Pause
function pauseTimer() {
    clearInterval(countdownInterval);
    countdownInterval = null; // Resets interval status so it can restart cleanly
}

// 6. Action function: Reset
function resetTimer() {
    pauseTimer(); // Always clear any active countdown first
    secondsLeft = 25 * 60; // Set back to exactly 25 minutes
    updateTimerUI();
}

// 7. Attach event listeners to your buttons
startButton.addEventListener('click', startTimer);
pauseButton.addEventListener('click', pauseTimer);
resetButton.addEventListener('click', resetTimer);