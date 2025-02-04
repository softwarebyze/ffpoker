// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  updateProfile,
  getAuth,
  signInAnonymously,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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

class LobbyManager {
  constructor() {
    this.gamesCollection = collection(db, "games");
    this.numPlayers = 4;
    this.init();
  }

  async init() {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    this.setupUI();
    this.setupListeners();
    this.loadActiveGames();
  }

  setupUI() {
    // Add modern styles
    const style = document.createElement('style');
    style.textContent = `
      .lobby-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
      }
      .game-list {
        display: grid;
        gap: 20px;
        margin: 20px 0;
      }
      .game-item {
        padding: 20px;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .btn {
        background: #4CAF50;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      }
      .btn:hover {
        background: #45a049;
      }
      .input-field {
        padding: 8px;
        margin: 5px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
      }
      .error-text {
        color: #f44336;
        margin: 5px 0;
      }
    `;
    document.head.appendChild(style);

    // Update UI based on auth state
    if (auth.currentUser?.displayName) {
      document.getElementById("user-text").value = auth.currentUser.displayName;
      document.getElementById("create-username").style.display = "none";
      document.getElementById("join-create-game").style.display = "";
      document.getElementById("username").innerHTML = auth.currentUser.displayName;
    }
  }

  setupListeners() {
    // Real-time updates for active games - show all non-completed games
    const activeGamesQuery = query(
      this.gamesCollection,
      where("status", "in", ["waiting", "in_progress", "active"])
    );

    onSnapshot(activeGamesQuery, (snapshot) => {
      this.updateGamesList(snapshot);
    });
  }

  updateGamesList(snapshot) {
    const gamesList = document.getElementById("games-list");
    if (!gamesList) return;

    gamesList.innerHTML = "";

    const games = [];
    snapshot.forEach((doc) => {
      const gameData = doc.data();
      const isInGame = gameData.players?.some(p => p.id === auth.currentUser?.uid);
      
      // Check if it's your turn by matching your ID with the player at currentPlayer index
      const isYourTurn = isInGame && 
        gameData.players?.[gameData.currentPlayer]?.id === auth.currentUser?.uid;
      
      games.push({
        id: doc.id,
        data: gameData,
        isInGame,
        isYourTurn
      });
    });

    // Sort games: Your turn first, then your games, then open games, then full games
    games.sort((a, b) => {
      if (a.isYourTurn && !b.isYourTurn) return -1;
      if (!a.isYourTurn && b.isYourTurn) return 1;
      if (a.isInGame && !b.isInGame) return -1;
      if (!a.isInGame && b.isInGame) return 1;
      
      const aFull = (a.data.players?.length || 0) >= this.numPlayers;
      const bFull = (b.data.players?.length || 0) >= this.numPlayers;
      if (!aFull && bFull) return -1;
      if (aFull && !bFull) return 1;
      
      return 0;
    });

    // Create sections for different game types
    const sections = {
      yourTurn: document.createElement('div'),
      yourGames: document.createElement('div'),
      openGames: document.createElement('div')
    };

    sections.yourTurn.className = 'game-section your-turn-section';
    sections.yourGames.className = 'game-section your-games-section';
    sections.openGames.className = 'game-section open-games-section';

    // Add styles for sections
    const style = document.createElement('style');
    style.textContent = `
      .game-section {
        margin-bottom: 40px;
      }
      .game-section:empty {
        display: none;
      }
      .section-header {
        font-family: 'Freshman', Arial, sans-serif;
        color: white;
        text-align: left;
        margin: 20px 0;
        padding: 5px;
        -webkit-text-stroke: 0.2px black;
      }
      .your-turn-section .game-item {
        transform: scale(1.02);
      }
      .game-section .game-item:last-child {
        margin-bottom: 0;
      }
    `;
    document.head.appendChild(style);

    games.forEach(({id, data, isInGame, isYourTurn}) => {
      const gameElement = document.createElement("div");
      const playerCount = data.players?.length || 0;
      
      gameElement.className = `game-item${isInGame ? ' your-game' : ''}${isYourTurn ? ' your-turn' : ''}`;
      
      const statusText = isYourTurn ? "Your Turn!" : 
                        isInGame ? "In Progress" : 
                        playerCount >= this.numPlayers ? "Full" : "Open";
      
      const statusClass = isYourTurn ? "waiting" : 
                         isInGame ? "active" : 
                         playerCount >= this.numPlayers ? "" : "active";

      gameElement.innerHTML = `
        <div>
          <h3 style="font-family: 'Freshman', Arial, sans-serif; margin: 0;">Game ${id}</h3>
          <p style="margin: 5px 0;">Players: ${playerCount}/${this.numPlayers}</p>
          <div class="game-status">
            <span class="status-indicator ${statusClass}"></span>
            <span>${statusText}</span>
          </div>
        </div>
        ${isInGame ? 
          `<button class="btn" onclick="lobbyManager.joinGame('${id}')">
            ${isYourTurn ? 'Take Turn' : 'View Game'}
           </button>` :
          playerCount < this.numPlayers ?
          `<button class="btn" onclick="lobbyManager.joinGame('${id}')">
            Join Game
           </button>` :
          ''
        }
      `;

      // Add to appropriate section
      if (isYourTurn) {
        if (!sections.yourTurn.querySelector('.section-header')) {
          sections.yourTurn.innerHTML = '<h3 class="section-header">🎲 Your Turn</h3>';
        }
        sections.yourTurn.appendChild(gameElement);
      } else if (isInGame) {
        if (!sections.yourGames.querySelector('.section-header')) {
          sections.yourGames.innerHTML = '<h3 class="section-header">🎮 Your Games</h3>';
        }
        sections.yourGames.appendChild(gameElement);
      } else if (playerCount < this.numPlayers) {
        if (!sections.openGames.querySelector('.section-header')) {
          sections.openGames.innerHTML = '<h3 class="section-header">🎯 Open Games</h3>';
        }
        sections.openGames.appendChild(gameElement);
      }
    });

    // Add sections to the games list
    Object.values(sections).forEach(section => {
      if (section.children.length > 1) { // > 1 because of header
        gamesList.appendChild(section);
      }
    });
  }

