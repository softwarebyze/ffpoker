// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  collection,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  updateProfile,
  getAuth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  browserSessionPersistence,
  setPersistence,
  onAuthStateChanged,
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

// Enable session persistence
setPersistence(auth, browserSessionPersistence);

// Initialize anonymous auth
signInAnonymously(auth).catch(error => {
  console.error("Error signing in anonymously:", error);
});

// Handle auth state changes
onAuthStateChanged(auth, handleAuthStateChange);

function handleAuthStateChange(user) {
  if (!user) {
    redirectToUsername();
    return;
  }

  if (!user.displayName) {
    showUsernameCreation();
    return;
  }

  showAuthenticatedUI(user);
}

function redirectToUsername() {
  location.replace(`${window.location.origin}/username${window.location.search}`);
}

function showUsernameCreation() {
  document.getElementById("create-username").style.display = "";
  document.getElementById("join-create-game").style.display = "none";
}

function showAuthenticatedUI(user) {
  const userTextEl = document.getElementById("user-text");
  const createUsernameEl = document.getElementById("create-username");
  const joinCreateGameEl = document.getElementById("join-create-game");
  const usernameEl = document.getElementById("username");

  userTextEl.value = user.displayName;
  createUsernameEl.style.display = "none";
  joinCreateGameEl.style.display = "";
  usernameEl.innerHTML = user.displayName;
}

class LobbyManager {
  constructor() {
    this.gamesCollection = collection(db, "games");
    this.numPlayers = 4;
    this.init();
  }

  async init() {
    this.setupUI();
    this.setupListeners();
    await this.loadActiveGames();
  }

  setupUI() {
    this.addStyles();
  }

  addStyles() {
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
  }

  setupListeners() {
    const activeGamesQuery = query(
      this.gamesCollection,
      where("status", "in", ["awaitingPlayers", "awaitingStart", "active", "awaitingResults", "resultsShown"])
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
      const isYourTurn = isInGame && 
        gameData.status === "active" &&
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
      
      const statusText = this.getGameStatusText(data.status, isYourTurn, isInGame, playerCount);
      const statusClass = this.getGameStatusClass(data.status, isYourTurn);

      gameElement.innerHTML = `
        <div>
          <h3 style="font-family: 'Freshman', Arial, sans-serif; margin: 0;">Game ${id}</h3>
          <p style="margin: 5px 0;">Players: ${playerCount}/${this.numPlayers}</p>
          <div class="game-status">
            <span class="status-indicator ${statusClass}"></span>
            <span>${statusText}</span>
          </div>
        </div>
        ${this.getGameActionButton(data, id, isInGame, isYourTurn, playerCount)}
      `;

      this.addGameElementToSection(gameElement, data, isInGame, isYourTurn, playerCount, sections);
    });

