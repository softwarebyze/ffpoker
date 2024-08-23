// Import the functions you need from the SDKs you need

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  browserSessionPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  arrayUnion,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
  "Arizona Cardinals",
  "Atlanta Falcons",
  "Baltimore Ravens",
  "Buffalo Bills",
  "Carolina Panthers",
  "Chicago Bears",
  "Cincinnati Bengals",
  "Cleveland Browns",
  "Dallas Cowboys",
  "Denver Broncos",
  "Detroit Lions",
  "Green Bay Packers",
  "Houston Texans",
  "Indianapolis Colts",
  "Jacksonville Jaguars",
  "Kansas City Chiefs",
  "Las Vegas Raiders",
  "Los Angeles Chargers",
  "Los Angeles Rams",
  "Miami Dolphins",
  "Minnesota Vikings",
  "New England Patriots",
  "New Orleans Saints",
  "New York Giants",
  "New York Jets",
  "Philadelphia Eagles",
  "Pittsburgh Steelers",
  "San Francisco 49ers",
  "Seattle Seahawks",
  "Tampa Bay Buccaneers",
  "Tennessee Titans",
  "Washington Commanders",
];

let activePlayersData = {};
let teamScores = {};

async function loadCSVData() {
  const response = await fetch("nfl_rosters_2024.csv");
  const csvText = await response.text();

  const lines = csvText.split("\n");
  const headers = lines[0].split(",");

  lines.slice(1).forEach((line) => {
    const values = line.split(",");
    const team = values[headers.indexOf("Team")];
    activePlayersData[team] = {
      QB: values[headers.indexOf("QB")],
      RB: values[headers.indexOf("RB")],
      WR: values[headers.indexOf("WR")],
      TE: values[headers.indexOf("TE")],
      Def: values[headers.indexOf("Defense")],
      K: values[headers.indexOf("K")],
    };
    teamScores[team] = {
      QB: parseInt(values[headers.indexOf("QB Points")], 10) || 0,
      RB: parseInt(values[headers.indexOf("RB Points")], 10) || 0,
      WR: parseInt(values[headers.indexOf("WR Points")], 10) || 0,
      TE: parseInt(values[headers.indexOf("TE Points")], 10) || 0,
      Def: parseInt(values[headers.indexOf("Defense Points")], 10) || 0,
      K: parseInt(values[headers.indexOf("K Points")], 10) || 0,
    };
  });
}

function getGameId() {
  const searchParams = new URLSearchParams(window.location.search);

  if (!searchParams.has("gameId") || searchParams.get("gameId") == "") {
    console.log("gameId is not provided");
    return "tempCode";
  } else {
    return searchParams.get("gameId");
  }
}

const numPlayers = 4;
const gameId = getGameId();
document.getElementById("game-id").innerHTML = gameId;
let playerId;
let gameRef;
let gameState;

onAuthStateChanged(auth, async (user) => {
  if (user && user.uid && user.displayName) {
    playerId = user.uid;
    document.getElementById("player-id").innerHTML = playerId;
    document.getElementById("username").innerHTML = user.displayName;

    document.getElementById(
      "invite-link-clickable"
    ).href = `${window.location.origin}${window.location.pathname}?gameId=${gameId}`;
    document.getElementById(
      "invite-link-clickable"
    ).innerHTML = `${window.location.origin}${window.location.pathname}?gameId=${gameId}`;

    await loadCSVData(); // Ensure CSV data is loaded before continuing

    await loadTeamData();
    await loadInitialGameState();
    showGame();

    if (gameState.status === "awaitingPlayers") {
      await joinGame();
    }
    if (gameState.status === "awaitingStart") {
      document.getElementById("startGame").style.display = "";
    }
    if (gameState.status === "awaitingResults") {
      checkTime();
    }

    const players = gameState.players;
      for (const playerIndex in players) {
        if (players[playerIndex]["id"] === playerId) {
          const newPlayerIndex = Number(playerIndex) + 1;
          document.getElementById("player-number").innerHTML =
            Number(playerIndex) + 1;
        }
      }
  } else {
    location.replace(
      `${window.location.origin}/username${window.location.search}`
    );
  }
});

