var pointCards = [];
var lookingAtOppCards = false;
var cardSelected = null;
var idsAndScore;

//============================================================Client functions
function getTableClickedCard(x, y) {
	for(var i = 0; i < pointCards.length; i++) {
		if(x > pointCards[i].x & x < pointCards[i].x + pointCards[i].width) {
			if(y > pointCards[i].y & y < pointCards[i].y + pointCards[i].height) {
				return pointCards[i];
			}
		}
	}
}

function getTableClickedName(x, y) {
	let firstNum = 40 - tableFontSize;
	let spacing = tableFontSize - 15;
	
	for(var i = 0; i < idsAndScore.length; i++) {
		var lowerBound = firstNum + (tableFontSize*i) + (spacing*i);
		var upperBound = firstNum + (tableFontSize*(i+1)) + (spacing*i);
		if(x > 20 & y >= lowerBound & y <= upperBound) {
			return idsAndScore[i];
		}
	}
}

function updateTable(userIds) {
	var ctx = tableCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	x = 20;
	y = 40;
	var changeY = cardHeight + spaceBetweenCards;
	var changeUserY = tableFontSize*2 - 15;
	
	//augment size of canvas before drawing, if needed
	ctx.canvas.height = 350;
	for(var i = 0; i < userIds.length; i++) {
		y += changeUserY;
		if(y >= ctx.canvas.height) {
			ctx.canvas.height += changeUserY;
		}
	}
	for(var i = 0; i < pointCards.length; i++) {
		if(i != pointCards.length-1) {
			if(pointCards[i].relation == pointCards[i+1].relation) {
				x += cardWidth + spaceBetweenCards/2;
			} else {
				x += cardWidth + spaceBetweenCards*2;
			}
		}
		
		//if card width added to x position would put it off the canvas, move down
		if(x + cardWidth + spaceBetweenCards*2 > ctx.canvas.width) {
			x = 20;
			y += changeY;
		}
		//if card height added to the y position would put it off the canvas, make it bigger
		if(y + cardHeight > ctx.canvas.height) {
			ctx.canvas.height += cardHeight + spaceBetweenCards;
		}
	}
	
	ctx.canvas.height += tableFontSize*2;
	
	x = 20;
	y = 40;
	
	//draw all of the users and their scores
	for(var i = 0; i < userIds.length; i++) {
		ctx.fillStyle = fontColour;
		ctx.font = tableFontSize + "px " + fontType;
		ctx.textAlign = "left";
		if(userIds[i][2] == socketId) {
			ctx.font = "bold " + tableFontSize + "px " + fontType;
		}
		ctx.fillText(userIds[i][0] + " - " + userIds[i][1], x, y);
		y += changeUserY;
		if(y >= ctx.canvas.height) {
			ctx.canvas.height += changeUserY;
		}
	}
	
	y += tableFontSize;
	ctx.font = tableFontSize + "px " + fontType;
	ctx.fillText("Your Point Cards:", x, y);
	y += tableFontSize;
	
	//draw the client's point cards
	for(var i = 0; i < pointCards.length; i++) {
		pointCards[i].drawCard(x, y, tableCanvas);
		if(i != pointCards.length-1) {
			if(pointCards[i].relation == pointCards[i+1].relation) {
				x += cardWidth + spaceBetweenCards/2;
			} else {
				x += cardWidth + spaceBetweenCards*2;
			}
		}		
		
		//if card width added to x position would put it off the canvas, move down
		if(x + cardWidth + spaceBetweenCards*2 > ctx.canvas.width) {
			x = 20;
			y += changeY;
		}
	}
}

