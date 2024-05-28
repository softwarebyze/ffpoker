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
let betIncrease = 10;
let actions = new Array(numPlayers).fill(false);
let bettingPhase = 1;
let startingPlayer = 0;
let gameInProgress = true;

function startGame() {
  showGame();
  console.log('');
  console.log('startGame()');
  gameInProgress = true;
  players = [];
  drawnTeams = [];
  currentPlayer = 0;
  betIncrease = 10;
  pot = 0;
  currentBet = initialBet;
  activePlayers = [...Array(numPlayers).keys()];
  bettingPhase = 1;

  document.getElementById('teams-drawn').innerHTML = '';
  document.getElementById('final-score').innerHTML = '';

  document.getElementById('results').style.display = "none";

  for (let i = 0; i < numPlayers; i++) {
    const position = positions[Math.floor(Math.random() * positions.length)];
    players.push({ id: i + 1, position, score: 0, inGame: true, bet: initialBet, chips: initialChips - initialBet });
    pot += initialBet;
  }

  actions.fill(false);
  logGameState();  // Log initial game state
  updatePlayerInfo();
  updatePlayerActions();
}

function updatePlayerInfo() {
  console.log('updatePlayerInfo()');
  const playersSection = document.getElementById('players-section');
  playersSection.innerHTML = `<h2>Players' Hands (Pot: ${pot})</h2>`;
  players.forEach(player => {
    const status = player.inGame ? 'Active' : 'Folded';
    playersSection.innerHTML += `<div class="player-info"><strong>Player ${player.id} (${status})</strong><ul><li>${player.position}</li><li>Bet: ${player.bet}</li><li>Chips: ${player.chips}</li></ul></div>`;
  });
}

function updatePlayerActions() {
  console.log('updatePlayerActions()');
  const playerActions = document.getElementById('player-actions');
  document.getElementById('raiseDiv').style.display = "none";
  if (currentPlayer < players.length && players[currentPlayer].inGame) {
    playerActions.innerHTML = `<h3>Player ${players[currentPlayer].id}'s Turn</h3>`;
    if (players[currentPlayer].bet == currentBet) {
      playerActions.innerHTML += `<button onclick="playerCheck()">Check</button>`;
    }
    else {
      playerActions.innerHTML += `<button onclick="playerCall()">Call</button>`;
    }
    if (currentBet < players[currentPlayer].bet + players[currentPlayer].chips) {//Check if the player can raise
      playerActions.innerHTML += `<button onclick="toggleRaise()">Raise</button>`
    }
    playerActions.innerHTML += `
            <button onclick="playerFold()">Fold</button>
        `;
    updateRaiseBar();
  }
  updatePlayerInfo();
  if (!gameInProgress) {
    playerActions = document.getElementById('player-actions').innerHTML = '';
  }
}

function playerCheck() {
  console.log('');
  console.log('playerCheck()');
  actions[currentPlayer] = true;
  if (actions.every(a => a)) { // Check if all players have acted
    console.log('goto goToNextPhaseOrGameEnd()');
    goToNextPhaseOrGameEnd();
  } else {
    console.log('goto nextPlayer()');
    nextPlayer();
  }
  logGameState();
}

function playerCall() {
  console.log('');
  console.log('playerCall()');
  const player = players[currentPlayer];
  const diff = currentBet - player.bet;

  if (diff > 0 && player.chips >= diff) {
    console.log('playerCall() success');
    player.bet += diff;
    player.chips -= diff;
    pot += diff;
  }
  actions[currentPlayer] = true;
  if (actions.every(a => a)) {
    console.log('goto goToNextPhaseOrEndGame()');
    goToNextPhaseOrGameEnd();
  } else {
    console.log('goto nextPlayer()');
    nextPlayer();
  }
  logGameState();
}

function toggleRaise() {
  console.log('toggleRaise()');
  const raiseDiv = document.getElementById("raiseDiv");
  if (raiseDiv.style.display === "none") {
    raiseDiv.style.display = "";
  }
  else {
    raiseDiv.style.display = "none";
  }
}

function playerRaise() {
  console.log('');
  console.log('playerRaise()');
  const player = players[currentPlayer];
  betIncrease = Number(document.getElementById('raiseRange').value);
  const raiseAmount = betIncrease;

  if (player.chips >= raiseAmount) {
    console.log('playerRaise() success');
    player.bet = Number(player.bet) + Number(raiseAmount);
    player.chips -= raiseAmount;
    pot += raiseAmount;
    currentBet = player.bet;
    actions.fill(false);
    fillFolded();
    actions[currentPlayer] = true;
    updateRaiseBar();
    toggleRaise();
  }
  nextPlayer();
  logGameState();
}