// Existing and future Auth states are now persisted in the current
// session only. Closing the window would clear any existing state even
// if a user forgets to sign out.
setPersistence(auth, browserSessionPersistence);

signInAnonymously(auth);

async function loadInitialGameState() {
  gameRef = doc(db, "games", gameId);
  const gameSnapshot = await getDoc(gameRef);

  if (gameSnapshot.exists()) {
    gameState = gameSnapshot.data();
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
    const initialGameState = {
      initialChips: 50,
      actions: [false, false, false, false],
      currentPlayer: 0,
      activePlayers: [],
      startingPlayer: 0,
      status: "awaitingPlayers",
      pot: 0,
      players: [
        // {
        //     "inGame": true,
        //     "id": "m24dnjfFmqNpbKqRT07Rvhoj1j12",
        //     "position": "WR",
        //     "bet": 10,
        //     "score": 0,
        //     "chips": 50
        // }
      ],
      bettingPhase: 1,
      initialBet: 10,
      currentBet: 10,
      drawnTeams: [],
      // history: [
      //   {}
      // ]
      createdAt: new Date(),
    };
    await setDoc(doc(db, "games", gameId), initialGameState);
  }
}

onSnapshot(doc(db, "games", gameId), (doc) => {
  gameState = doc.data();
  console.log("Current data: ", doc.data());
  if (gameState == undefined) {
    return;
  }
  updatePlayerActions();
  updatePotDisplay();
  updateUI();
  if (
    gameState.status == "resultsShown" ||
    gameState.status == "awaitingStart"
  ) {
    document.getElementById("startGame").style.display = "";
  }
});

async function resetGame() {
  deleteGame(gameId);
  await loadTeamData();
  await loadInitialGameState();
  hideGame();
  showGame();
  if (gameState.players.length < numPlayers) {
    await joinGame();
  }
  if (gameState.players.length === numPlayers) {
    startGame();
  }
}

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
  } catch (error) {
    console.error("Error loading team data:", error);
  }
}

async function joinGame() {
  const availablePositions = [...positions];
  const positionIndex = Math.floor(Math.random() * availablePositions.length);
  const position = availablePositions.splice(positionIndex, 1)[0];

  for (let player of gameState.players) {
    if (player.id == playerId) return;
  }

  await updateDoc(gameRef, {
    players: arrayUnion({
      id: playerId,
      username: auth.currentUser.displayName,
      position,
      score: 0,
      inGame: true,
      bet: gameState.initialBet,
      chips: gameState.initialChips - gameState.initialBet,
    }),
    pot: gameState.pot + gameState.initialBet,
  });

  const numCurrentPlayers = gameState.players.length;
  const newPlayerIndex = numCurrentPlayers;
  document.getElementById("player-number").innerHTML = newPlayerIndex;

  if (gameState.players.length == numPlayers) {
    // When the final person joins, automatically start the game
    await startGame();
  }
}

function startGame() {
  const DEFAULT_BET = 10;
  const DEFAULT_CHIPS = 50;
  const originalPlayers = gameState.players;
  const updatedPlayers = originalPlayers.map((player) => ({
    ...player,
    bet: DEFAULT_BET,
    chips: DEFAULT_CHIPS,
    inGame: true,
  }));
  gameState.status = "active";
  gameState.players = updatedPlayers;
  gameState.drawnTeams = [];
  gameState.currentPlayer = 0;
  gameState.pot = 40;
  gameState.currentBet = gameState.initialBet;
  gameState.activePlayers = [...Array(numPlayers).keys()];
  gameState.bettingPhase = 1;
  gameState.actions = new Array(numPlayers).fill(false);
  gameState.history = [];
  gameState.startedAt = new Date();

  document.getElementById("teams-drawn").innerHTML = "";
  document.getElementById("final-score").innerHTML = "";

  document.getElementById("results").style.display = "none";
  document.getElementById("startGame").style.display = "none";
  document.getElementById("joinGame").style.display = "none";
  document.getElementById("invite-link-div").style.display = "none";

  updateDoc(gameRef, {
    players: gameState.players,
    pot: gameState.pot,
    drawnTeams: gameState.drawnTeams,
    currentPlayer: gameState.currentPlayer,
    currentBet: gameState.currentBet,
    activePlayers: gameState.activePlayers,
    bettingPhase: gameState.bettingPhase,
    actions: gameState.actions,
    status: gameState.status,
    history: gameState.history,
    startedAt: gameState.startedAt,
  });

  logGameState(); // Log initial game state
}

