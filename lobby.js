// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getFirestore,
    doc,
    addDoc,
    deleteDoc,
    updateDoc,
    onSnapshot,
    collection,
    getDocs,
    getDoc,
    arrayUnion,
    setDoc
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
// const auth = getAuth(app);

// Assuming db is your Firestore instance
const gamesCollection = collection(db, 'games');

const querySnapshot = await getDocs(gamesCollection);
const numPlayers = 4; // This may be stored in each game's gameState later, but for now manually defined

try {
    querySnapshot.forEach((doc) => {
        const gameData = doc.data();
        const gameState = gameData.gameState;
        const gameId = doc.id;
        // Access game state here
        // console.log(`gameId: ${gameId}\ngameData: ${gameData}\ngameState: ${gameState}`);
    });

} catch (error) {
    console.error("Error getting documents: ", error);
}



function addUsername() {
    const userText = document.getElementById('user-text').value;
    if (userText == "") {
        document.getElementById('error-text').innerHTML = "Make sure to provide a username"
    }
    else {
        document.getElementById('error-text').innerHTML = ""
        document.getElementById('create-username').style.display = "none"
        document.getElementById('join-create-game').style.display = ""
    }
}

function joinOrCreateRandomGame() {
    const joinableGames = [];
    querySnapshot.forEach((doc) => {
        const gameData = doc.data();
        const gameId = doc.id;
        const players = gameData['players'];

        console.log(gameId, players.length, gameData);
        if (players.length < numPlayers) {
            joinableGames.push(gameId)
        }
    });

    const username = document.getElementById('user-text').value;
    const address = window.location.href;

    if (joinableGames.length == 0) { // Currently no system to make sure the gameId hasn't been taken
        const gameId = getCharacterString(6);
        console.log(`${gameId} was randomly generated for the gameId`)
        location.assign(`${address}ffpoker?gameId=${gameId}&username=${username}`)
    } else {
        const gameId = joinableGames[Math.floor(Math.random() * joinableGames.length)]
        console.log(`${gameId} was randomly selected from the availible games`)
        location.assign(`${address}ffpoker?gameId=${gameId}&username=${username}`)
    }


}

function getCharacterString(length) {
    const charList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const finalCharArr = [];
    for (let i = 0; i < length; i++) {
        finalCharArr.push(charList.charAt(Math.floor(Math.random() * charList.length)))
    }
    return finalCharArr.toString();
}

window.addUsername = addUsername;
window.joinOrCreateRandomGame = joinOrCreateRandomGame;