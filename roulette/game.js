// Game state
const BALANCE_KEY = "gemstoneMines_balance";
let balance = 0;
let currentBet = 10;
let currentBetColor = null;
let spinning = false;
let history = [];
let segmentAngles = {}; // To store the calculated angle for each segment index

// Payout multipliers
const PAYOUTS = {
    red: 2,
    black: 2,
    green: 14  // Higher payout for green since it's less likely
};

// Roulette segments with 12 red, 12 black, and 1 green (0)
const rouletteNumbers = [
    { number: 0, color: 'green' },
    { number: 2, color: 'black' },
    { number: 1, color: 'red' },
    { number: 4, color: 'black' },
    { number: 3, color: 'red' },
    { number: 6, color: 'black' },
    { number: 5, color: 'red' },
    { number: 8, color: 'black' },
    { number: 7, color: 'red' },
    { number: 10, color: 'black' },
    { number: 9, color: 'red' },
    { number: 11, color: 'black' },
    { number: 12, color: 'red' },
    { number: 13, color: 'black' },
    { number: 14, color: 'red' },
    { number: 15, color: 'black' },
    { number: 16, color: 'red' },
    { number: 17, color: 'black' },
    { number: 18, color: 'red' },
    { number: 20, color: 'black' },
    { number: 19, color: 'red' },
    { number: 22, color: 'black' },
    { number: 21, color: 'red' },
    { number: 24, color: 'black' },
    { number: 23, color: 'red' },
];

// DOM elements
const balanceEl = document.getElementById('balance');
const betAmountEl = document.getElementById('betAmount');
const spinBtn = document.getElementById('spinBtn');
const clearBetsBtn = document.getElementById('clearBets');
const rouletteWheel = document.getElementById('rouletteWheel');
const lastNumberEl = document.getElementById('lastNumber');
const payoutEl = document.getElementById('payout');
const winChanceEl = document.getElementById('winChance');
const statusMessageEl = document.getElementById('statusMessage');
const historyEl = document.getElementById('history');
const bettingGridEl = document.getElementById('bettingGrid');

// Load balance from localStorage
function loadBalance() {
    const stored = localStorage.getItem(BALANCE_KEY);
    if (stored !== null && !isNaN(parseFloat(stored))) {
        balance = parseFloat(stored);
    } else {
        balance = 1000; // Default starting balance
        saveBalance();
    }
}

// Save balance to localStorage
function saveBalance() {
    localStorage.setItem(BALANCE_KEY, balance.toFixed(2));
}

// Initialize the game
function initGame() {
    // Disable spin button until the wheel angles are calculated
    spinBtn.disabled = true;
    showStatus('Initializing wheel...', 'info');

    loadBalance();
    createRouletteWheel();

    // We must wait for the DOM to be fully painted before calculating angles.
    requestAnimationFrame(() => {
        setTimeout(() => { // A nested timeout for extra safety
            const segmentCount = rouletteNumbers.length;
            const segmentAngle = 360 / segmentCount;
            document.querySelectorAll('.wheel-tip').forEach((tip, index) => {
                // This is the correct calculation.
                // We need to align the CENTER of the segment with the arrow at the top.
                const centerOfSegment = (index * segmentAngle) + (segmentAngle / 2);
                // To bring that center to the top (0 deg), we rotate by its negative.
                segmentAngles[index] = 360 - centerOfSegment;
            });

            console.log('Roulette Wheel Angles Correctly Initialized:', segmentAngles);

            // Now that angles are ready, enable the button
            spinBtn.disabled = false;
            showStatus('Ready to play!', 'success');
            // Hide status after a bit
            setTimeout(() => {
                if (statusMessageEl.textContent === 'Ready to play!') {
                    showStatus('', 'info');
                }
            }, 2000);
        }, 50);
    });

    loadGameState();
    setupEventListeners();
    updateUI();
}

// Create the roulette wheel with color tips
function createRouletteWheel() {
    rouletteWheel.innerHTML = '';
    
    // Use all numbers in the array (25 total: 12 red, 12 black, 1 green)
    rouletteNumbers.forEach((item, index) => {
        const angle = (index / rouletteNumbers.length) * 360;
        const numberEl = document.createElement('div');
        numberEl.className = `wheel-tip ${item.color}`;
        numberEl.style.transform = `rotate(${angle}deg)`;
        // Add data attributes for easy identification
        numberEl.dataset.number = item.number;
        numberEl.dataset.color = item.color;
        rouletteWheel.appendChild(numberEl);
    });
}

