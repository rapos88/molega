document.getElementById("readyButton").addEventListener("click", function() {
	if(document.getElementById("name").value != "") {
		playerName = document.getElementById("name").value;
		socket.emit('playerReady', playerName, roomToJoin);
	}
});

document.getElementById("goButton").addEventListener("click", function() {
	socket.emit('startGame', roomToJoin);
});

document.getElementById("quitButton").addEventListener("click", function() {
	socket.emit('quitTheRoom', roomToJoin);
	document.getElementById("quitButton").style.display = "none";
});

document.getElementById("getCard").addEventListener("click", function(){
	if(canChooseCard) {
		socket.emit('requestedCard', 1, roomToJoin);
	}
});
	

document.title = "Dr. " + professorLastName + "'s " + typeOfGame;
document.getElementById("titleHeader").innerHTML = "Dr. " + professorLastName + "'s " + typeOfGame;