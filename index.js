// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  updateDoc,
  onSnapshot,
  collection,
  getDocs,
  getDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-w82pBn3TWhbfz0dUcXcTKXk9Z2OZXWE",
  authDomain: "ffpoker-20a8e.firebaseapp.com",
  projectId: "ffpoker-20a8e",
  storageBucket: "ffpoker-20a8e.appspot.com",
  messagingSenderId: "409640502099",
  appId: "1:409640502099:web:d7096f9f32ad152b80d7a6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const positions = ["QB", "RB", "WR", "Def", "TE", "K"];
const teams = [
  "Tennessee Titans",
  "Kansas City Chiefs",
  "San Francisco 49ers",
  "Dallas Cowboys",
];
const teamScores = {
  "Tennessee Titans": { RB: 25, QB: 12, WR: 10, TE: 15, Def: 3, K: 12 },
  "Kansas City Chiefs": { RB: 16, QB: 30, WR: 8, TE: 20, Def: 2, K: 1 },
  "San Francisco 49ers": { RB: 30, QB: 18, WR: 20, TE: 16, Def: 20, K: 2 },
  "Dallas Cowboys": { RB: 10, QB: 20, WR: 23, TE: 12, Def: 14, K: 8 },
};
const activePlayersData = {
  "Tennessee Titans": {
    RB: "Derrick Henry",
    QB: "Will Levis",
    WR: "DeAndre Hopkins",
    TE: "Chigoziem Okonkwo",
    Def: "Titans Defense",
    K: "Nick Folk",
  },
  "Kansas City Chiefs": {
    RB: "Isaiah Pacheco",
    QB: "Patrick Mahomes",
    WR: "Skyy Moore",
    TE: "Travis Kelce",
    Def: "Chiefs Defense",
    K: "Harrison Butker",
  },
  "San Francisco 49ers": {
    RB: "Christian McCaffrey",
    QB: "Brock Purdy",
    WR: "Deebo Samuel",
    TE: "George Kittle",
    Def: "49ers Defense",
    K: "Jake Moody",
  },
  "Dallas Cowboys": {
    RB: "Ezekiel Elliott",
    QB: "Dak Prescott",
    WR: "CeeDee Lamb",
    TE: "Jake Ferguson",
    Def: "Cowboys Defense",
    K: "Brandon Aubrey",
  },
};
const numPlayers = 4;
const gameId = "AAAA";
let playerId;
let gameRef;
let gameState;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    playerId = user.uid;
    await loadTeamData();
    await loadInitialGameState();
    showGame();
    if (gameState.players.length < numPlayers) {
      await joinGame();
    }
    if (gameState.players.length === numPlayers) {
      startGame();
    }
  }
});

signInAnonymously(auth);

async function loadInitialGameState() {
  gameRef = doc(db, "games", gameId);
  const gameSnapshot = await getDoc(gameRef);

  if (gameSnapshot.exists()) {
    gameState = gameSnapshot.data();
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
  }
}

onSnapshot(doc(db, "games", "AAAA"), (doc) => {
  gameState = doc.data();
  console.log("Current data: ", doc.data());
  updatePlayerActions();
  if (gameState.players.length === numPlayers && !gameState.gameInProgress) {
    startGame();
    console.log("started game")
  }
});

let teamColors = {};
let teamLogos = {};

async function loadTeamData() {
  try {
    const colorsResponse = await fetch("nfl_colors.json");
    const colorsData = await colorsResponse.json();
    colorsData.NFLTeams.forEach((team) => {
      teamColors[team.team] = {
        primary: team.primary_color,
        secondary: team.secondary_color,
      };
    });

    const logosResponse = await fetch("nfl_urls.json");
    const logosData = await logosResponse.json();
    logosData.NFLTeams.forEach((team) => {
      teamLogos[team.team] = team.image_url;
    });

    // startGame();
  } catch (error) {
    console.error("Error loading team data:", error);
  }
}

async function joinGame() {
  const availablePositions = [...positions];
  const positionIndex = Math.floor(Math.random() * availablePositions.length);
  const position = availablePositions.splice(positionIndex, 1)[0];
  await updateDoc(gameRef, {
    players: arrayUnion({
      id: playerId,
      position,
      score: 0,
      inGame: true,
      bet: gameState.initialBet,
      chips: gameState.initialChips - gameState.initialBet,
    }),
    pot: gameState.pot + gameState.initialBet,
  });
}

// let players = [];
// let drawnTeams = [];
// let currentPlayer = 0;
// let pot = 0;
// let activePlayers = [];
// let currentBet = 10;
// const initialChips = 50;
// const initialBet = 10;
// let betIncrease = 10;
// let actions = new Array(numPlayers).fill(false);
// let bettingPhase = 1;
// let startingPlayer = 0;
// let gameInProgress = true;

