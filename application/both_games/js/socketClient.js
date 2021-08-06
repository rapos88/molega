var socket = io();
var roomToJoin = "";

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
		socket.emit('requestedCard', numOfCardsInHand, roomToJoin);
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
socket.on('nameNotUnique', function() {
	document.getElementById("nameInUseText").style.display = "block";
	document.getElementById("nameLabel").style.display = "inline";
	document.getElementById("name").style.display = "inline";
});

//reveal or hide the "Go" button for rooms with >= min number of players
socket.on('revealGoButton', function() {
	document.getElementById("goButton").style.display = "block";
});
socket.on('hideGoButton', function() {
	document.getElementById("goButton").style.display = "none";
});

//==================================================== Functions for game end
//if too many players disconnect from an in-progress game, give an error to refresh
socket.on('callForRestart', function() {
	document.getElementById("sorryGameInterruptText").style.display = "block";
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
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


// Misc.

socket.on('sentCardSuccess', function() {
	socket.emit('requestedCard', 1, roomToJoin);
});

socket.on('checkWinner', function(idsAndScore) {
	checkForWinner(idsAndScore);
});

function checkForWinner(idsAndScore) {
	var isWinner = false;
	var tieArr = [];
	if(winByRounds) { // if game is set to win after x rounds
		if(round == numOfRounds) {
			var winner = null;
			var winningScore = 0;
			for(var i = 0; i < idsAndScore.length; i++) {
				if(idsAndScore[i][1] >= winningScore) {
					if(winner == null | winningScore < idsAndScore[i][1]) {
						winner = idsAndScore[i][2];
						winningScore = idsAndScore[i][1];
						tieArr = [];
					} else if(winningScore == idsAndScore[i][1]) {
						tieArr.push(idsAndScore[i][2]);
					}
				}
			}
			
			isWinner = true;
			if(socketId == winner) {
				if(tieArr != []) {
					tieArr.push(winner);
					socket.emit('playerHasWon', tieArr, roomToJoin);
				} else {
					socket.emit('playerHasWon', winner, roomToJoin);
				}
			}
		}
		round++;
	} else { // else, game is set to check scores for a possible winner
		var winner = null;
		var winningScore = null;
		for(var i = 0; i < idsAndScore.length; i++) {
			if(idsAndScore[i][1] >= scoreToWin) {
				if(winner == null | winningScore < idsAndScore[i][1]) {
					winner = idsAndScore[i][2];
					winningScore = idsAndScore[i][1];
					tieArr = [];
				} else if(winningScore == idsAndScore[i][1]) {
					tieArr.push(idsAndScore[i][2]);
				}
			}
		}
		if(winner != null) {
			isWinner = true;
			if(socketId == winner) {
				if(tieArr != []) {
					tieArr.push(winner);
					socket.emit('playerHasWon', tieArr, roomToJoin);
				} else {
					socket.emit('playerHasWon', winner, roomToJoin);
				}
			}
		}
	}
}