// Color button click handler
document.querySelectorAll('.color-option').forEach(button => {
    button.addEventListener('click', () => {
        if (spinning) return;
        
        const color = button.dataset.color;
        
        // If clicking the same color, clear the bet
        if (currentBetColor === color) {
            clearBet();
        } else {
            // Otherwise, set the new bet color
            placeBet(color);
        }
    });
});

// Place a bet on a color
function placeBet(color) {
    if (spinning) return;
    
    if (currentBet > balance) {
        showStatus('Not enough balance!', 'error');
        return;
    }
    
    // Set the current bet color and update UI
    currentBetColor = color;
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.color === color);
    });
    
    updateUI();
    showStatus(`Bet ${currentBet} on ${color.toUpperCase()}`, 'info');
    
    // Save game state
    saveGameState();
}

// Clear the current bet
function clearBet() {
    if (spinning) return;
    
    currentBetColor = null;
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('active');
    });
    
    updateUI();
    showStatus('Bet cleared!', 'info');
    
    // Save game state
    saveGameState();
}

// Set up event listeners
function setupEventListeners() {
    // Spin button
    spinBtn.addEventListener('click', spinWheel);
    
    // Clear bets button
    clearBetsBtn.addEventListener('click', clearBets);
    
    // Bet amount input
    betAmountEl.addEventListener('change', updateCurrentBet);
    betAmountEl.addEventListener('input', updateCurrentBet);
    
    // Bet options (multipliers)
    document.querySelectorAll('.bet-option').forEach(option => {
        option.addEventListener('click', () => {
            const multiplier = option.dataset.multiplier;
            if (multiplier === 'max') {
                betAmountEl.value = balance;
            } else if (multiplier === '0.5') {
                betAmountEl.value = Math.max(1, Math.floor(betAmountEl.value * 0.5));
            } else {
                betAmountEl.value = Math.max(1, Math.floor(betAmountEl.value * multiplier));
            }
            updateCurrentBet();
        });
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !spinning) {
            spinWheel();
        } else if (e.key === 'Escape') {
            clearBets();
        } else if (e.key >= '1' && e.key <= '9') {
            // Quick bet with number keys (1-9)
            const betAmount = parseInt(e.key) * 10;
            betAmountEl.value = betAmount;
            updateCurrentBet();
        } else if (e.key === '0') {
            // Max bet with 0 key
            betAmountEl.value = balance;
            updateCurrentBet();
        }
    });
}

// Update current bet from input
function updateCurrentBet() {
    currentBet = parseInt(betAmountEl.value) || 1;
    if (currentBet < 1) {
        currentBet = 1;
        betAmountEl.value = 1;
    }
    if (currentBet > balance) {
        currentBet = balance;
        betAmountEl.value = balance;
    }
    updateWinChance();
}

// Calculate and update win chance
function updateWinChance() {
    if (!currentBetColor) {
        winChanceEl.textContent = '0%';
        return;
    }
    
    // Calculate win chance based on color
    let chance;
    if (currentBetColor === 'green') {
        // 1 green out of 25 total segments
        chance = (1 / 25 * 100).toFixed(1);
    } else {
        // 12 red/black out of 25 total segments
        chance = (12 / 25 * 100).toFixed(1);
    }
    
    winChanceEl.textContent = `${chance}%`;
}

// Update bet display
function updateBetDisplay(betType) {
    const betDisplay = document.getElementById(`bet-${betType}`);
    if (bets[betType]) {
        betDisplay.textContent = bets[betType].amount;
        betDisplay.style.display = 'block';
    } else {
        betDisplay.textContent = '';
        betDisplay.style.display = 'none';
    }
}

// Clear all bets (kept for compatibility but simplified)
function clearBets() {
    clearBet();
}

