// Define initial game variables
const positions = ['QB', 'RB', 'WR', 'Def', 'TE', 'K'];
const teams = ['Tennessee Titans', 'Kansas City Chiefs', 'San Francisco 49ers', 'Dallas Cowboys'];
const teamScores = {
    'Tennessee Titans': { 'RB': 25, 'QB': 12, 'WR': 10, 'TE': 15, 'Def': 3, 'K': 12 },
    'Kansas City Chiefs': { 'RB': 16, 'QB': 30, 'WR': 8, 'TE': 20, 'Def': 2, 'K': 1 },
    'San Francisco 49ers': { 'RB': 30, 'QB': 18, 'WR': 20, 'TE': 16, 'Def': 20, 'K': 2 },
    'Dallas Cowboys': { 'RB': 10, 'QB': 20, 'WR': 23, 'TE': 12, 'Def': 14, 'K': 8 }
};

const activePlayersData = {
    'Tennessee Titans': { 'RB': 'Derrick Henry', 'QB': 'Will Levis', 'WR': 'DeAndre Hopkins', 'TE': 'Chigoziem Okonkwo', 'Def': 'Titans Defense', 'K': 'Nick Folk' },
    'Kansas City Chiefs': { 'RB': 'Isaiah Pacheco', 'QB': 'Patrick Mahomes', 'WR': 'Skyy Moore', 'TE': 'Travis Kelce', 'Def': 'Chiefs Defense', 'K': 'Harrison Butker' },
    'San Francisco 49ers': { 'RB': 'Christian McCaffrey', 'QB': 'Brock Purdy', 'WR': 'Deebo Samuel', 'TE': 'George Kittle', 'Def': '49ers Defense', 'K': 'Jake Moody' },
    'Dallas Cowboys': { 'RB': 'Ezekiel Elliott', 'QB': 'Dak Prescott', 'WR': 'CeeDee Lamb', 'TE': 'Jake Ferguson', 'Def': 'Cowboys Defense', 'K': 'Brandon Aubrey' }
};

const numPlayers = 4;
let players = [];
let drawnTeams = [];
let currentPlayer = 0;
let pot = 0;
let activePlayers = [];
let currentBet = 10;
const initialChips = 50;
const initialBet = 10;
const betIncrease = 10;
let actions = new Array(numPlayers).fill(false);
let bettingPhase = 1;

function startGame() {
    players = [];
    drawnTeams = [];
    currentPlayer = 0;
    pot = 0;
    currentBet = initialBet;
    activePlayers = [...Array(numPlayers).keys()];
    bettingPhase = 1;

    for (let i = 0; i < numPlayers; i++) {
        const position = positions[Math.floor(Math.random() * positions.length)];
        players.push({ id: i + 1, position, score: 0, inGame: true, bet: initialBet, chips: initialChips - initialBet });
        pot += initialBet;
    }

    logGameState();  // Log initial game state
    updatePlayerInfo();
    updatePlayerActions();
}

function updatePlayerInfo() {
    const playersSection = document.getElementById('players-section');
    playersSection.innerHTML = `<h2>Players' Hands (Pot: ${pot})</h2>`;
    players.forEach(player => {
        const status = player.inGame ? 'Active' : 'Folded';
        playersSection.innerHTML += `<div class="player-info"><strong>Player ${player.id} (${status})</strong><ul><li>${player.position}</li><li>Bet: ${player.bet}</li><li>Chips: ${player.chips}</li></ul></div>`;
    });
}

function updatePlayerActions() {
    const playerActions = document.getElementById('player-actions');
    if (currentPlayer < players.length && players[currentPlayer].inGame) {
        playerActions.innerHTML = `<h3>Player ${players[currentPlayer].id}'s Turn</h3>`;
        playerActions.innerHTML += `
            <button onclick="playerCheck()">Check</button>
            <button onclick="playerCall()">Call</button>
            <button onclick="playerRaise()">Raise</button>
            <button onclick="playerFold()">Fold</button>
        `;
    }
}

function playerCheck() {
    actions[currentPlayer] = true;
    if (actions.every(a => a)) { // Check if all players have acted
        if (bettingPhase === 3 || drawnTeams.length === 2) {
            revealScores();
        } else {
            bettingPhase++;
            drawTeam();
        }
    } else {
        nextPlayer();
    }
    logGameState();
}

function playerCall() {
    const player = players[currentPlayer];
    const diff = currentBet - player.bet;

    if (diff > 0 && player.chips >= diff) {
        player.bet += diff;
        player.chips -= diff;
        pot += diff;
    }
    actions[currentPlayer] = true;
    if (actions.every(a => a)) {
        if (bettingPhase === 3 || drawnTeams.length === 2) {
            revealScores();
        } else {
            bettingPhase++;
            drawTeam();
        }
    } else {
        nextPlayer();
    }
    logGameState();
}

function playerRaise() {
    const player = players[currentPlayer];
    const raiseAmount = currentBet + betIncrease - player.bet;

    if (player.chips >= raiseAmount) {
        player.bet += raiseAmount;
        player.chips -= raiseAmount;
        pot += raiseAmount;
        currentBet += betIncrease;
        actions.fill(false);
        actions[currentPlayer] = true;
    }
    nextPlayer();
    logGameState();
}

function playerFold() {
    players[currentPlayer].inGame = false;
    activePlayers = activePlayers.filter(index => index !== currentPlayer);
    actions[currentPlayer] = false;
    if (activePlayers.length === 1) {
        revealScores();
    } else {
        nextPlayer();
    }
    logGameState();
}

function nextPlayer() {
    currentPlayer = (currentPlayer + 1) % numPlayers;
    if (!players[currentPlayer].inGame) {
        nextPlayer();
    } else {
        updatePlayerActions();
    }
}

function drawTeam() {
    const team = teams[Math.floor(Math.random() * teams.length)];
    drawnTeams.push(team);
    document.getElementById('teams-drawn').innerHTML += `<li>${team}</li>`;
    actions.fill(false);
    if (drawnTeams.length < 2) {
        updatePlayerActions();
    } else if (bettingPhase < 3) {
        bettingPhase++;
        updatePlayerActions();
    } else {
        revealScores();
    }
}

function revealScores() {
    players.forEach(player => {
        drawnTeams.forEach(team => {
            if (teamScores[team][player.position] && player.inGame) {
                player.score += teamScores[team][player.position];
            }
        });
    });

    const remainingPlayers = players.filter(p => p.inGame);
    const winner = remainingPlayers.reduce((prev, current) => (prev.score > current.score ? prev : current), { score: -1 });
    winner.chips += pot;

    revealWinner(winner);
}

function revealWinner(winner) {
    const scoresText = players.map(p => {
        const activePlayers = drawnTeams.map(team => activePlayersData[team][p.position]).join(', ');
        return `Player ${p.id}: ${p.score} points, Chips: ${p.chips}, Active Football Players: ${activePlayers}`;
    }).join('<br>');
    document.getElementById('final-score').innerHTML = `Scores:<br>${scoresText}<br><br>Winner: Player ${winner.id} with ${winner.score} points! Pot: ${pot}`;
}

function logGameState() {
    console.log(`Current Player: Player ${players[currentPlayer].id}`);
    console.log(`Current Bet: ${currentBet}`);
    console.log(`Pot: ${pot}`);
    console.log(`Betting Phase: ${bettingPhase}`);
    console.log(`Drawn Teams: ${drawnTeams.join(', ')}`);
    console.log(`Player Actions: ${actions.map((action, index) => `Player ${index + 1}: ${action}`).join(', ')}`);
}

startGame();