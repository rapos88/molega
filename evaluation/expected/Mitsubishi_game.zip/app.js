// =================================================Set constant variables for server use
const portNum = 3000; // Note: this must be unique on the server this app is hosted on
const maxNumOfRooms = 8;
const maxPlayers = 7;
const minPlayers = 3;
var questionsDeck = "q.csv";
var answersDeck = "newA.csv";


var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const csv = require('csv-parser');
const fs = require('fs');


// these hold unaltered arrays of the csv read-in
var constQCards = [];
var constACards = [];

// =====================================Declare (dynamic) global variables for server use
var usersInRooms = [];

var users = [];
var idsAndScore = [];

var questionsCardContent = [];
var discardedQuestionCards = [];
var answersCardContent = [];
var discardedAnswerCards = [];

var gameInProgress = []; //check if game is currently in progress for joining player

var currentTurn = [];//set to 1 to start for each room
var turn = []; //set to 0 to start for each room

var playersReady = [];

// ===============================Initialize all previous variables for room usage
for(var i = 0; i < maxNumOfRooms; i++) {
	usersInRooms.push([]);
	users.push([]);
	idsAndScore.push([]);
	
	questionsCardContent.push([]);
	discardedQuestionCards.push([]);
	answersCardContent.push([]);
	discardedAnswerCards.push([]);

	gameInProgress.push(false);
	currentTurn.push(1);
	turn.push(0);
	playersReady.push(0);
}

// ================================================================Parse CSV files
fs.createReadStream('cardFiles/'+questionsDeck)
  .pipe(csv())
  .on('data', (data) => {
	  constQCards.push(data["Questions"]);
	  for(var i = 0; i < maxNumOfRooms; i++) {
		questionsCardContent[i].push(data["Questions"]);
	  }
})
  .on('end', () => {
	  fs.close(0, (err) => { if(err) {console.error('Failed to close file', err);} });
});
fs.createReadStream('cardFiles/'+answersDeck)
  .pipe(csv())
  .on('data', (data) => {
	  constACards.push(data["Answers"]);
	  for(var i = 0; i < maxNumOfRooms; i++) {
		answersCardContent[i].push(data["Answers"]);
	  }
})
  .on('end', () => {
	  fs.close(1, (err) => { if(err) {console.error('Failed to close file', err);} });
});


// =================Get index file and other required external javascript/css function files
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});
app.get('/js/client.js', (req, res) => {
	res.sendFile(__dirname + '/js/client.js');
});
app.get('/js/socketClient.js', (req, res) => {
	res.sendFile(__dirname + '/js/socketClient.js');
});
app.get('/js/pageActions.js', (req, res) => {
	res.sendFile(__dirname + '/js/pageActions.js');
});
app.get('/js/constants.js', (req, res) => {
	res.sendFile(__dirname + '/js/constants.js');
});
app.get('/css/style.css', (req, res) => {
	res.sendFile(__dirname + '/css/style.css');
});
app.get('/js/commJudge.js', (req, res) => {
	res.sendFile(__dirname + '/js/commJudge.js');
});