// Spin the wheel
function spinWheel() {
    if (spinning) return;
    // Check if the angle map is ready
    if (Object.keys(segmentAngles).length === 0) {
        showStatus('Wheel is not ready, please wait a moment.', 'error');
        return;
    }
    if (!currentBetColor) {
        showStatus('Please select a color to bet on!', 'error');
        return;
    }
    spinning = true;
    spinBtn.disabled = true;
    clearBetsBtn.disabled = true;

    // 1. PRE-DETERMINE THE WINNER
    const resultIndex = Math.floor(Math.random() * rouletteNumbers.length);
    const result = rouletteNumbers[resultIndex];

    // 2. LOOK UP THE PRE-CALCULATED ANGLE
    const landingRotation = segmentAngles[resultIndex];
    const totalRotation = (360 * 8) + landingRotation; // 8 full spins
    const spinDuration = 6; // 6 seconds

    // This function will be called when the spin animation ends
    const onSpinEnd = () => {
        processResult(result);
        
        spinning = false;
        spinBtn.disabled = false;
        clearBetsBtn.disabled = false;
        saveGameState();

        // Normalize angle to prevent jump on next spin
        const finalAngle = totalRotation % 360;
        rouletteWheel.style.transition = 'none';
        rouletteWheel.style.transform = `rotate(${finalAngle}deg)`;
    };

    // 3. APPLY ANIMATION AND SET UP EVENT LISTENER
    // Using 'transitionend' is more reliable than setTimeout
    rouletteWheel.addEventListener('transitionend', onSpinEnd, { once: true });
    rouletteWheel.style.transition = `transform ${spinDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
    rouletteWheel.style.transform = `rotate(${totalRotation}deg)`;

    showStatus('Spinning...', 'info');
}

// Process the spin result
function processResult(result) {
    let winAmount = 0;
    let isWin = false;
    
    // Check if the bet color matches the result
    if (currentBetColor === result.color) {
        // Calculate winnings based on the color's payout
        winAmount = currentBet * PAYOUTS[result.color];
        balance += winAmount;
        isWin = true;
    } else {
        // Deduct the bet amount if lost
        balance -= currentBet;
    }
    
    // Add to history
    history.unshift({
        number: result.number,
        color: result.color,
        timestamp: new Date().getTime()
    });
    
    // Keep only last 10 history items
    if (history.length > 10) {
        history = history.slice(0, 10);
    }
    
    // Update UI
    updateUI();
    updateHistory();
    
    // Show result message
    if (isWin) {
        showStatus(`You won ${winAmount}! The ball landed on ${result.number} (${result.color.toUpperCase()})`, 'success');
    } else {
        showStatus(`The ball landed on ${result.number} (${result.color.toUpperCase()})`, 'error');
    }
    
    // Clear the current bet
    clearBet();
}

// Update history display
function updateHistory() {
    historyEl.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = `history-number ${item.color}`;
        historyItem.textContent = item.number;
        historyEl.appendChild(historyItem);
    });
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessageEl.textContent = message;
    statusMessageEl.className = `status-message ${type}`;
    statusMessageEl.style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        statusMessageEl.style.display = 'none';
    }, 3000);
}

// Update UI elements
function updateUI() {
    // Update balance
    balanceEl.textContent = balance;
    
    // Update current bet
    betAmountEl.value = currentBet;
    
    // Update win chance
    updateWinChance();
    
    // Update last number
    if (history.length > 0) {
        const lastNumber = history[0].number;
        const lastColor = history[0].color;
        lastNumberEl.textContent = `${lastNumber} (${lastColor.toUpperCase()})`;
        lastNumberEl.className = lastColor;
    } else {
        lastNumberEl.textContent = '-';
        lastNumberEl.className = '';
    }
    
    // Update current bet display
    const currentBetAmountEl = document.getElementById('currentBetAmount');
    const currentBetColorEl = document.getElementById('currentBetColor');
    
    if (currentBetColor) {
        currentBetAmountEl.textContent = currentBet;
        currentBetColorEl.textContent = currentBetColor.toUpperCase();
        currentBetColorEl.className = currentBetColor;
    } else {
        currentBetAmountEl.textContent = '0';
        currentBetColorEl.textContent = '-';
        currentBetColorEl.className = '';
    }
}

// Save game state to localStorage
function saveGameState() {
    saveBalance(); // Save the balance using the shared balance system
    
    const gameState = {
        currentBet,
        currentBetColor,
        history
    };
    
    localStorage.setItem('rouletteGameState', JSON.stringify(gameState));
}

// Load game state from localStorage
function loadGameState() {
    const savedState = localStorage.getItem('rouletteGameState');
    
    if (savedState) {
        try {
            const gameState = JSON.parse(savedState);
            
            // Only load non-balance related state
            currentBet = gameState.currentBet || 10;
            currentBetColor = gameState.currentBetColor || null;
            history = gameState.history || [];
            
            // Update active color button
            if (currentBetColor) {
                document.querySelectorAll('.color-option').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.color === currentBetColor);
                });
            }
            
        } catch (e) {
            console.error('Error loading game state:', e);
        }
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', initGame);