// const {
//   players,
//   drawnTeams,
//   currentPlayer,
//   pot,
//   activePlayers,
//   currentBet,
//   initialChips,
//   initialBet,
//   betIncrease,
//   actions,
//   bettingPhase,
//   startingPlayer,
//   gameInProgress,
// } = gameState;

function startGame() {
  // showGame();
  gameState.gameInProgress = true;
  // players = [];
  gameState.drawnTeams = [];
  gameState.currentPlayer = 0;
  gameState.betIncrease = 10;
  gameState.pot = 0;
  gameState.currentBet = gameState.initialBet;
  gameState.activePlayers = [...Array(numPlayers).keys()];
  gameState.bettingPhase = 1;
  gameState.actions = new Array(numPlayers).fill(false);

  document.getElementById("teams-drawn").innerHTML = "";
  document.getElementById("final-score").innerHTML = "";

  document.getElementById("results").style.display = "none";

  // const availablePositions = [...positions];

  // for (let i = 0; i < numPlayers; i++) {
  //   const positionIndex = Math.floor(Math.random() * availablePositions.length);
  //   const position = availablePositions.splice(positionIndex, 1)[0];
  //   players.push({
  //     id: i + 1,
  //     position,
  //     score: 0,
  //     inGame: true,
  //     bet: initialBet,
  //     chips: initialChips - initialBet,
  //   });
  //   pot += initialBet;
  // }

  // actions.fill(false);

  updateDoc(gameRef, {
    players: gameState.players,
    pot: gameState.pot,
    drawnTeams: gameState.drawnTeams,
    currentPlayer: gameState.currentPlayer,
    currentBet: gameState.currentBet,
    bettingPhase: gameState.bettingPhase,
    actions: gameState.actions,
    gameInProgress: gameState.gameInProgress,
  });

  logGameState(); // Log initial game state
  updatePlayerInfo();
  updatePlayerActions();
  updatePotDisplay();
}

function updatePlayerInfo() {
  const playersSection = document.getElementById("players-section");
  playersSection.innerHTML = "";
  gameState.players.forEach((player) => {
    const status = player.inGame ? "" : "Folded";
    const grayClass = player.inGame ? "" : "light-gray-text";
    const activatedPlayers = getActivatedPlayers(player.position);
    playersSection.innerHTML += `
      <div class="player-info ${grayClass}">
        <strong>Player ${player.id}${status ? ` (${status})` : ""}</strong>
        <ul>
          <li class="tooltip"><strong>${player.position}</strong>
            <span class="tooltiptext">${activatedPlayers}</span>
          </li>
          <li>Bet: ${player.bet}</li>
          <li>Chips: ${player.chips}</li>
        </ul>
      </div>`;
  });

  // Update tooltips for activated players
  updateTooltips();
}

function getActivatedPlayers(position) {
  return gameState.drawnTeams
    .map((team) => {
      const teamColor = teamColors[team];
      return `<span style="color: ${teamColor.primary}; -webkit-text-stroke: 0.5px ${teamColor.secondary};">${activePlayersData[team][position]}</span>`;
    })
    .join(", ");
}

function updateTooltips() {
  const tooltips = document.querySelectorAll(".tooltiptext");
  tooltips.forEach((tooltip) => {
    const text = tooltip.innerHTML;
    tooltip.innerHTML = text;
  });
}

function updatePlayerActions() {
  const playerActions = document.getElementById("player-actions");
  document.getElementById("raiseDiv").style.display = "none";
  const { players, gameInProgress, currentPlayer, currentBet } = gameState;
  if (currentPlayer < players.length && players[currentPlayer].inGame) {
    // playerActions.innerHTML = `<h3>Player ${players[currentPlayer].id}'s Turn</h3>`;
    playerActions.innerHTML = `<h3>Player ${currentPlayer}'s Turn</h3>`;
    if (players[currentPlayer].bet == currentBet) {
      playerActions.innerHTML += `<button onclick="playerCheck()">Check</button>`;
    } else {
      playerActions.innerHTML += `<button onclick="playerCall()">Call</button>`;
    }
    if (
      currentBet <
      players[currentPlayer].bet + players[currentPlayer].chips
    ) {
      playerActions.innerHTML += `<button onclick="toggleRaise()">Raise</button>`;
    }
    playerActions.innerHTML += `<button onclick="playerFold()">Fold</button>`;
    updateRaiseBar();
  }
  updatePlayerInfo();
  if (!gameInProgress) {
    playerActions.innerHTML = "";
  }
}

function playerCheck() {
  const { currentPlayer } = gameState

  // figure out what the new state should be
  const updatedActions = gameState.actions
  updatedActions[currentPlayer] = true
  // update the state in the db
  updateDoc(gameRef, {
    actions: updatedActions
  })

  if (gameState.actions.every((a) => a)) {
    goToNextPhaseOrGameEnd();
  } else {
    nextPlayer();
  }
  logGameState();
}

