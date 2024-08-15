// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
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
const auth = getAuth(app);

if (!auth.currentUser) {
  signInAnonymously(auth);
}

if (auth.currentUser.displayName) {
  // If the current user already has a display name, don't reassign it
  const gameId = getGameId();

  location.replace(`/ffpoker?gameId=${gameId}`);
}

function getGameId() {
  const searchParams = new URLSearchParams(window.location.search);

  if (!searchParams.has("gameId") || searchParams.get("gameId") == "") {
    console.log("gameId is not provided");
    return location.replace(`/`);
  } else {
    return searchParams.get("gameId");
  }
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
    const gameId = getGameId();

    location.replace(`/ffpoker?gameId=${gameId}`);
  }
}

window.addUsername = addUsername;
