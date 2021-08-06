var socket = io();
var cardsOnTable = [];
var roomToJoin;

//gives the socket reference to its own server id
socket.on('idSent', function(id) {
	socketId = id;
});

//============================================ Functions for errors joining a room
//if max players in a room has been reached, throw an error
//********this is a function that shouldn't ever be called due to the way
//the join table works, but it exists just in case I do something dumb with the table
socket.on('maxPlayersReached', function() {
	document.getElementById("sorryText").style.display = "block";
});

//if game has already started in room, show error. Otherwise, show waiting for others
socket.on('gameInProgress', function(isInProgress) {
	if(isInProgress) {
		document.getElementById("sorryProgressText").style.display = "block";
	} else {
		document.getElementById("nameInUseText").style.display = "none";
		document.getElementById("waitText").style.display = "block";
		document.getElementById("nameLabel").style.display = "none";
		document.getElementById("name").style.display = "none";
		document.getElementById("readyButton").style.display = "none";
		document.getElementById("chooseRoom").style.display = "none";
		document.getElementById("roomsTable").style.display = "none";
		for(i = 0; i < numOfCardsInHand; i++) {
			socket.emit('requestedCard', roomToJoin);
		}
	}
});



//==================================================== Functions for start menu use
//print the table of rooms available and not available for joining
socket.on('availableRooms', function(usersInRooms, maxPlayers) {
	var table = document.getElementById("roomsTable");
	var placeInArray = 0;
	var roomNum = 1;
	
	for(var i = 0; i < usersInRooms.length/2; i++) {
		var x = document.createElement("TR");
		x.setAttribute("id", "row"+i);
		table.appendChild(x);
		
		for(var j = 0; j < 2; j++) {
			if(usersInRooms[placeInArray] != undefined) {
				var y = document.createElement("TD");
				y.setAttribute("id", placeInArray);
				var z = document.createTextNode("Room " + roomNum + ": " +
											usersInRooms[placeInArray].length + "/" + maxPlayers);
				y.appendChild(z);
				document.getElementById("row"+i).appendChild(y);
				roomNum++;
				placeInArray++;
			}
		}
	}
	
	//put a click listener on every cell of the table
	var row = document.getElementById('roomsTable').rows;
	for(var i = 0; i < row.length; i++) {
        for(var j = 0; j < row[i].cells.length; j++ ) {
            row[i].cells[j].addEventListener('click', function(){
				for(var i = 0; i < row.length; i++) {
					for(var j = 0; j < row[i].cells.length; j++) {
						row[i].cells[j].style.backgroundColor = "white";
						row[i].cells[j].style.color = "black";
					}
				}
				if(usersInRooms[parseInt(this.id)].length < maxPlayers) {
					document.getElementById("readyButton").style.display = "block";
					this.style.backgroundColor = roomTableSelectColour;
					this.style.color = "white";
					roomToJoin = parseInt(this.id);
				}
            });
        }
    }
});
//update table cells to show when people join rooms
socket.on('updateAvailableRooms', function(usersInRooms, roomNum, maxPlayers) {
	var room = roomNum + 1;
	document.getElementById(roomNum).innerText = "Room " + room + ": " +
										usersInRooms[roomNum].length + "/" + maxPlayers;
});

//after the check for if a name is unique, signal the player is ready or throw an error
socket.on('nameUnique', function(unique) {
	if(unique) {
		playerName = document.getElementById("name").value;
		socket.emit('playerReady', playerName, roomToJoin);
	} else {
		document.getElementById("nameInUseText").style.display = "block";
		document.getElementById("nameLabel").style.display = "inline";
		document.getElementById("name").style.display = "inline";
	}
});

//reveal or hide the "Go" button for rooms with >= min number of players
socket.on('revealGoButton', function() {
	document.getElementById("goButton").style.display = "block";
});
socket.on('hideGoButton', function() {
	document.getElementById("goButton").style.display = "none";
});











//if too many players disconnect from an in-progress game, give an error to refresh
socket.on('callForRestart', function() {
	document.getElementById("sorryGameInterruptText").style.display = "block";
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
});

//when all players have designated they are ready, make the UI game-ready
socket.on('allPlayersReady', function() {
	document.getElementById("waitText").style.display = "none";
	document.getElementById("goButton").style.display = "none";
	document.getElementById("handHeader").style.display = "block";
	document.getElementById("handCanvas").style.visibility = "visible";
	document.getElementById("handHeader").innerHTML = playerName + "'s Hand";
	canChooseCard = true;
});