function updatePlayerInfo() {
  const playersSection = document.getElementById("players-section");
  playersSection.innerHTML = "";
  gameState.players.forEach((player) => {
    const isActive =
      // !!!!!
      gameState.status === "active" &&
      player.id === gameState.players[gameState.currentPlayer].id;
    const status = player.inGame ? "" : "Folded";
    const grayClass = player.inGame ? "" : "light-gray-text";
    const activatedPlayers = getActivatedPlayers(player.position);
    playersSection.innerHTML += `
      <div class="player-info ${grayClass} ${isActive ? "active" : ""}">
        <strong>${player.username}${status ? ` (${status})` : ""}</strong>
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
  const timer = document.getElementById("timer");
  document.getElementById("raiseDiv").style.display = "none";
  if (gameState == undefined) {
    return;
  }
  const { players, status, currentPlayer, currentBet } = gameState;
  if (currentPlayer < players.length && players[currentPlayer].inGame) {
    if (players[currentPlayer].id == playerId) {
      timer.style.display = "";
      timer.innerHTML = "1:00";
      playerActions.innerHTML = `<h3>Your turn!</h3>`;
      if (players[currentPlayer].bet == currentBet) {
        playerActions.innerHTML += `<button onclick="playerCheck()">Check</button>`;
      } else {
        // Eventually handle not enough chips by replacing with else if
        playerActions.innerHTML += `<button onclick="playerCall()">Call</button>`;
      }
      if (
        currentBet <
        players[currentPlayer].bet + players[currentPlayer].chips
      ) {
        playerActions.innerHTML += `<button onclick="toggleRaise()">Raise</button>`;
        updateRaiseBar();
      }
      playerActions.innerHTML += `<button onclick="playerFold()">Fold</button>`;
    } else {
      timer.style.display = "none";
      playerActions.innerHTML = `<h3>Player ${currentPlayer + 1}'s Turn</h3>`;
    }
  }
  updatePlayerInfo();
  if (status != "active") {
    playerActions.innerHTML = "";
  }
}

// check
function playerCheck() {
  const { currentPlayer } = gameState;

  // figure out what the new state should be
  const updatedActions = gameState.actions;
  updatedActions[currentPlayer] = true;
  // update the state in the db
  updateDoc(gameRef, {
    actions: updatedActions,
    history: arrayUnion({
      action: "check",
      playerId: gameState.players[currentPlayer].id,
      playerNumber: currentPlayer,
      playerName: gameState.players[currentPlayer].username,
      bettingPhase: gameState.bettingPhase,
    }),
  });

  if (updatedActions.every((a) => a)) {
    goToNextPhaseOrGameEnd();
  } else {
    nextPlayer();
  }
  logGameState();
}

// call
function playerCall() {
  const { players, currentPlayer, currentBet, actions } = gameState;
  const player = players[currentPlayer];
  const diff = currentBet - player.bet;

  if (diff > 0 && player.chips >= diff) {
    const updatedGameState = { ...gameState };
    const updatedPlayer = { ...player };

    updatedPlayer.bet += diff;
    updatedPlayer.chips -= diff;
    updatedGameState.pot += diff;

    updatedGameState.players[currentPlayer] = updatedPlayer;

    updatedGameState.actions[currentPlayer] = true;

    updateDoc(gameRef, {
      ...updatedGameState,
      history: arrayUnion({
        action: "call",
        playerId: player.id,
        playerNumber: currentPlayer,
        playerName: player.username,
        amount: diff,
        chips: updatedPlayer.chips,
        bettingPhase: gameState.bettingPhase,
      }),
    });

    if (updatedGameState.actions.every((a) => a)) {
      goToNextPhaseOrGameEnd();
    } else {
      nextPlayer();
    }
    logGameState();
  }
}

function toggleRaise() {
  const raiseDiv = document.getElementById("raiseDiv");
  if (raiseDiv.style.display === "none") {
    raiseDiv.style.display = "";
  } else {
    raiseDiv.style.display = "none";
  }
}

