document.addEventListener('DOMContentLoaded', () => {
    const balanceElement = document.getElementById('balance');
    const betAmountInput = document.getElementById('betAmount');
    const flipBtn = document.getElementById('flipBtn');
    const clearBetsBtn = document.getElementById('clearBets');
    const coin = document.getElementById('coin');
    const statusMessage = document.getElementById('statusMessage');
    const historyContainer = document.getElementById('history');
    const currentBetAmountElement = document.getElementById('currentBetAmount');
    const currentBetSideElement = document.getElementById('currentBetSide');
    const lastResultElement = document.getElementById('lastResult');

    const BALANCE_KEY = "gemstoneMines_balance";
    let balance = 1000;
    let currentBet = {
        amount: 0,
        side: null
    };

    function saveBalance() {
        localStorage.setItem(BALANCE_KEY, balance.toFixed(2));
    }

    function loadBalance() {
        const stored = localStorage.getItem(BALANCE_KEY);
        if (stored !== null && !isNaN(parseFloat(stored))) {
            balance = parseFloat(stored);
        } else {
            balance = 1000; // Default starting balance
            saveBalance();
        }
        updateBalance(balance);
    }

    function updateBalance(amount) {
        balance = amount;
        balanceElement.textContent = balance;
        saveBalance();
    }

    function updateCurrentBetDisplay() {
        currentBetAmountElement.textContent = currentBet.amount;
        currentBetSideElement.textContent = currentBet.side ? currentBet.side.toUpperCase() : '-';
    }

    function showStatus(message, type = 'info', duration = 3000) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.style.display = 'block';
        if (duration) {
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, duration);
        }
    }

    function addToHistory(side) {
        const item = document.createElement('div');
        item.className = `history-item ${side}`;
        const img = document.createElement('img');
        img.src = side === 'gold' ? 'gold.png' : 'blue.png';
        img.alt = side;
        item.appendChild(img);
        historyContainer.prepend(item);
        if (historyContainer.children.length > 10) {
            historyContainer.removeChild(historyContainer.lastChild);
        }
    }

    document.querySelectorAll('.bet-option').forEach(button => {
        button.addEventListener('click', () => {
            const multiplier = button.dataset.multiplier;
            let betAmount = parseInt(betAmountInput.value);

            if (multiplier === 'max') {
                betAmountInput.value = balance;
            } else if (multiplier.includes('+')) {
                betAmountInput.value = betAmount + parseInt(multiplier);
            } else {
                betAmountInput.value = Math.round(betAmount * parseFloat(multiplier));
            }
        });
    });

    document.querySelectorAll('.side-option').forEach(button => {
        button.addEventListener('click', () => {
            const side = button.dataset.side;
            const betAmount = parseInt(betAmountInput.value);

            if (betAmount <= 0) {
                showStatus('Please enter a valid bet amount.', 'error');
                return;
            }
            if (betAmount > balance) {
                showStatus('Insufficient balance.', 'error');
                return;
            }

            currentBet.amount = betAmount;
            currentBet.side = side;

            document.querySelectorAll('.side-option').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            updateCurrentBetDisplay();
            showStatus(`Bet placed on ${side.toUpperCase()}`, 'info');
        });
    });

    flipBtn.addEventListener('click', () => {
        if (!currentBet.side || currentBet.amount === 0) {
            showStatus('Please place a bet first.', 'error');
            return;
        }
        if (coin.classList.contains('flipping')) return;

        updateBalance(balance - currentBet.amount);

        // Reset coin state before flipping
        coin.classList.remove('show-blue');
        
        // Add flipping animation
        coin.classList.add('flipping');
        flipBtn.disabled = true;
        clearBetsBtn.disabled = true;

        const result = Math.random() < 0.5 ? 'gold' : 'blue';

        setTimeout(() => {
            coin.classList.remove('flipping');
            
            if (result === 'blue') {
                coin.classList.add('show-blue');
            }

            lastResultElement.textContent = result.toUpperCase();
            addToHistory(result);

            if (result === currentBet.side) {
                const winnings = currentBet.amount * 2;
                updateBalance(balance + winnings);
                showStatus(`You won ${winnings}!`, 'success');
            } else {
                showStatus('You lost!', 'error');
            }

            clearBet();
            flipBtn.disabled = false;
            clearBetsBtn.disabled = false;

        }, 1000);
    });

    function clearBet() {
        currentBet.amount = 0;
        currentBet.side = null;
        document.querySelectorAll('.side-option').forEach(btn => btn.classList.remove('active'));
        updateCurrentBetDisplay();
    }

    clearBetsBtn.addEventListener('click', () => {
        clearBet();
        showStatus('Bets cleared.', 'info');
    });

    loadBalance();
    updateCurrentBetDisplay();
});