    // Add sections to the games list
    Object.values(sections).forEach(section => {
      if (section.children.length > 1) { // > 1 because of header
        gamesList.appendChild(section);
      }
    });
  }

  getGameStatusText(status, isYourTurn, isInGame, playerCount) {
    switch (status) {
      case "awaitingPlayers":
        return playerCount >= this.numPlayers ? "Full" : "Waiting for Players";
      case "awaitingStart":
        return "Ready to Start";
      case "active":
        return isYourTurn ? "Your Turn!" : isInGame ? "In Progress" : "Game in Progress";
      case "awaitingResults":
        return "Waiting for Results";
      case "resultsShown":
        return "Game Complete";
      default:
        return "Unknown Status";
    }
  }

  getGameStatusClass(status, isYourTurn) {
    switch (status) {
      case "awaitingPlayers":
        return "waiting";
      case "awaitingStart":
        return "waiting";
      case "active":
        return isYourTurn ? "waiting" : "active";
      case "awaitingResults":
        return "waiting";
      case "resultsShown":
        return "";
      default:
        return "";
    }
  }

  getGameActionButton(gameData, gameId, isInGame, isYourTurn, playerCount) {
    const { status } = gameData;

    if (isInGame) {
      return `<button class="btn" onclick="lobbyManager.joinGame('${gameId}')">
        ${isYourTurn ? 'Take Turn' : 'View Game'}
      </button>`;
    }

    if (status === "awaitingPlayers" && playerCount < this.numPlayers) {
      return `<button class="btn" onclick="lobbyManager.joinGame('${gameId}')">
        Join Game
      </button>`;
    }

    return '';
  }

  addGameElementToSection(gameElement, gameData, isInGame, isYourTurn, playerCount, sections) {
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
    } else if (gameData.status === "awaitingPlayers" && playerCount < this.numPlayers) {
      if (!sections.openGames.querySelector('.section-header')) {
        sections.openGames.innerHTML = '<h3 class="section-header">🎯 Open Games</h3>';
      }
      sections.openGames.appendChild(gameElement);
    }
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
      showAuthenticatedUI({ displayName: userText });
      errorElement.innerHTML = "";
    } catch (error) {
      errorElement.innerHTML = `Error updating username: ${error.message}`;
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

  showSignupForm() {
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
  }

  showLoginForm() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  }

  async signUp() {
    const { email, password, username, isValid } = this.getSignupFormData();
    if (!isValid) return;

    try {
      if (auth.currentUser?.isAnonymous) {
        await this.upgradeAnonymousAccount(email, password, username);
      } else {
        await this.createNewAccount(email, password, username);
      }
      
      this.hideAuthForms();
      showAuthenticatedUI({ displayName: username });
    } catch (error) {
      document.getElementById('signup-error').innerHTML = error.message;
    }
  }

  getSignupFormData() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const username = document.getElementById('user-text').value;
    const errorElement = document.getElementById('signup-error');

    if (!email || !password || !username) {
      errorElement.innerHTML = 'Please fill in all fields';
      return { isValid: false };
    }

    return { email, password, username, isValid: true };
  }

  async upgradeAnonymousAccount(email, password, username) {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(auth.currentUser, credential);
    await updateProfile(auth.currentUser, { displayName: username });
  }

  async createNewAccount(email, password, username) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
  }

  async login() {
    const { email, password, isValid } = this.getLoginFormData();
    if (!isValid) return;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.hideAuthForms();
      showAuthenticatedUI(userCredential.user);
    } catch (error) {
      document.getElementById('login-error').innerHTML = error.message;
    }
  }

  getLoginFormData() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorElement = document.getElementById('login-error');

    if (!email || !password) {
      errorElement.innerHTML = 'Please fill in all fields';
      return { isValid: false };
    }

    return { email, password, isValid: true };
  }

  hideAuthForms() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('create-username').style.display = 'none';
    document.getElementById('join-create-game').style.display = '';
  }

  async logout() {
    try {
      await auth.signOut();
      location.reload();
    } catch (error) {
      console.error("Error signing out:", error);
      alert("Error signing out. Please try again.");
    }
  }

  async deleteAccount() {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      await this.cleanupUserGames(user);
      await user.delete();
      // Auth state observer will handle UI updates
    } catch (error) {
      console.error("Error deleting account:", error);
      alert(`Error deleting account: ${error.message}`);
    }
  }

  async cleanupUserGames(user) {
    const userGames = await getDocs(
      query(this.gamesCollection, where("players", "array-contains", { id: user.uid }))
    );

    const gameUpdates = userGames.docs.map(async (gameDoc) => {
      const gameData = gameDoc.data();
      if (gameData.players.length <= 1) {
        return deleteDoc(doc(db, "games", gameDoc.id));
      }
      
      const updatedPlayers = gameData.players.filter(p => p.id !== user.uid);
      return updateDoc(doc(db, "games", gameDoc.id), { players: updatedPlayers });
    });

    await Promise.all(gameUpdates);
  }

  // UI Helper Methods
  showSignupForm() {
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('login-form').style.display = 'none';
  }

  showLoginForm() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
  }
}

// Initialize the lobby manager
const lobbyManager = new LobbyManager();

// Expose necessary functions to window
window.lobbyManager = lobbyManager;