function drawOppCards(userIds, opponent) {
	lookingAtOppCards = true;
	var ctx = tableCanvas.context;
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	x = 20;
	y = 40;
	var changeY = cardHeight + spaceBetweenCards;
	var changeUserY = tableFontSize*2 - 15;
	
	//augment size of canvas before drawing, if needed
	ctx.canvas.height = 350;
	for(var i = 0; i < userIds.length; i++) {
		y += changeUserY;
		if(y >= ctx.canvas.height) {
			ctx.canvas.height += changeUserY;
		}
	}
	for(var i = 0; i < opponent[3].length; i++) {
		if(i != opponent[3].length-1) {
			if(opponent[3][i].relation == opponent[3][i+1].relation) {
				x += cardWidth + spaceBetweenCards/2;
			} else {
				x += cardWidth + spaceBetweenCards*2;
			}
		}
		
		//if card width added to x position would put it off the canvas, move down
		if(x + cardWidth + spaceBetweenCards*2 > ctx.canvas.width) {
			x = 20;
			y += changeY;
		}
		//if card height added to the y position would put it off the canvas, make it bigger
		if(y + cardHeight > ctx.canvas.height) {
			ctx.canvas.height += cardHeight + spaceBetweenCards;
		}
	}
	
	ctx.canvas.height += tableFontSize*2;
	
	x = 20;
	y = 40;
	
	//draw all of the users and their scores
	for(var i = 0; i < userIds.length; i++) {
		ctx.fillStyle = fontColour;
		ctx.font = tableFontSize + "px " + fontType;
		ctx.textAlign = "left";
		if(userIds[i][2] == socketId) {
			ctx.font = "bold " + tableFontSize + "px " + fontType;
		}
		ctx.fillText(userIds[i][0] + " - " + userIds[i][1], x, y);
		y += changeUserY;
		if(y >= ctx.canvas.height) {
			ctx.canvas.height += changeUserY;
		}
	}
	
	y += tableFontSize;
	ctx.font = tableFontSize + "px " + fontType;
	ctx.fillText(opponent[0] + "'s Point Cards:", x, y);
	y += tableFontSize;
	
	//draw the opponent's point cards
	for(var i = 0; i < opponent[3].length; i++) {
		var card = new Card(opponent[3][i].content, opponent[3][i].relation, opponent[3][i].order);
		card.drawCard(x, y, tableCanvas);
		if(i != opponent[3].length-1) {
			if(opponent[3][i].relation == opponent[3][i+1].relation) {
				x += cardWidth + spaceBetweenCards/2;
			} else {
				x += cardWidth + spaceBetweenCards*2;
			}
		}
		
		//if card width added to x position would put it off the canvas, move down
		if(x + cardWidth + spaceBetweenCards*2 > ctx.canvas.width) {
			x = 20;
			y += changeY;
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
	updateTable(idsAndScore);
});

socket.on('updateTableUsers', function(idsAndScores) {
	var room = parseInt(roomToJoin) + 1;
	document.getElementById("roomTitle").style.display = "block";
	document.getElementById("roomTitle").innerHTML = "Room " + room;
	
	idsAndScore = idsAndScores;
	updateTableUsers(idsAndScores);
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
	pointCards = [];
	idsAndScore = [];
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

// used to forcefully end the game for a non-player reason (e.g. not enough cards to go around to begin)
socket.on('forceEnd', function() {
	document.getElementById("goButton").style.display = "none";
	document.getElementById("waitText").style.display = "none";
	document.getElementById("forceEndText").style.display = "block";
});

//Misc.

//used to update table users on ui from anywhere (only used for relations right now)
socket.on('refreshUsers', function(idsAScore) {
	idsAndScore = idsAScore
	updateTable(idsAndScore);
});

socket.on('endGame', function(idsAndScore, winner) {
	// disable everything else and display the winner, effectively ending the game
	isTurn = false;
	canChooseCard = false;
	
	document.getElementById("handHeader").style.display = "none";
	document.getElementById("handCanvas").style.visibility = "hidden";
	document.getElementById("turn").style.display = "none";
	document.getElementById("quitButton").style.display = "block";
	drawWinner(idsAndScore, winner);
});

// Takes content recieved from the server and adds it to the card hand array
socket.on('requestedCard', function(contentArray) {
	for(var i = 0; i < contentArray.length; i++) {
		curCard = contentArray[i];
		cardArray.push(new Card(curCard[0], curCard[1], curCard[2]));
	}
	drawOnCanvas(cardArray, handCanvas);
});

socket.on('yourTurn', function() {
	console.log("Your Turn");
	isTurn = true;
	canChooseCard = true;
	document.getElementById("turn").style.display = "inline";
	document.getElementById("handHeader").style.display = "block";
	document.getElementById("handCanvas").style.visibility = "visible";
});

//============================================================page actions

document.getElementById("handCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("handCanvas"), e);
	c = getClickedCard.apply(null, xyPair);
	if(c != undefined & canChooseCard & c != cardSelected) {
		document.getElementById("discardSelected").style.display = "inline";
		//if there is no card currently selected, select this one
		if(cardSelected == null) {
			cardSelected = c;
		//if a card is selected, compare the relationship. If related, add to table
		} else if(c.relation == cardSelected.relation) {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					break;
				}
			}
			// first check if the pair is connected to other cards on the table
			var onTable = false;
			var insertIndex;
			for(var i = 0; i < pointCards.length; i++) {
				if(pointCards[i].relation == cardSelected.relation) {
					onTable = true;
					insertIndex = i;
					break;
				}
			}	
			if(onTable) {
				arr = [c, cardSelected];
				//for each card selected in the handCanvas, place it
				for(var i = 0; i < arr.length; i++) {
					selectedOrder = arr[i].order;
					selectedRel = arr[i].relation;
					if(selectedOrder < pointCards[insertIndex].order) {
						while(selectedOrder < pointCards[insertIndex].order) {
							insertIndex--;
							if(pointCards[insertIndex] == undefined) {
								insertIndex++;
								break;
							} else if(selectedOrder > pointCards[insertIndex].order) {
								insertIndex++;
								break;
							} else if (pointCards[insertIndex].relation != selectedRel) {
								insertIndex++;
								break;
							}
						}
					} else if(selectedOrder > pointCards[insertIndex].order) {
						while(selectedOrder > pointCards[insertIndex].order) {
							insertIndex++;
							if(pointCards[insertIndex] == undefined) {
								break;
							} else if(selectedOrder < pointCards[insertIndex].order) {
								break;
							} else if (pointCards[insertIndex].relation != selectedRel) {
								break;
							}
						}
					}
					pointCards.splice(insertIndex, 0, arr[i]);
				}
			} else if(!onTable & c.order < cardSelected.order) {
				pointCards.push(c);
				pointCards.push(cardSelected);
			} else if (!onTable) {
				pointCards.push(cardSelected);
				pointCards.push(c);
			}
			cardArray.splice(cardArray.indexOf(c), 1);
			cardArray.splice(cardArray.indexOf(cardSelected), 1);
			cardSelected = null;
			document.getElementById("discardSelected").style.display = "none";
			
			for(var i = 0; i < idsAndScore.length; i++) {
				if(idsAndScore[i][2] == socketId) {
					idsAndScore[i][1] = pointCards.length;
					idsAndScore[i][3] = pointCards.slice(0);
					break;
				}
			}
			socket.emit('updateScore', idsAndScore, roomToJoin);
			
			drawOnCanvas(cardArray, handCanvas);
			updateTable(idsAndScore);
		//if card clicked is not associated with selected card, deselect the first card
		//and select the new card
		} else {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
			cardSelected = null;
			cardSelected = c;
		}
		
		//change the colour of the selected card to show that it is selected
		if(cardSelected != null) {
			for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = cardSelectColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
		}
	} else { //if clicked on something that isn't a card, deselect the card
		for(var i = 0; i < cardArray.length; i++) {
				if(cardArray[i] == cardSelected) {
					cardArray[i].colour = handCardColour;
					drawOnCanvas(cardArray, handCanvas);
					break;
				}
			}
			document.getElementById("discardSelected").style.display = "none";
			cardSelected = null;
	}
});