function playerCall() {
  const { players, currentPlayer, currentBet } = gameState;
  const player = players[currentPlayer];
  const diff = currentBet - player.bet;

  let updatedPlayer = structuredClone(player);
  let updatedPot = pot;

  if (diff > 0 && player.chips >= diff) {
    updatedPlayer.bet += diff;
    updatedPlayer.chips -= diff;
    updatedPot += diff;
    updatePotDisplay(); // Update pot display when bet is made
  }
  actions[currentPlayer] = true;
  if (actions.every((a) => a)) {
    goToNextPhaseOrGameEnd();
  } else {
    nextPlayer();
  }
  logGameState();
}

function toggleRaise() {
  const raiseDiv = document.getElementById("raiseDiv");
  if (raiseDiv.style.display === "none") {
    raiseDiv.style.display = "";
  } else {
    raiseDiv.style.display = "none";
  }
}

function playerRaise() {
  const { players, currentPlayer, betIncrease, pot } = gameState;

  const updatedGameState = { ...gameState }

  const player = updatedGameState.players[currentPlayer];
  const updatedBetIncrease = Number(document.getElementById("raiseRange").value);
  updateDoc(gameRef, {
    betIncrease: updatedBetIncrease
  })
  const raiseAmount = updatedBetIncrease;

  if (player.chips >= raiseAmount) {
    player.bet = Number(player.bet) + Number(raiseAmount);
    player.chips -= raiseAmount;
    // pot += raiseAmount;
    updatedGameState.pot += raiseAmount;
    updatedGameState.currentBet = player.bet;
    updatePotDisplay(); // Update pot display when bet is made
    updatedGameState.actions.fill(false);
    fillFolded();
    updatedGameState.actions[currentPlayer] = true;
    updateRaiseBar();
    toggleRaise();

    updatedGameState.players[currentPlayer] = player

    updateDoc(gameRef, updatedGameState)

  }

  nextPlayer();
  logGameState();
}

function updateRaiseAmount() {
  const raiseAmount = document.getElementById("raiseAmount");
  const desRaise = document.getElementById("raiseRange").value;
  raiseAmount.textContent = desRaise;
}

function updateRaiseBar() {
  const { players, currentPlayer, currentBet } = gameState;
  const maxRaise = players[currentPlayer].chips;
  document.getElementById("raiseRange").max = maxRaise;
  document.getElementById("maxLabel").innerHTML = maxRaise;
  document.getElementById("minLabel").innerHTML =
    currentBet - players[currentPlayer].bet + 1;
  document.getElementById("raiseRange").min =
    currentBet - players[currentPlayer].bet + 1;
  document.getElementById("raiseRange").value =
    currentBet - players[currentPlayer].bet + 1;
  document.getElementById("raiseAmount").innerHTML =
    currentBet - players[currentPlayer].bet + 1;
}

function playerFold() {
  players[currentPlayer].inGame = false;
  activePlayers = activePlayers.filter((index) => index !== currentPlayer);
  actions[currentPlayer] = true;
  if (activePlayers.length === 1) {
    gameInProgress = false;
    revealScores();
  } else if (actions.every((a) => a)) {
    goToNextPhaseOrGameEnd();
  } else {
    nextPlayer();
  }
  logGameState();
}

function nextPlayer() {
  const { players } = gameState

  const updatedCurrentPlayer = (gameState.currentPlayer + 1) % numPlayers;

  updateDoc(gameRef, {
    currentPlayer: updatedCurrentPlayer
  })

  if (!players[gameState.currentPlayer].inGame) {
    nextPlayer();
  } else {
    updatePlayerActions();
  }
}

function resetPlayer() {
  currentPlayer = startingPlayer;
  if (!players[currentPlayer].inGame) {
    nextPlayer();
  } else {
    updatePlayerActions();
  }

  if (!gameInProgress) {
    //If the game has ended, remove possible actions
    document.getElementById("player-actions").innerHTML = "";
  }
}

function drawTeam() {
  const availableTeams = teams.filter(
    (team) => !gameState.drawnTeams.includes(team)
  );
  const team =
    availableTeams[Math.floor(Math.random() * availableTeams.length)];
  gameState.drawnTeams.push(team);

  const teamColor = teamColors[team];
  const teamLogo = teamLogos[team];
  const teamElement = document.createElement("li");
  teamElement.innerHTML = `${team} <img src="${teamLogo}" alt="${team} logo" style="width: 20px; vertical-align: middle; margin-left: 5px;">`;
  teamElement.style.listStyle = "none";
  teamElement.style.color = teamColor.primary;
  teamElement.style.webkitTextStroke = `0.5px ${teamColor.secondary}`;
  teamElement.style.fontWeight = "bold";

  document.getElementById("teams-drawn").appendChild(teamElement);
  actions.fill(false);
  fillFolded();
  if (gameState.drawnTeams.length < 2) {
    updatePlayerActions();
  } else if (bettingPhase < 4) {
    bettingPhase++;
    updatePlayerActions();
  } else {
    gameInProgress = false;
    revealScores();
  }
}