function updateRaiseAmount() {
  const raiseAmount = document.getElementById('raiseAmount');
  const desRaise = document.getElementById('raiseRange').value;
  raiseAmount.textContent = desRaise;
}

function updateRaiseBar() {
  const maxRaise = players[currentPlayer].chips;
  document.getElementById("raiseRange").max = maxRaise;
  document.getElementById("maxLabel").innerHTML = maxRaise;
  document.getElementById("minLabel").innerHTML = currentBet - players[currentPlayer].bet + 1;
  document.getElementById("raiseRange").min = currentBet - players[currentPlayer].bet + 1;
  document.getElementById("raiseRange").value = currentBet - players[currentPlayer].bet + 1;
  document.getElementById("raiseAmount").innerHTML = currentBet - players[currentPlayer].bet + 1;
}

function playerFold() {
  console.log('');
  console.log('playerFold()');
  players[currentPlayer].inGame = false;
  activePlayers = activePlayers.filter(index => index !== currentPlayer);
  actions[currentPlayer] = true;
  if (activePlayers.length === 1) {
    console.log('goto revealScores()');
    gameInProgress = false;
    revealScores();
  } else if (actions.every(a => a)) {
    console.log('goto goToNextPhaseOrGameEnd()');
    goToNextPhaseOrGameEnd();
  } else {
    console.log('goto nextPlayer()');
    nextPlayer();
  }
  logGameState();
}

function nextPlayer() {
  console.log('nextPlayer()');
  currentPlayer = (currentPlayer + 1) % numPlayers;
  if (!players[currentPlayer].inGame) {
    console.log('goto nextPlayer()');
    nextPlayer();
  } else {
    console.log('goto updatePlayerActions()');
    updatePlayerActions();
  }
}

function resetPlayer() {
  console.log('resetPlayer()');
  currentPlayer = startingPlayer;
  if (!players[currentPlayer].inGame) {
    console.log('goto nextPlayer()');
    nextPlayer();
  } else {
    console.log('goto updatePlayerActions()');
    updatePlayerActions();
  }

  if (!gameInProgress) { //If the game has ended, remove possible actions
    document.getElementById('player-actions').innerHTML = ''
  }
}

function drawTeam() {
  console.log('drawTeam()');
  const team = teams[Math.floor(Math.random() * teams.length)];
  drawnTeams.push(team);
  document.getElementById('teams-drawn').innerHTML += `<li>${team}</li>`;
  actions.fill(false);
  fillFolded();
  if (drawnTeams.length < 2) {
    console.log('goto updatePlayerActions()');
    updatePlayerActions();
  } else if (bettingPhase < 4) {
    console.log('bettingPhase++ goto updatePlayerActions()');
    bettingPhase++;
    updatePlayerActions();
  } else {
    console.log('revealScores()');
    gameInProgress = false;
    revealScores();
  }
}

function fillFolded() {
  for (curPlayer in players) {
    if (!players[curPlayer].inGame) {
      actions[curPlayer] = true;
    }
  }
}

function goToNextPhaseOrGameEnd() {
  if (bettingPhase === 3 || drawnTeams.length === 2) {
    console.log('goToNextPhaseOrGameEnd() to revealScores()');
    gameInProgress = false;
    revealScores();
  } else {
    console.log('goToNextPhaseOrGameEnd() to bettingPhase++ drawTeam()');
    bettingPhase++;
    drawTeam();
    resetPlayer();
  }
}

function revealScores() {
  console.log('revealScores()');
  document.getElementById('results').style.display = "";
  document.getElementById('player-actions').innerHTML = '';
  gameInProgress = false;
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
  document.getElementById('startGame').style.display = "";
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

function hideGame() {
  document.getElementById('team-info').style.display = "none";
  document.getElementById('results').style.display = "none";
  document.getElementById('raiseDiv').style.display = "none";
  document.getElementById('players-section').style.display = "none";
  document.getElementById('startGame').style.display = "";
}

function showGame() {
  document.getElementById('team-info').style.display = "";
  document.getElementById('players-section').style.display = "";
  document.getElementById('startGame').style.display = "none";
}

hideGame();
