var currentQuestion;
var cardsOnTable = [];

//============================================================Client functions
// returns the card that the judging player clicked on as the winner
function getWinningCard(x, y) {
	for(var i = 0; i < cardsOnTable.length; i++) {
		if(x > cardsOnTable[i].x & x < cardsOnTable[i].x + cardsOnTable[i].width) {
			if(y > cardsOnTable[i].y & y < cardsOnTable[i].y + cardsOnTable[i].height) {
				return cardsOnTable[i];
			}
		}
	}
}

// update the table with user's names along with the question card
function updateTableWithCard(userIds, content) {
	var ctx = tableCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	x = 20;
	y = 40;
	var playerTextWidth = 0;
	
	for(var i = 0; i < userIds.length; i++) {
		//first draw the player names on the canvas
		ctx.fillStyle = fontColour;
		ctx.font = tableFontSize + "px " + fontType;
		ctx.textAlign = "left";
		if(userIds[i][2] == socketId) {
			ctx.font = "bold " + tableFontSize + "px " + fontType;
		}
		currentTxt = userIds[i][0] +" - " + userIds[i][1];
		ctx.fillText(currentTxt, x, y);
		y += 40;
		
		//then figure out which is the longest to ensure proper card placement
		if(ctx.measureText(currentTxt).width > playerTextWidth) {
			playerTextWidth = ctx.measureText(currentTxt).width;
		}
	}
	x = 40 + playerTextWidth + spaceBetweenCards;
	currentQuestion = new Card(content);
	currentQuestion.colour = questionCardColour;
	if(x + currentQuestion.width > ctx.canvas.width) {
		x = 40;
		if(y + currentQuestion.height > ctx.canvas.height) {
			ctx.canvas.height += currentQuestion.height + spaceBetweenCards;
		}
		currentQuestion.drawCard(x, y, tableCanvas);
	} else {
		y = 40;
		currentQuestion.drawCard(x, y, tableCanvas);
	}
}

// draw the cards for the judge to choose from
function drawCardsToChooseWinnerFrom(cardArray, canvas) {
	var ctx = canvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	var x = 20;
	var y = 20;
	changeX = cardWidth + spaceBetweenCards;
	changeY = cardHeight + spaceBetweenCards;
	currentQuestion.drawCard(x, y, tableCanvas);
	x += changeX;
	for (i = 0; i < cardArray.length; i++) {
		cardArray[i].drawCard(x, y, canvas);
		x += changeX;
		
		//if card width added to x position would put it off the canvas, move down
		if(x + changeX > ctx.canvas.width) {
			x = 20;
			y += changeY;
		}
		//if card height added to the y position would put it off the canvas, make it bigger
		if(y + cardHeight > ctx.canvas.height) {
			ctx.canvas.height += cardHeight + spaceBetweenCards;
		}
	}
}

//============================================================Socket functions
//==================================================== Functions for game start
//when all players have designated they are ready, make the UI game-ready
socket.on('allPlayersReady', function() {
	document.getElementById("waitText").style.display = "none";
	document.getElementById("goButton").style.display = "none";
	document.getElementById("handHeader").style.display = "block";
	document.getElementById("handCanvas").style.visibility = "visible";
	document.getElementById("handHeader").innerHTML = playerName + "'s Hand";
	canChooseCard = true;
});

socket.on('updateTableUsers', function(idsAndScore) {
	var room = parseInt(roomToJoin) + 1;
	document.getElementById("roomTitle").style.display = "block";
	document.getElementById("roomTitle").innerHTML = "Room " + room;
	
	updateTableUsers(idsAndScore);
});

//Misc.

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
socket.on('clearTable', function(idsAndScore) {
	cardsOnTable = [];
	
	if(isTurn) {
		socket.emit('passTurn', roomToJoin);
		isTurn = false;
	}
	canChooseCard = true;
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
	for(var i = 0; i < content.length; i++) {
		cardArray.push(new Card(content[i]));
	}
	drawOnCanvas(cardArray, handCanvas);
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
	socket.emit('requestedCard', 1, roomToJoin);
}

// Sends chosen card to server and removes it from the hand array
function sendCardToServer(socket, card, roomNum) {
	socket.emit('sentCard', card, roomNum);
	cardArray.splice(cardArray.indexOf(card), 1);
	drawOnCanvas(cardArray, handCanvas);
}

//============================================================page actions

document.getElementById("handCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("handCanvas"), e);
	c = getClickedCard.apply(null, xyPair);
	if(c != undefined & canChooseCard) {
		sendCardToServer(socket, c, roomToJoin);
		canChooseCard = false;
	}
});

document.getElementById("tableCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("tableCanvas"), e);
	c = getWinningCard.apply(null, xyPair);
	if(c != undefined & isTurn) {
		socket.emit('winChoice', c, roomToJoin);
		canChooseCard = true;
		document.getElementById("handHeader").style.display = "block";
		document.getElementById("handCanvas").style.visibility = "visible";
		document.getElementById("judgeText").style.display = "none";
	}
});