class SimpleMinesGame {
    constructor() {
        this.players = [];
        this.mine = null;
        this.casinoBalance = 10000;
        this.userBalance = 10; // Начальный баланс 10 TON
        this.currentPlayerCell = null;
        this.isGameActive = false;
        
        this.init();
    }

    init() {
        this.createGrid();
        this.setupEventListeners();
        this.updateUI();
    }

    createGrid() {
        const grid = document.getElementById('gameGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= 9; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.innerHTML = `<span>${i}</span>`;
            cell.dataset.cell = i;
            cell.addEventListener('click', () => this.selectCell(i));
            grid.appendChild(cell);
        }
    }

    selectCell(cellNumber) {
        if (this.isGameActive) return;
        
        this.currentPlayerCell = cellNumber;
        this.updateCellSelectionUI();
    }

    updateCellSelectionUI() {
        const selectedCellElement = document.getElementById('selectedCell');
        if (selectedCellElement) {
            selectedCellElement.textContent = this.currentPlayerCell ? this.currentPlayerCell : '-';
        }
        
        document.querySelectorAll('.cell').forEach(cell => {
            const cellNum = parseInt(cell.dataset.cell);
            cell.classList.toggle('selected', cellNum === this.currentPlayerCell);
        });
    }

    placeBet() {
        if (this.isGameActive) {
            this.showMessage('Игра уже началась!');
            return;
        }
        
        const betInput = document.getElementById('playerBet');
        const bet = parseInt(betInput.value);
        
        if (!bet || bet < 1) {
            this.showMessage('Минимальная ставка 1 TON');
            return;
        }
        
        if (bet > this.userBalance) {
            this.showMessage('Недостаточно средств');
            return;
        }
        
        if (!this.currentPlayerCell) {
            this.showMessage('Выберите ячейку');
            return;
        }
        
        const userAlreadyBet = this.players.some(player => player.isUser);
        if (userAlreadyBet) {
            this.showMessage('Вы уже поставили');
            return;
        }
        
        const player = {
            id: Date.now(),
            bet: bet,
            cell: this.currentPlayerCell,
            order: this.players.length + 1,
            isUser: true,
            name: 'Вы'
        };
        
        this.players.push(player);
        this.userBalance -= bet;
        betInput.value = '';
        this.updateCellSelectionUI();
        this.updatePlayersList();
        this.updateUI();
    }

    addBot() {
        if (this.isGameActive) {
            this.showMessage('Нельзя добавлять ботов во время игры');
            return;
        }
        
        const availableCells = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const usedCells = this.players.map(p => p.cell);
        const freeCells = availableCells.filter(cell => !usedCells.includes(cell));
        
        if (freeCells.length === 0) {
            this.showMessage('Все ячейки заняты');
            return;
        }
        
        const randomCell = freeCells[Math.floor(Math.random() * freeCells.length)];
        const botBets = [1, 2, 5];
        const randomBet = botBets[Math.floor(Math.random() * botBets.length)];
        
        const bot = {
            id: Date.now(),
            bet: randomBet,
            cell: randomCell,
            order: this.players.length + 1,
            isUser: false,
            name: 'Бот'
        };
        
        this.players.push(bot);
        this.updatePlayersList();
        this.updateUI();
    }

    updatePlayersList() {
        const list = document.getElementById('playersList');
        if (!list) return;
        
        list.innerHTML = '';
        
        this.players.forEach(player => {
            const playerEl = document.createElement('div');
            playerEl.className = `player ${player.isUser ? 'user' : ''}`;
            playerEl.innerHTML = `
                <div class="player-info">${player.name} (${player.cell})</div>
                <div class="player-bet">${player.bet} TON</div>
            `;
            list.appendChild(playerEl);
        });
    }

    startGame() {
        if (this.players.length < 1) {
            this.showMessage('Добавьте игроков');
            return;
        }
        
        this.isGameActive = true;
        this.generateMine();
        this.calculateResults();
        this.updateUI();
        
        const startGameBtn = document.getElementById('startGame');
        const nextRoundBtn = document.getElementById('nextRound');
        if (startGameBtn) startGameBtn.disabled = true;
        if (nextRoundBtn) nextRoundBtn.disabled = false;
    }