function fillFolded() {
  const { players, actions } = gameState
  for (const curPlayer in players) {
    if (!players[curPlayer].inGame) {
      const updatedActions = actions
      updatedActions[curPlayer] = true;
      updateDoc(gameRef, {
        actions: updatedActions
      })
    }
  }
}

function goToNextPhaseOrGameEnd() {
  if (bettingPhase === 3 || gameState.drawnTeams.length === 2) {
    gameInProgress = false;
    revealScores();
  } else {
    bettingPhase++;
    drawTeam();
    resetPlayer();
  }
}

function revealScores() {
  document.getElementById("results").style.display = "";
  document.getElementById("player-actions").innerHTML = "";
  gameInProgress = false;
  players.forEach((player) => {
    gameState.drawnTeams.forEach((team) => {
      if (teamScores[team][player.position] && player.inGame) {
        player.score += teamScores[team][player.position];
      }
    });
  });

  const remainingPlayers = players.filter((p) => p.inGame);
  const winner = remainingPlayers.reduce(
    (prev, current) => (prev.score > current.score ? prev : current),
    { score: -1 }
  );
  winner.chips += pot;

  revealWinner(winner);
  document.getElementById("startGame").style.display = "";
}

function revealWinner(winner) {
  const scoresText = players
    .map((p) => {
      const activePlayers = gameState.drawnTeams
        .map((team) => {
          const teamColor = teamColors[team];
          return `<span style="color: ${teamColor.primary
            }; -webkit-text-stroke: 0.5px ${teamColor.secondary};">${activePlayersData[team][p.position]
            }</span>`;
        })
        .join(", ");
      const grayClass = p.inGame ? "" : "light-gray-text";
      return `<span class="${grayClass}">Player ${p.id}: ${p.score} points, Chips: ${p.chips}, Active Football Players: ${activePlayers}</span>`;
    })
    .join("<br>");
  document.getElementById(
    "final-score"
  ).innerHTML = `Scores:<br>${scoresText}<br><br>Winner: <strong style="color: darkgreen; font-size: 1.2em;">Player ${winner.id}</strong> with ${winner.score} points! Pot: ${pot}`;
}

function updatePotDisplay() {
  const potDisplay = document.getElementById("pot-display");
  potDisplay.innerHTML = `<strong>Pot: </strong><strong>${gameState.pot}</strong>`;

  const stackSize = Math.min(20, Math.floor(gameState.pot / 10));
  const circles = Array.from({ length: stackSize }, (_, i) => {
    const circleSize = 20;
    return `<div style="width: ${circleSize}px; height: ${circleSize}px; background-color: gold; border-radius: 50%; display: inline-block; margin-right: 2px; box-shadow: inset 0 0 5px rgba(0,0,0,0.5);"></div>`;
  }).join("");

  potDisplay.innerHTML += `<div style="display: inline-block; vertical-align: middle; margin-left: 10px;">${circles}</div>`;
}

function logGameState() {
  console.log(
    `Current Player: Player ${gameState.players[gameState.currentPlayer].id}`
  );
  console.log(`Current Bet: ${gameState.currentBet}`);
  console.log(`Pot: ${gameState.pot}`);
  console.log(`Betting Phase: ${gameState.bettingPhase}`);
  console.log(`Drawn Teams: ${gameState.drawnTeams.join(", ")}`);
  console.log(
    `Player Actions: ${gameState.actions
      .map((action, index) => `Player ${index + 1}: ${action}`)
      .join(", ")}`
  );
}

function hideGame() {
  document.getElementById("team-info").style.display = "none";
  document.getElementById("results").style.display = "none";
  document.getElementById("raiseDiv").style.display = "none";
  document.getElementById("players-section").style.display = "none";
  document.getElementById("startGame").style.display = "";
}

function showGame() {
  document.getElementById("team-info").style.display = "";
  document.getElementById("players-section").style.display = "";
  document.getElementById("startGame").style.display = "none";
}

hideGame();
// await loadTeamData();
// await loadInitialGameState();
// joinGame();
// startGame();

// Allow buttons on html to use js functions
window.playerCheck = playerCheck
window.playerCall = playerCall
window.playerFold = playerFold
window.playerRaise = playerRaise
window.toggleRaise = toggleRaise
window.updateRaiseAmount = updateRaiseAmount