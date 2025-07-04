document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const balanceEl = document.getElementById('balance');
    const betAmountEl = document.getElementById('bet-amount');
    const dealBtn = document.getElementById('deal-btn');
    const hitBtn = document.getElementById('hit-btn');
    const standBtn = document.getElementById('stand-btn');
    const playerHandEl = document.getElementById('player-hand');
    const dealerHandEl = document.getElementById('dealer-hand');
    const playerScoreEl = document.getElementById('player-score');
    const dealerScoreEl = document.getElementById('dealer-score');
    const statusMessageEl = document.getElementById('status-message');
    const bettingControlsEl = document.getElementById('betting-controls');
    const actionControlsEl = document.getElementById('action-controls');

    // Game State
    let balance;
    let currentBet = 0;
    let deck = [];
    let playerHand = [];
    let dealerHand = [];
    let playerScore = 0;
    let dealerScore = 0;
    let isPlayerTurn = false;

    const SUITS = ['♥', '♦', '♣', '♠'];
    const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

    // --- BALANCE MANAGEMENT ---
    function saveBalance() {
        localStorage.setItem('gemstoneMines_balance', balance);
    }

    function loadBalance() {
        const savedBalance = localStorage.getItem('gemstoneMines_balance');
        if (savedBalance !== null) {
            balance = parseInt(savedBalance, 10);
        } else {
            balance = 1000; // Default balance for first-time players
            saveBalance();
        }
        updateBalanceUI();
    }

    // --- CORE GAME FUNCTIONS ---

    function createDeck() {
        deck = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                deck.push({ rank, suit });
            }
        }
    }

    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }

    function getCardValue(rank) {
        if (['J', 'Q', 'K'].includes(rank)) return 10;
        if (rank === 'A') return 11;
        return parseInt(rank);
    }

    function calculateScore(hand) {
        let score = 0;
        let aceCount = 0;
        for (const card of hand) {
            score += getCardValue(card.rank);
            if (card.rank === 'A') {
                aceCount++;
            }
        }
        while (score > 21 && aceCount > 0) {
            score -= 10;
            aceCount--;
        }
        return score;
    }

    function dealInitialCards() {
        playerHand.push(deck.pop());
        dealerHand.push(deck.pop());
        playerHand.push(deck.pop());
        dealerHand.push(deck.pop());

        playerScore = calculateScore(playerHand);
        dealerScore = calculateScore(dealerHand);

        renderHands();
    }

    // --- UI RENDERING ---

    function renderCard(card, isHidden = false) {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        if (isHidden) {
            cardEl.classList.add('hidden');
        } else {
            const color = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
            cardEl.classList.add(color);
            cardEl.innerHTML = `
                <span class="rank">${card.rank}</span>
                <span class="suit">${card.suit}</span>
                <span class="suit flipped">${card.suit}</span>
            `;
        }
        return cardEl;
    }

    function renderHands(revealDealerCard = false) {
        playerHandEl.innerHTML = '';
        dealerHandEl.innerHTML = '';

        playerHand.forEach(card => playerHandEl.appendChild(renderCard(card)));
        dealerHand.forEach((card, index) => {
            if (index === 0 && !revealDealerCard) {
                dealerHandEl.appendChild(renderCard(card, true));
            } else {
                dealerHandEl.appendChild(renderCard(card));
            }
        });

        playerScoreEl.textContent = playerScore;
        dealerScoreEl.textContent = revealDealerCard ? dealerScore : getCardValue(dealerHand[1].rank);
    }

    function updateBalanceUI() {
        balanceEl.textContent = balance;
    }

    function showStatus(message, color = '#ffd04d') {
        statusMessageEl.textContent = message;
        statusMessageEl.style.color = color;
    }

    // --- GAME FLOW ---

    function startGame() {
        currentBet = parseInt(betAmountEl.value);
        if (currentBet > balance) {
            showStatus('Not enough balance!', '#f44336');
            return;
        }
        if (currentBet <= 0) {
            showStatus('Please enter a valid bet!', '#f44336');
            return;
        }

        balance -= currentBet;
        saveBalance();
        updateBalanceUI();

        bettingControlsEl.classList.add('hidden');
        actionControlsEl.classList.remove('hidden');
        hitBtn.disabled = false;
        standBtn.disabled = false;

        createDeck();
        shuffleDeck();

        playerHand = [];
        dealerHand = [];

        dealInitialCards();

        if (playerScore === 21) {
            showStatus('Blackjack! You win!', '#4caf50');
            endRound(currentBet * 2.5); // Blackjack pays 3:2
        } else {
            isPlayerTurn = true;
            showStatus('Your turn. Hit or Stand?');
        }
    }

    function playerHit() {
        if (!isPlayerTurn) return;

        playerHand.push(deck.pop());
        playerScore = calculateScore(playerHand);
        renderHands();

        if (playerScore > 21) {
            showStatus('Bust! You lose.', '#f44336');
            endRound(0);
        } else if (playerScore === 21) {
            playerStand();
        }
    }

    function playerStand() {
        isPlayerTurn = false;
        dealerTurn();
    }

    function dealerTurn() {
        renderHands(true); // Reveal dealer's hidden card

        const dealerInterval = setInterval(() => {
            if (dealerScore < 17) {
                dealerHand.push(deck.pop());
                dealerScore = calculateScore(dealerHand);
                renderHands(true);
            } else {
                clearInterval(dealerInterval);
                determineWinner();
            }
        }, 1000);
    }

    function determineWinner() {
        renderHands(true);

        if (dealerScore > 21) {
            showStatus('Dealer busts! You win!', '#4caf50');
            endRound(currentBet * 2);
        } else if (playerScore > dealerScore) {
            showStatus('You win!', '#4caf50');
            endRound(currentBet * 2);
        } else if (dealerScore > playerScore) {
            showStatus('Dealer wins!', '#f44336');
            endRound(0);
        } else {
            showStatus('Push! It\'s a tie.', '#ff9800');
            endRound(currentBet); // Return the bet
        }
    }

    function endRound(winnings) {
        balance += winnings;
        saveBalance();
        updateBalanceUI();

        isPlayerTurn = false;
        hitBtn.disabled = true;
        standBtn.disabled = true;

        setTimeout(() => {
            bettingControlsEl.classList.remove('hidden');
            actionControlsEl.classList.add('hidden');
            showStatus('Place your bet to start!');
        }, 3000);
    }

    // --- EVENT LISTENERS ---

    dealBtn.addEventListener('click', startGame);
    hitBtn.addEventListener('click', playerHit);
    standBtn.addEventListener('click', playerStand);

    // Initialize UI
    loadBalance();
});