// raise
function playerRaise() {
  const { players, currentPlayer, pot } = gameState;

  const updatedGameState = { ...gameState };

  const player = updatedGameState.players[currentPlayer];
  const raiseAmount = Number(document.getElementById("raiseRange").value);

  if (player.chips >= raiseAmount) {
    player.bet = Number(player.bet) + Number(raiseAmount);
    player.chips -= raiseAmount;
    updatedGameState.pot += raiseAmount;
    updatedGameState.currentBet = player.bet;
    updatedGameState.actions = updateFoldedPlayerActions(
      updatedGameState.actions.fill(false)
    );
    updatedGameState.actions[currentPlayer] = true;
    updateRaiseBar();
    toggleRaise();

    updatedGameState.players[currentPlayer] = player;

    updateDoc(gameRef, {
      ...updatedGameState,
      history: arrayUnion({
        action: "raise",
        playerId: player.id,
        playerNumber: currentPlayer,
        playerName: player.username,
        raiseAmount,
        bettingPhase: gameState.bettingPhase,
      }),
    });
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

// fold
function playerFold() {
  const { players, currentPlayer, actions } = gameState;
  const updatedPlayers = [...players];
  updatedPlayers[currentPlayer].inGame = false;
  const updatedActivePlayers = gameState.activePlayers.filter(
    (index) => index !== currentPlayer
  );
  const updatedActions = [...actions];
  updatedActions[currentPlayer] = true;

  const updatedGame = {
    players: updatedPlayers,
    actions: updatedActions,
    activePlayers: updatedActivePlayers,
    bettingPhase: gameState.bettingPhase,
  };

  if (updatedActivePlayers.length === 1) {
    const updatedStatus = "resultsShown";
    updateDoc(gameRef, {
      ...updatedGame,
      status: updatedStatus,
      history: arrayUnion({
        action: "fold",
        playerId: gameState.players[currentPlayer].id,
        playerNumber: currentPlayer,
        playerName: gameState.players[currentPlayer].username,
      }),
    });
  } else {
    updateDoc(gameRef, {
      ...updatedGame,
      history: arrayUnion({
        action: "fold",
        playerId: gameState.players[currentPlayer].id,
        playerNumber: currentPlayer,
        playerName: gameState.players[currentPlayer].username,
      }),
    });
  }

  if (updatedActivePlayers.length === 1) {
    revealScores();
  } else if (updatedActions.every((a) => a)) {
    goToNextPhaseOrGameEnd();
  } else {
    nextPlayer();
  }

  logGameState();
}

function nextPlayer() {
  const { players } = gameState;

  let updatedCurrentPlayer = (gameState.currentPlayer + 1) % numPlayers;
  while (!players[updatedCurrentPlayer].inGame) {
    updatedCurrentPlayer = (updatedCurrentPlayer + 1) % numPlayers;
  }

  updateDoc(gameRef, {
    currentPlayer: updatedCurrentPlayer,
  });

  updatePlayerActions();
}

function resetPlayer() {
  const { startingPlayer, players, status } = gameState;
  updateDoc(gameRef, {
    currentPlayer: startingPlayer,
  });

  if (!players[startingPlayer].inGame) {
    nextPlayer();
  } else {
    updatePlayerActions();
  }

  if (status != "active") {
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
  const updatedDrawnTeams = [...gameState.drawnTeams];
  updatedDrawnTeams.push(team);
  const updatedActions = updateFoldedPlayerActions(
    gameState.actions.fill(false)
  );
  if (updatedDrawnTeams.length < 2) {
    updateDoc(gameRef, {
      actions: updatedActions,
      drawnTeams: updatedDrawnTeams,
    });
    updatePlayerActions();
  } else if (gameState.bettingPhase < 4) {
    const updatedBettingPhase = gameState.bettingPhase + 1;
    updateDoc(gameRef, {
      actions: updatedActions,
      drawnTeams: updatedDrawnTeams,
      bettingPhase: updatedBettingPhase,
    });
    updatePlayerActions();
  } else {
    const updatedStatus = "awaitingResults";
    updateDoc(gameRef, {
      actions: updatedActions,
      drawnTeams: updatedDrawnTeams,
      status: updatedStatus,
    });
    revealScores();
  }
}

function updateFoldedPlayerActions(actions) {
  const updatedActions = [...actions];
  const { players } = gameState;
  for (const curPlayer in players) {
    if (!players[curPlayer].inGame) {
      updatedActions[curPlayer] = true;
    }
  }
  return updatedActions;
}

function goToNextPhaseOrGameEnd() {
  if (gameState.bettingPhase === 3 || gameState.drawnTeams.length === 2) {
    const updatedStatus = "awaitingResults";
    updateDoc(gameRef, {
      status: updatedStatus,
    });
    revealScores();
  } else {
    const updatedBettingPhase = gameState.bettingPhase + 1;
    updateDoc(gameRef, {
      bettingPhase: updatedBettingPhase,
    });
    drawTeam();
    resetPlayer();
  }
}

function getNextMonday() {
  const startedAt = gameState.startedAt.toDate();
  const nextMonday = new Date(startedAt);
  nextMonday.setDate(startedAt.getDate() + ((1 + 7 - startedAt.getDay()) % 7));
  nextMonday.setHours(23, 59, 59, 999); // Set to 23:59:59.999 on Monday
  return nextMonday;
}

function checkTime() {
  if (gameState.status === "awaitingResults") {
    const now = new Date();
    if (now >= getNextMonday()) {
      revealScores();
    } else {
      console.log(
        `${now} is before the expected date/time of ${getNextMonday()}`
      );
    }
  }
}

function revealScores() {
  const { players, pot } = gameState;
  document.getElementById("results").style.display = "";
  document.getElementById("player-actions").innerHTML = "";

  if (gameState.status === "awaitingResults") {
    const now = new Date();
    if (now < getNextMonday()) {
      console.log(
        `${now} is before the expected date/time of ${getNextMonday()}`
      );
      document.getElementById("next-monday").innerHTML = getNextMonday();
      document.getElementById("waiting-results").style.display = "";
      document.getElementById("final-score").style.display = "none";
      return;
    } else {
      document.getElementById("waiting-results").style.display = "none";
      document.getElementById("final-score").style.display = "";
      const updatedStatus = "resultsShown";
      updateDoc(gameRef, {
        status: updatedStatus, //possible statuses:'awaitingPlayers', 'awaitingStart', 'active', 'awaitingResults', 'resultsShown'
      });
    }
  }

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
  const { players, pot } = gameState;
  const scoresText = players
    .map((p, index) => {
      const activePlayers = gameState.drawnTeams
        .map((team) => {
          const playerName = activePlayersData[team][p.position];
          const playerPoints = teamScores[team][p.position];
          const teamColor = teamColors[team];
          return `<span style="color: ${teamColor.primary}; -webkit-text-stroke: 0.5px ${teamColor.secondary};">${playerName} (${playerPoints} pts)</span>`;
        })
        .join(", ");
      const grayClass = p.inGame ? "" : "light-gray-text";
      return `<span class="${grayClass}">Player ${index + 1}: ${
        p.score
      } points, Chips: ${
        p.chips
      }, Active Football Players: ${activePlayers}</span>`;
    })
    .join("<br>");

  const winnerIndex = players.indexOf(winner) + 1;
  document.getElementById(
    "final-score"
  ).innerHTML = `Scores:<br>${scoresText}<br><br>Winner: <strong style="color: gold; font-size: 1.2em; font-family: 'Freshman'">Player ${winnerIndex}</strong> with ${winner.score} points! Pot: ${pot}`;
}

function copyInviteLink() {
  const inviteLink = document.getElementById("invite-link-clickable").href;
  navigator.clipboard.writeText(inviteLink);

  alert(`Copied invite link: ${inviteLink}`);
}

function updatePotDisplay() {
  const potDisplay = document.getElementById("pot-display");
  if (gameState == undefined) {
    return;
  }
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

function updateUI() {
  if (gameState == undefined) {
    return;
  }
  const { drawnTeams, status } = gameState;

  const numDrawnTeamsDisplayed =
    document.getElementById("teams-drawn").innerHTML.split("<li").length - 1;
  if (numDrawnTeamsDisplayed != drawnTeams.length) {
    updateTeamUI();
  }

  if (status === "active") {
    if (
      document.getElementById("startGame").style.display == "" ||
      document.getElementById("joinGame").style.display == ""
    ) {
      document.getElementById("results").style.display = "none";
      document.getElementById("startGame").style.display = "none";
      document.getElementById("joinGame").style.display = "none";
      document.getElementById("invite-link-div").style.display = "none";
    }
  } else if (status === "awaitingPlayers") {
    if (document.getElementById("joinGame").style.display == "none") {
      document.getElementById("joinGame").style.display = "";
      document.getElementById("invite-link-div").style.display = "";
    } else {
      // if (document.getElementById("joinGame").style.display == "")
      document.getElementById("results").style.display = "none";
    }
  } else if (
    document.getElementById("results").style.display == "none" &&
    ["awaitingResults", "resultsShown"].includes(status)
  ) {
    revealScores();
    document.getElementById("joinGame").style.display = "none";
    document.getElementById("invite-link-div").style.display = "none";
  } else if (
    (document.getElementById("final-score").style.display == "none" ||
      document.getElementById("final-score").innerHTML == "") &&
    gameState.status == "resultsShown"
  ) {
    revealScores();
    document.getElementById("final-score").style.display = "";
    document.getElementById("waiting-results").style.display = "none";
    document.getElementById("startGame").style.display = "";
  }
}

function updateTeamUI() {
  document.getElementById("teams-drawn").innerHTML = "";
  for (const team of gameState.drawnTeams) {
    const teamColor = teamColors[team];
    const teamLogo = teamLogos[team];
    const teamElement = document.createElement("li");
    teamElement.innerHTML = `${team} <img src="${teamLogo}" alt="${team} logo" style="width: 20px; vertical-align: middle; margin-left: 5px;">`;
    teamElement.style.listStyle = "none";
    teamElement.style.color = teamColor.primary;
    teamElement.style.webkitTextStroke = `0.5px ${teamColor.secondary}`;
    teamElement.style.fontWeight = "bold";

    document.getElementById("teams-drawn").appendChild(teamElement);
  }
}

const interval = setInterval(updateTimer, 1000);

function updateTimer() {
  const timer = document.getElementById("timer");

  if (gameState == undefined || gameState.status != "active") {
    timer.style.display = "none";
    return;
  }

  if (timer.style.display == "none") return;

  if (timer.innerHTML == "1:00") {
    timer.innerHTML = "0:59";
    return;
  }

  const [minute, second] = timer.innerHTML.split(":");
  let currentTime = Number(second);
  if (currentTime <= 10) {
    timer.innerHTML = "0:0" + String(--currentTime);
  } else {
    timer.innerHTML = "0:" + String(--currentTime);
  }

  if (currentTime <= 0) {
    timer.style.display = "none";
    playerFold();
  }
}

function hideGame() {
  document.getElementById("team-info").style.display = "none";
  document.getElementById("results").style.display = "none";
  document.getElementById("raiseDiv").style.display = "none";
  document.getElementById("players-section").style.display = "none";
  document.getElementById("startGame").style.display = "";
  document.getElementById("timer").style.display = "none";
}

function showGame() {
  document.getElementById("team-info").style.display = "";
  document.getElementById("players-section").style.display = "";
  if (!["awaitingStart", "resultsShown"].includes(gameState.status)) {
    document.getElementById("startGame").style.display = "none";
  }
  document.getElementById("joinGame").style.display = "none";
  document.getElementById("invite-link-div").style.display = "none";
}

hideGame();
// await loadTeamData();
// joinGame();
// startGame();

// Allow buttons on html to use js functions
window.playerCheck = playerCheck;
window.playerCall = playerCall;
window.playerFold = playerFold;
window.playerRaise = playerRaise;
window.toggleRaise = toggleRaise;
window.updateRaiseAmount = updateRaiseAmount;
window.startGame = startGame;
window.resetGame = resetGame;
window.joinGame = joinGame;
window.copyInviteLink = copyInviteLink;
window.checkTime = checkTime;
window.setState = async (updatedStatus) =>
  await updateDoc(gameRef, {
    status: updatedStatus,
  });
window.deleteGame = async (gameId) => await deleteDoc(doc(db, "games", gameId));