//when a player is done with a game, reset their view to the first screen
socket.on('returnToMenu', function() {
	//clear the canvases
	var ctx = tableCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx = handCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	
	//clear local variables and hide stuff
	cardArray = [];
	isTurn = false
	canChooseCard = false;
	round = 1;
	roomToJoin = "";
	document.getElementById("roomTitle").style.display = "none";
	document.getElementById("quitButton").style.display = "none";
	
	//show the rooms table
	document.getElementById("chooseRoom").style.display = "block";
	document.getElementById("roomsTable").style.display = "block";
});

//when a winning card is chosen, clear the table and update the score
//then, check to see if someone won with the new score
socket.on('clearTable', function(idsAndScore) {
	cardsOnTable = [];
	
	checkForWinner(idsAndScore);
	canChooseCard = true;
});

// used to call forced-winner scenarios (i.e. if we run out of question cards)
socket.on('chooseWinner', function(idsAndScore) {
	var winner = idsAndScore[0][2]
	var winningScore = idsAndScore[0][1];
	for(var i = 1; i < idsAndScore.length; i++) {
		if(idsAndScore[i][1] > winningScore) {
			winner = idsAndScore[i][2];
			winningScore = idsAndScore[i][1];
		}
	}
	// only call the winning code once from the server
	if(socketId == winner) {
		socket.emit('playerHasWon', winner);
	}
});

socket.on('endGame', function(idsAndScore, winner) {
	// disable everything else and display the winner, effectively ending the game
	isTurn = false;
	canChooseCard = false;
	
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
	document.getElementById("quitButton").style.display = "block";
	drawWinner(idsAndScore, winner);
});

socket.on('requestedCard', function(content) {
	addNewCardToArray(content);
});
socket.on('sentCardSuccess', function() {
	socket.emit('requestedCard', roomToJoin);
});
socket.on('updateTableUsers', function(idsAndScore) {
	if(playerName != undefined) {
		var room = parseInt(roomToJoin) + 1;
		document.getElementById("roomTitle").style.display = "block";
		document.getElementById("roomTitle").innerHTML = "Room " + room;
	}
	updateTableUsers(idsAndScore);
});
socket.on('yourTurn', function() {
	console.log("Your Turn");
	isTurn = true;
	canChooseCard = false;
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
});


socket.on('displayQuestionCard', function(idsAndScore, content) {
	updateTableWithCard(idsAndScore, content);
});

socket.on('addCardToTable', function(content, id, usersSize) {
	card = new Card(content);
	card.owner = id;
	cardsOnTable.push(card);
	if(cardsOnTable.length == usersSize - 1) {
		if(isTurn) {
			document.getElementById("judgeText").style.display = "block";
		}
		drawCardsToChooseWinnerFrom(cardsOnTable, tableCanvas);
	}
});


// Requests a new card from the server
function getNewCard(socket) {
	socket.emit('requestedCard', roomNum);
}

// Takes content recieved from the server and adds it to the card hand array
function addNewCardToArray(content) {
	cardArray.push(new Card(content));
	drawOnCanvas(cardArray, handCanvas);
}

// Sends chosen card to server and removes it from the array
function sendCardToServer(socket, card, roomNum) {
	socket.emit('sentCard', card, roomNum);
	cardArray.splice(cardArray.indexOf(card), 1);
	drawOnCanvas(cardArray, handCanvas);
}

function checkForWinner(idsAndScore) {
	if(winByRounds) { // if game is set to win after x rounds
		if(round/idsAndScore.length == numOfRounds) {
			// see who has the highest score (make applicable for ties later?)
			var winner = idsAndScore[0][2];
			var winningScore = idsAndScore[0][1]
			for(var i = 1; i < idsAndScore.length; i++) {
				if(idsAndScore[i][1] > winningScore) {
					winner = idsAndScore[i][2];
					winningScore = idsAndScore[i][1];
				}
			}
			// only call the winning code once from the server
			if(socketId == winner) {
				socket.emit('playerHasWon', winner, roomToJoin);
			}
		}
		round++;
	} else { // else, game is set to check scores for a possible winner
		for(var i = 0; i < idsAndScore.length; i++) {
			if(idsAndScore[i][1] == scoreToWin) {
				// only call the winning code once from the server
				if(socketId == idsAndScore[i][2]) {
					socket.emit('playerHasWon', idsAndScore[i][2], roomToJoin);
				}
			}
		}
	}
}
