// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  collection,
  getDocs,
  getFirestore,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

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

const gamesCollection = collection(db, "games");

const querySnapshot = await getDocs(gamesCollection);
const numPlayers = 4; // This may be stored in each game's gameState later, but for now manually defined

if (!auth.currentUser) {
  signInAnonymously(auth);
}

if (auth.currentUser?.displayName) {
  document.getElementById("user-text").value = auth.currentUser.displayName;
  document.getElementById("create-username").style.display = "none";
  document.getElementById("join-create-game").style.display = "";
  document.getElementById("username").innerHTML = auth.currentUser.displayName;
  getAndShowMyGames();
}

async function getAndShowMyGames() {
  const userText = document.getElementById("user-text").value;
  const myGames = querySnapshot.docs.filter((doc) => {
    const gameData = doc.data();
    console.log(gameData);
    const players = gameData["players"];
    return players.some((player) => player.id === auth.currentUser.uid);
  });
  console.log(myGames);
  myGames.forEach((doc) => {
    const gameData = doc.data();
    const gameId = doc.id;
    const players = gameData["players"];
    console.log(gameId, players.length, gameData);
    document.getElementById("my-games").innerHTML += gamePreview(
      gameId,
      gameData
    );
  });
}

async function addUsername() {
  const userText = document.getElementById("user-text").value;
  if (userText == "") {
    document.getElementById("error-text").innerHTML =
      "Make sure to provide a username";
  } else {
    if (!auth.currentUser) alert("No user");
    await updateProfile(auth.currentUser, {
      displayName: userText,
    });

    document.getElementById("error-text").innerHTML = "";
    document.getElementById("username").innerHTML = userText;
    document.getElementById("create-username").style.display = "none";
    document.getElementById("join-create-game").style.display = "";
  }
}

function joinOrCreateRandomGame() {
  const joinableGames = [];
  querySnapshot.forEach((doc) => {
    const gameData = doc.data();
    const gameId = doc.id;
    const players = gameData["players"];

    console.log(gameId, players.length, gameData);
    if (players.length < numPlayers) {
      joinableGames.push(gameId);
    }
  });

  const address = window.location.origin;

  if (joinableGames.length == 0) {
    // Currently no system to make sure the gameId hasn't been taken
    const gameId = getCharacterString(6);
    console.log(`${gameId} was randomly generated for the gameId`);
    location.assign(`${address}/ffpoker?gameId=${gameId}`);
  } else {
    const gameId =
      joinableGames[Math.floor(Math.random() * joinableGames.length)];
    console.log(`${gameId} was randomly selected from the available games`);
    location.assign(`${address}/ffpoker?gameId=${gameId}`);
  }
}

function createPrivateGame() {
  try {
    const gameId = getCharacterString(6);
    // Determine if a gameId is taken

    //
    const address = window.location.origin;

    const inviteLink = `${address}/ffpoker?gameId=${gameId.toString()}`;
    navigator.clipboard.writeText(inviteLink);

    alert(`Copied invite link: ${inviteLink}`);

    location.assign(`${address}/ffpoker?gameId=${gameId.toString()}`);
  } catch (error) {
    console.error("Error getting documents: ", error);
  }
}

function getCharacterString(length) {
  const charList = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const finalCharArr = [];
  for (let i = 0; i < length; i++) {
    finalCharArr.push(
      charList.charAt(Math.floor(Math.random() * charList.length))
    );
  }
  const finalChar = finalCharArr.toString().replaceAll(",", "");
  return finalChar;
}

function gamePreview(gameId, gameData) {
  const address = window.location.origin;
  return `<a href="${address}/ffpoker?gameId=${gameId}" class="game-preview">
    <h3>Game ID: ${gameId}</h3>
    <p>Players: ${gameData.players.map((player) => player.username).join(", ")}</p>
    <p>Status: ${gameData.status}</p>
  </a>`;
}

window.addUsername = addUsername;
window.joinOrCreateRandomGame = joinOrCreateRandomGame;
window.createPrivateGame = createPrivateGame;