// ========================================================Handle the server-side connections
io.on('connection', (socket) => {
	socket.emit('idSent', socket.id);
	socket.emit('availableRooms', usersInRooms, maxPlayers);
	
		// when a client disconnects from the server
		socket.on('disconnect', () => {
			for(var i = 0; i < maxNumOfRooms; i++) {
				// if the disconnected user was already connected to a room
				if(usersInRooms[i].indexOf(socket.id) != -1) {
					usersInRooms[i].splice(usersInRooms[i].indexOf(socket.id), 1);
					io.sockets.emit('updateAvailableRooms', usersInRooms, i, maxPlayers);
					users[i].splice(users[i].indexOf(socket), 1);
					for(var j = 0; j < idsAndScore.length; j++) {
						if(idsAndScore[i][j][2] == socket.id) {
							playersReady[i]--;
							idsAndScore[i].splice(j, 1);
							break;
						}
					}
					if(!gameInProgress[i]) {
						io.sockets.in("room"+i).emit('updateTableUsers', idsAndScore[i]);
					}
					
					// end game if enough players disconnect
					if(usersInRooms[i].length < minPlayers) {
						if(gameInProgress[i]) {
							//if game is already started, disconnect all players
							gameInProgress[i] = false;
							io.sockets.in("room"+i).emit('callForRestart');
							for(var j = 0; j < users[i].length; j++) {
								users[i][j].disconnect(true);
							}
							
							//clean up the room for the next game
							usersInRooms[i] = [];
							users[i] = [];
							idsAndScore[i] = [];
							questionsCardContent[i] = []
							questionsCardContent[i] = constQCards.slice(0);
							discardedQuestionCards[i] = [];
							answersCardContent[i] = constACards.slice(0);
							discardedAnswerCards[i] = [];
							currentTurn[i] = 1;
							turn[i] = 0;
							playersReady[i] = 0;

						} else {
							//hide click when everyone is ready button
							io.sockets.in("room"+i).emit('hideGoButton');
						}
					}
				}		
			}
			console.log(socket.id + ' user disconnected');
		});
		
		socket.on('playerReady', (name, roomToJoin) => {
			console.log(name + " wants to join room " + roomToJoin);
			var unique = true;
			for(var i = 0; i < idsAndScore[roomToJoin].length; i++) {
				if(name == idsAndScore[roomToJoin][i][0]) {
					unique = false;
				}
			}
			
			if(unique) {
			//check if game is in progress or not
			if(gameInProgress[roomToJoin]) {
				socket.emit('gameInProgress', true);
			} else if(users[roomToJoin].length < maxPlayers) {
				socket.emit('gameInProgress', false);
				console.log('a user connected');
				socket.join("room"+roomToJoin);
				users[roomToJoin].push(socket);
				usersInRooms[roomToJoin].push(socket.id);
				idsAndScore[roomToJoin].push([name, 0, socket.id]);
				playersReady[roomToJoin]++;
				io.sockets.in("room"+roomToJoin).emit('updateTableUsers', idsAndScore[roomToJoin]);
				if(playersReady[roomToJoin] >= minPlayers & playersReady[roomToJoin] <= maxPlayers) {
					// send a 'check for ready to go' to allow more than min players to join
					io.sockets.in("room"+roomToJoin).emit('revealGoButton');
				}
			} else {
				socket.emit('maxPlayersReached');
			}
			
			io.sockets.emit('updateAvailableRooms', usersInRooms, roomToJoin, maxPlayers);
			} else {
				socket.emit('nameNotUnique');
			}
			
		});
		
		socket.on('startGame', (roomNum) => {
			gameInProgress[roomNum] = true;
			io.sockets.in("room"+roomNum).emit('allPlayersReady');
				
			var qCard = questionsCardContent[roomNum][Math.floor(Math.random() * questionsCardContent[roomNum].length)];
			questionsCardContent[roomNum].splice(questionsCardContent[roomNum].indexOf(qCard), 1);
			discardedQuestionCards[roomNum].push(qCard);
			io.sockets.in("room"+roomNum).emit('displayQuestionCard', idsAndScore[roomNum], qCard);
				
			users[roomNum][0].emit('yourTurn');
		});
	
		// when a client sends a card to the server, put it on the table
		socket.on('sentCard', (card, roomNum) => {
			console.log("Recieved card from " + socket.id);
			//console.log(card);
			io.sockets.in("room"+roomNum).emit('addCardToTable', card.content, socket.id, users[roomNum].length);
			
			//give player another card after they sent one in
			socket.emit('sentCardSuccess');
		});
	
		// When a client wants cards for their hand, send them the content and relationNum
		socket.on('requestedCard', (numOfCards, roomNum) => {
				// if all cards have been used, end the game
				if(answersCardContent[roomNum].length <= 0) {
					io.sockets.in("room"+roomNum).emit('chooseWinner', idsAndScore[roomNum]);
				}
				var cards = [];
				for(var i = 0; i < numOfCards; i++) {
					var aCard = (answersCardContent[roomNum][Math.floor(Math.random() * answersCardContent[roomNum].length)]);
					answersCardContent[roomNum].splice(answersCardContent[roomNum].indexOf(aCard), 1);
					cards.push(aCard);
					//console.log(socket.id + " wants a card");
				}
				socket.emit('requestedCard', cards);
			//console.log("Gave them a Card");
		});
		
		// When the choosing player sends their winning choice
		socket.on('winChoice', (card, roomNum) => {
			console.log(card.content + " by " + card.owner + " in room " + roomNum + " won that round");
			for(var i = 0; i < idsAndScore[roomNum].length; i++) {
				if(idsAndScore[roomNum][i][2] == card.owner) {
					idsAndScore[roomNum][i][1] += 1;
					break;
				}
			}
			io.sockets.in("room"+roomNum).emit('clearTable', idsAndScore[roomNum]);
		});
		
		// When a player has won the game (through rounds or score)
		socket.on('playerHasWon', (winner, roomNum) => {
			console.log("Game Winner in room " + roomNum + " is " + winner);
			// note - winner is the socket.id of the winner. It is set this way
			// just in case there are two people with the same nickname
			
			io.sockets.in("room"+roomNum).emit('endGame', idsAndScore[roomNum], winner);
		});
		
		socket.on('quitTheRoom', (roomNum) => {
			gameInProgress[roomNum] = false;
			io.sockets.in("room"+roomNum).emit('returnToMenu');
			for(var i = 0; i < users[roomNum].length; i++) {
				users[roomNum][i].leave("room"+roomNum);
			}
			
			//clean up the room for the next game
			usersInRooms[roomNum] = [];
			users[roomNum] = [];
			idsAndScore[roomNum] = [];
			questionsCardContent[roomNum] = constQCards.slice(0);
			discardedQuestionCards[roomNum] = [];
			answersCardContent[roomNum] = constACards.slice(0);
			discardedAnswerCards[roomNum] = [];
			currentTurn[roomNum] = 1;
			turn[roomNum] = 0;
			playersReady[roomNum] = 0;
			
			io.sockets.emit('updateAvailableRooms', usersInRooms, roomNum, maxPlayers);
		});
	
		// Begin the next turn by passing it to the next player in the array
		socket.on('passTurn', (roomNum) => {
			if(users[roomNum][turn[roomNum]] == socket) {
				//send the turn booleans to the next socket and keep track of the turn changing
				users[roomNum][(turn[roomNum]+1)%users[roomNum].length].emit('yourTurn');
				turn[roomNum] = currentTurn[roomNum]++ % users[roomNum].length;
				if(turn[roomNum] == 0) {
					io.sockets.in("room"+roomNum).emit('checkWinner', idsAndScore[roomNum]);
				}
				console.log("next turn triggered");
				
				var qCard = questionsCardContent[roomNum][Math.floor(Math.random() * questionsCardContent[roomNum].length)];
				questionsCardContent[roomNum].splice(questionsCardContent[roomNum].indexOf(qCard), 1);
				discardedQuestionCards[roomNum].push(qCard);
				io.sockets.in("room"+roomNum).emit('displayQuestionCard', idsAndScore[roomNum], qCard);
				
				if(questionsCardContent[roomNum].length <= 0) {
					io.sockets.in("room"+roomNum).emit('chooseWinner', idsAndScore[roomNum]);
				}
			}
		});
	
});

http.listen(portNum, () => {
	console.log('listening on *:'+portNum);
});
