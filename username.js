function getGameId() {
    const searchParams = new URLSearchParams(window.location.search);
  
    if (!searchParams.has('gameId') || searchParams.get('gameId') == "") {
      console.log ('gameId is not provided');
      return "tempCode";
    }
    else {
      return searchParams.get('gameId');
    }
  }

function addUsername() {
    const userText = document.getElementById('user-text').value;
    if (userText == "") {
        document.getElementById('error-text').innerHTML = "Make sure to provide a username"
    }
    else {
        document.getElementById('error-text').innerHTML = ""
        const origin = window.location.origin;
        const gameId = getGameId();

        location.replace(`${origin}/ffpoker?gameId=${gameId}&username=${userText}`)
    }
}

window.addUsername = addUsername;