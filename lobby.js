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
        gap: 10px;
        margin: 20px 0;
      }
      .game-item {
        background: #f5f5f5;
        padding: 15px;
        border-radius: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
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
    // Real-time updates for active games
    const activeGamesQuery = query(
      this.gamesCollection,
      where("status", "==", "waiting")
    );

    onSnapshot(activeGamesQuery, (snapshot) => {
      this.updateGamesList(snapshot);
    });
  }

  updateGamesList(snapshot) {
    const gamesList = document.getElementById("games-list");
    if (!gamesList) return;

    gamesList.innerHTML = "";
    snapshot.forEach((doc) => {
      const gameData = doc.data();
      const gameElement = document.createElement("div");
      gameElement.className = "game-item";
      gameElement.innerHTML = `
        <div>
          <h3>Game ${doc.id}</h3>
          <p>Players: ${gameData.players?.length || 0}/${this.numPlayers}</p>
        </div>
        <button class="btn" onclick="lobbyManager.joinGame('${doc.id}')">
          Join Game
        </button>
      `;
      gamesList.appendChild(gameElement);
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