    generateMine() {
        const cellStats = {};
        for (let i = 1; i <= 9; i++) {
            cellStats[i] = { totalBet: 0, players: 0 };
        }
        
        this.players.forEach(player => {
            cellStats[player.cell].totalBet += player.bet;
            cellStats[player.cell].players += 1;
        });
        
        const usedCells = Object.entries(cellStats)
            .filter(([cell, stats]) => stats.players > 0)
            .map(([cell, stats]) => ({
                cell: parseInt(cell),
                totalBet: stats.totalBet,
                players: stats.players
            }));
        
        if (usedCells.length === 1) {
            this.mine = usedCells[0].cell;
        } else if (usedCells.length === 2) {
            const cell1 = usedCells[0];
            const cell2 = usedCells[1];
            
            const ratio1 = cell1.totalBet / cell2.totalBet;
            const ratio2 = cell2.totalBet / cell1.totalBet;
            
            if (ratio1 <= 2 && ratio2 <= 2) {
                this.mine = cell1.totalBet < cell2.totalBet ? cell1.cell : cell2.cell;
            } else {
                this.mine = cell1.totalBet > cell2.totalBet ? cell1.cell : cell2.cell;
            }
        } else {
            const minPlayers = Math.min(...usedCells.map(cell => cell.players));
            const leastPopularCells = usedCells.filter(cell => cell.players === minPlayers);
            
            const randomIndex = Math.floor(Math.random() * leastPopularCells.length);
            this.mine = leastPopularCells[randomIndex].cell;
        }
    }

    calculateResults() {
        const winners = this.players.filter(player => player.cell !== this.mine);
        const losers = this.players.filter(player => player.cell === this.mine);
        
        const lostAmount = losers.reduce((sum, player) => sum + player.bet, 0);
        const totalBonus = winners.reduce((sum, player) => sum + (player.bet * 0.25), 0);
        
        winners.forEach(winner => {
            const bonus = winner.bet * 0.25;
            winner.payout = winner.bet + bonus;
            winner.netResult = bonus;
            
            if (winner.isUser) {
                this.userBalance += winner.payout;
                this.showMessage(`Вы выиграли +${bonus.toFixed(2)} TON!`);
            }
        });
        
        losers.forEach(loser => {
            loser.payout = 0;
            loser.netResult = -loser.bet;
            if (loser.isUser) {
                this.showMessage('Вы проиграли');
            }
        });
        
        this.casinoIncome = lostAmount - totalBonus;
        this.casinoBalance += this.casinoIncome;
        
        this.highlightCells();
        
        // Обновляем классы игроков
        setTimeout(() => {
            this.updatePlayersListWithResults(winners);
        }, 100);
    }

    updatePlayersListWithResults(winners) {
        const list = document.getElementById('playersList');
        if (!list) return;
        
        list.innerHTML = '';
        
        this.players.forEach(player => {
            const isWinner = winners.includes(player);
            const playerEl = document.createElement('div');
            playerEl.className = `player ${isWinner ? 'winner' : 'loser'}`;
            const resultText = isWinner ? `+${(player.bet * 0.25).toFixed(1)}` : `-${player.bet}`;
            playerEl.innerHTML = `
                <div class="player-info">${player.name} (${player.cell})</div>
                <div class="player-bet">${resultText} TON</div>
            `;
            list.appendChild(playerEl);
        });
    }

    highlightCells() {
        document.querySelectorAll('.cell').forEach(cell => {
            const cellNum = parseInt(cell.dataset.cell);
            cell.classList.remove('selected');
            if (cellNum === this.mine) {
                cell.classList.add('mine');
                cell.innerHTML = '💣<br><small>' + cellNum + '</small>';
            } else {
                cell.classList.add('safe');
                cell.innerHTML = '💰<br><small>' + cellNum + '</small>';
            }
        });
    }

    nextRound() {
        this.players = [];
        this.mine = null;
        this.currentPlayerCell = null;
        this.isGameActive = false;
        
        this.createGrid();
        this.updatePlayersList();
        this.updateUI();
        
        const startGameBtn = document.getElementById('startGame');
        const nextRoundBtn = document.getElementById('nextRound');
        
        if (startGameBtn) startGameBtn.disabled = false;
        if (nextRoundBtn) nextRoundBtn.disabled = true;
    }

    updateUI() {
        const userBalanceElement = document.getElementById('userBalance');
        const casinoBalanceElement = document.getElementById('casinoBalance');
        const playersCountElement = document.getElementById('playersCount');
        
        if (userBalanceElement) userBalanceElement.textContent = `${this.userBalance.toFixed(1)} TON`;
        if (casinoBalanceElement) casinoBalanceElement.textContent = `${this.casinoBalance.toFixed(0)} TON`;
        if (playersCountElement) playersCountElement.textContent = this.players.length;
    }

    setupEventListeners() {
        // Быстрые ставки
        document.querySelectorAll('.quick-bet').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const bet = parseInt(e.target.dataset.bet);
                document.getElementById('playerBet').value = bet;
            });
        });
        
        // Предотвращение скролла
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('wheel', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    showMessage(text) {
        // Простое сообщение через alert
        alert(text);
    }
}

// Глобальные функции
let game;

document.addEventListener('DOMContentLoaded', function() {
    game = new SimpleMinesGame();
    
    window.placeBet = () => game.placeBet();
    window.addBot = () => game.addBot();
    window.startGame = () => game.startGame();
    window.nextRound = () => game.nextRound();
});