  async addUsername() {
    const userText = document.getElementById("user-text").value;
    const errorElement = document.getElementById("error-text");
    
    if (!userText) {
      errorElement.innerHTML = "Please provide a username";
      return;
    }

    try {
      await updateProfile(auth.currentUser, { displayName: userText });
      errorElement.innerHTML = "";
      document.getElementById("username").innerHTML = userText;
      document.getElementById("create-username").style.display = "none";
      document.getElementById("join-create-game").style.display = "";
    } catch (error) {
      errorElement.innerHTML = "Error updating username: " + error.message;
    }
  }

  async loadActiveGames() {
    const querySnapshot = await getDocs(this.gamesCollection);
    this.updateGamesList(querySnapshot);
  }

  async joinOrCreateRandomGame() {
    const querySnapshot = await getDocs(this.gamesCollection);
    const joinableGames = [];
    
    querySnapshot.forEach((doc) => {
      const gameData = doc.data();
      if (gameData.players?.length < this.numPlayers) {
        joinableGames.push(doc.id);
      }
    });

    const gameId = joinableGames.length === 0 
      ? this.generateGameId() 
      : joinableGames[Math.floor(Math.random() * joinableGames.length)];

    this.redirectToGame(gameId);
  }

  async createPrivateGame() {
    const gameId = this.generateGameId();
    const inviteLink = `${window.location.origin}/ffpoker?gameId=${gameId}`;
    
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert(`Copied invite link: ${inviteLink}`);
      this.redirectToGame(gameId);
    } catch (error) {
      console.error("Error creating private game:", error);
      alert("Error creating game. Please try again.");
    }
  }

  joinGame(gameId) {
    this.redirectToGame(gameId);
  }

  redirectToGame(gameId) {
    location.assign(`${window.location.origin}/ffpoker?gameId=${gameId}`);
  }

  generateGameId(length = 6) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    return Array.from({ length }, () => 
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('');
  }
}

// Initialize the lobby manager
const lobbyManager = new LobbyManager();

// Expose necessary functions to window
window.lobbyManager = lobbyManager;