document.getElementById("tableCanvas").addEventListener("click", function(e) {
	xyPair = getMousePos(document.getElementById("tableCanvas"), e);
	if(!lookingAtOppCards) {
		c = getTableClickedCard.apply(null, xyPair);
		if(c != undefined & canChooseCard  & cardSelected != null) {
			if(c.relation == cardSelected.relation) {
				for(var i = 0; i < cardArray.length; i++) {
					if(cardArray[i] == cardSelected) {
						cardArray[i].colour = handCardColour;
						break;
					}
				}
				
				insertIndex = 0;
				for(var i = 0; i < pointCards.length; i++) {
					if(pointCards[i] == c) {
						insertIndex = i;
						break;
					}
				}
				
				selectedOrder = cardSelected.order;
				selectedRel = cardSelected.relation;
				if(selectedOrder < pointCards[insertIndex].order) {
					while(selectedOrder < pointCards[insertIndex].order) {
						insertIndex--;
						if(pointCards[insertIndex] == undefined) {
							insertIndex++;
							break;
						} else if(selectedOrder > pointCards[insertIndex].order) {
							insertIndex++;
							break;
						} else if (pointCards[insertIndex].relation != selectedRel) {
							insertIndex++;
							break;
						}
					}
				} else if(selectedOrder > pointCards[insertIndex].order) {
					while(selectedOrder > pointCards[insertIndex].order) {
						insertIndex++;
						if(pointCards[insertIndex] == undefined) {
							break;
						} else if(selectedOrder < pointCards[insertIndex].order) {
							break;
						} else if (pointCards[insertIndex].relation != selectedRel) {
							break;
						}
					}
				}
				
				pointCards.splice(insertIndex, 0, cardSelected);
				cardArray.splice(cardArray.indexOf(cardSelected), 1);
				cardSelected = null;
				document.getElementById("discardSelected").style.display = "none";
				
				for(var i = 0; i < idsAndScore.length; i++) {
					if(idsAndScore[i][2] == socketId) {
						idsAndScore[i][1] = pointCards.length;
						idsAndScore[i][3] = pointCards.slice(0);
						break;
					}
				}
				socket.emit('updateScore', idsAndScore, roomToJoin);
				drawOnCanvas(cardArray, handCanvas);
				updateTable(idsAndScore);
			} else {
				for(var i = 0; i < cardArray.length; i++) {
					if(cardArray[i] == cardSelected) {
						cardArray[i].colour = handCardColour;
						drawOnCanvas(cardArray, handCanvas);
						break;
					}
				}
				cardSelected = null;
				document.getElementById("discardSelected").style.display = "none";
				drawOnCanvas(cardArray, handCanvas);
				window.alert("Card not associated with this group");
			}
		} else if (isTurn) { // if not clicking on a card, and is still client's turn, 
								//check if the user clicked on a name instead
			var name = getTableClickedName.apply(null, xyPair);
			//if the name is valid, ask the server for their pointCards (sends id to server)
			if(name != null & name[0] != playerName) {
				drawOppCards(idsAndScore, name);
			}
		}
		//if you were looking at an opponent's cards, check if clicked on another opponent's cards
	} else {
		var opp = getTableClickedName.apply(null, xyPair);
		console.log(opp);
		//if the name is valid and not yours, draw the opponent cards
		if(opp != undefined) {
			if(opp[0] != playerName) {
				drawOppCards(idsAndScore, opp);
			}
		} else { //if name is not valid (clicked on something that wasn't a name or was your name),
				//show your cards again
			updateTable(idsAndScore);
			lookingAtOppCards = false;
		}
	}
});

document.getElementById("turn").addEventListener("click", function() {
	socket.emit('passTurn', roomToJoin, null);
	document.getElementById("turn").style.display = "none";
	document.getElementById("discardSelected").style.display = "none";
	cardSelected = null;
	isTurn = false;
	canChooseCard = false;
});

document.getElementById("discardSelected").addEventListener("click", function() {
	socket.emit("passTurn", roomToJoin, cardSelected);
	for(var i = 0; i < cardArray.length; i++) {
		if(cardArray[i] == cardSelected) {
			cardArray.splice(i, 1);
			drawOnCanvas(cardArray, handCanvas);
			break;
		}
	}
	document.getElementById("discardSelected").style.display = "none";
	document.getElementById("turn").style.display = "none";
	cardSelected = null;
	isTurn = false;
	canChooseCard = false;
});