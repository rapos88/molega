function generateGame(xml) {
	// Make the Game using the Model
	var gameFiles = new JSZip();
	var cardsFolder = gameFiles.folder('cardFiles');
        var styleFolder = gameFiles.folder('css');
        var scriptFolder = gameFiles.folder('js');

	getFileContents(scriptFolder, "socketClient.js", "../both_games/js/socketClient.js");
	getFileContents(scriptFolder, "client.js", "../both_games/js/client.js");
	getFileContents(scriptFolder, "pageActions.js", "../both_games/js/pageActions.js");

	//if there's no model in the editor (or an invalid model), don't generate a game
	var xmlDoc = $.parseXML( xml );
        var $xml = $( xmlDoc );
        var $classes = $xml.find("Classes").find("Class");
	if($classes.length == 0 | $("#conformIcon").css("background-color") != 'rgb(92, 184, 92)') {
		throw new Error('A valid model must be created first in order to generate website code for a game');
	} else {
		getActiveClasses(gameFiles, cardsFolder, styleFolder, scriptFolder, xml);	
	}
}

function getFileContents(folder, name, filePath) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", filePath, false);
    rawFile.onreadystatechange = function ()
    {
        if(rawFile.readyState === 4)
        {
            if(rawFile.status === 200 || rawFile.status == 0)
            {
                var allText = rawFile.responseText;
		folder.file(name, allText);
            }
        }
    }
    rawFile.send(null);
}

function getActiveClasses(gameFiles, cardsFolder, styleFolder, scriptFolder, xhr) {
	var connectedClasses = [];
        var xmlDoc = $.parseXML( xhr );
        var $xml = $( xmlDoc );
        var $classes = $xml.find("Classes").find("Class");
        var $relations = $xml.find("Relations").find("Relation");

        //for each relation established, add class id to an array
        for(var i = 0; i < $relations.length; i++) {
        	var connId = $relations[i].getAttribute("destination");
                var destId = $relations[i].getAttribute("source");
                if(!connectedClasses.includes(connId)) {
                	connectedClasses.push(connId);
                }
                if(!connectedClasses.includes(destId)) {
                	connectedClasses.push(destId);
                }
        }

        //using the class array, only use the classes connected properly
	//and get the file content started
	var style = "#waitText,#judgeText,#handHeader {\n\tdisplay:none;\n}\n#nameInUseText,#sorryText,#sorryProgressText,#sorryGameInterruptText,#forceEndText {\n\tcolor:red;\n\tdisplay:none;\n}\nbutton {\n\tdisplay:none;\n}\nh1 {\n\ttext-align:center;\n}\ntable {\n\tdisplay:block;\n\tmargin-bottom:1.3em;\n}\ntd {\n\tborder:1px solid black;\n\twidth:150px;\n\theight:50px;\n\tvertical-align:center;\n\ttext-align:center;\n}\n#handCanvas {\n\tborder:1px solid #d3d3d3;\n\tbackground-color:#f1f1f1;\n\tvisibility:hidden;\n\twidth:100%;\n}\n";
	var constants = "// A good card width-height ratio is 8:11 in my opinion\nvar cardWidth = 110;\nvar cardHeight = 150;\nvar spaceBetweenCards = 20;\nvar cardFontSize = 20;\nvar tableFontSize = 25;\nvar cardSelectColour = questionCardColour;\n";
	var app = "// =================================================Set constant variables for server use\nconst portNum = 3000; // Note: this must be unique on the server this app is hosted on\n";
	var gameName = "";
	var hasTheme = false;
        for(var i = 0; i < $classes.length; i++) {
        	var id = $classes[i].getAttribute("id");
                if(connectedClasses.includes(id)) {
                	var name = $classes[i].getAttribute("name");
			if(name == "CommunityJudgeGame") {
                                constants += "var typeOfGame = \"Community Judge Game\";\n";
                        } else if(name == "RelationsGame") {
                                constants += "var typeOfGame = \"Relations Game\";\n";
                        }
                        var $curClass = $($classes[i]);

                        var $attrs = $curClass.find("Attribute");
                        for(var j = 0; j < $attrs.length; j++) {
				let n = $attrs[j].getAttribute("name");
				let v = $attrs[j].getAttribute("value");

				//if it's a file, add it to the app file
				if(n == "fileName") {
					app += "var "+name.slice(0,1).toLowerCase()+name.slice(1)+" = \""+v+"\";\n";
				}

				//parse the game class
				if(name == "CommunityJudgeGame" | name == "RelationsGame") {
					if(n == "professorLastName") {
						constants += "var "+n+" = \""+v+"\";\n";
						gameName = v;
					} else if (n == "numOfStartingHandCards") {
						constants += "var numOfCardsInHand = "+v+";\n";
					} else {
						if(n.includes("Players")) {
							n = n.slice(0,n.indexOf("Num"))+n.slice(n.indexOf("Players"));
						} else if(n.includes("Discard")) {
							n = "useDiscard";
							v = v.toLowerCase();
						} else {
							n = "maxN"+n.slice(1);
						}
						app += "const "+n+" = "+v+";\n";
					}
				} //=======================end Game

				//parse the win condition
				if(name == "winByRounds") {
					constants += "var winByRounds = true;\n";
					constants += "var numOfRounds = "+v+";\n";
				} else if(name == "winByScore") {
					constants += "var winByRounds = false;\n";
					constants += "var scoreToWin = "+v+";\n";
				} //=======================end Win Condition

				//if there's a theme, add it to the proper places
				if(name.includes("Theme")) {
					hasTheme=true;
					if(n == "tableColor") {
						style += "#tableCanvas {\n\tborder:1px solid #d3d3d3;\n\tbackground-color:"+v+";\n\tdisplay:block;\n\twidth:100%;\n}\n";
					} else if(n == "colorTheme") {
						style += "td:hover {\n\tbackground-color:"+v+";\n\tcolor:white;\n}\ntd:click {\n\tbackground-color:"+v+";\n\tcolor:white;\n}\n";
						constants += "var roomTableSelectColour = \""+v+"\";\n";
					} else {
						if(n.includes("Color")) {
							n = n.slice(0, n.indexOf("Color"))+"Colour";
							if(n.includes("Font")) {
								if(n.includes("question")) {
									n = "question"+n.slice(n.indexOf("Font"));
								} else {
									n = "f"+n.slice(n.indexOf("ont"));
								}
							}

							constants += "var "+n+" = \""+v+"\";\n";
						} else {
							constants += "var "+n+" = \""+v+"\";\n";
						}
					}
				} //====================end Theme
                        }
                }
        }
	//if theme has not been specified, apply a soft default
	if(!hasTheme) {
        	style += "td:hover {\n\tbackground-color:blue;\n\tcolor:white;\n}\ntd:click {\n\tbackground-color:blue;\n\tcolor:white;\n}\n#tableCanvas {\n\tborder:1px solid #d3d3d3;\n\tbackground-color:#C4D9FE;\n\tdisplay:block;\n\twidth:100%;\n}\n";
                constants += "var roomTableSelectColour = \"BLUE\";\nvar handCardColour = \"WHITE\";\nvar fontType = \"Arial\";\nvar questionCardColour = \"BLACK\";\nvar fontColour = \"BLACK\";\nvar questionFontColour = \"WHITE\";\n";
        }
	app += "\n\n";

	generateGameFiles(gameFiles, cardsFolder, styleFolder, scriptFolder, gameName, app, constants, style);
}

function generateGameFiles(gameFiles, cardsFolder, styleFolder, scriptFolder, name, app, constants, style) {
	var packageJson = "{\n\t\"name\": \""+name+"-card-game\",\n\t\"version\": \"0.0.1\",\n\t\"description\": \"Card Game for Professor "+name+"\",\n\t\"dependencies\": {\n\t\t\"csv-parser\": \"^2.3.3\",\n\t\t\"express\": \"^4.15.2\",\n\t\t\"socket.io\": \"^2.3.0\"\n\t},\n\t\"main\": \"app.js\",\n\t\"scripts\": {\n\t\t\"test\": \"echo \\\"Error: no test specified\\\" && exit 1\"\n\t},\n\t\"author\": \"kBorror\",\n\t\"license\": \"ISC\"\n}";
	var readme = "Thanks for generating and downloading ";
	gameFiles.file("package.json", packageJson);
	if(constants.includes("Community Judge")) {
		//use the community judge template
		filePath = "../both_games/commJudgeApp.js";
		indexPath = "../both_games/judgeIndex.html";
		scriptPath = "../both_games/js/commJudge.js";
		qCardPath = "../both_games/cardFiles/questions.csv";
		aCardPath = "../both_games/cardFiles/answers.csv";
		readme += name + "'s Community Judge Game!\n\nImportant information:\nThe app.js file is the backend server which controls most game functions. All other\nfiles are intended for use from the client perspective (index.html).\n\nIncluded with this game in the cardFiles directory are example csv files that contain card\ninformation. For the Community Judge game, each card is its own row. In order\nfor the game to work properly, any card information should be placed one per row in column 1, as\nseen in the example card file. The labels \"Questions\" and \"Answers\" MUST stay at the top of each\ncard file column.\n\n";
	} else {
		//use the relations template
		filePath = "../both_games/relationsApp.js";
		indexPath = "../both_games/relationsIndex.html";
		scriptPath = "../both_games/js/relations.js";
		deckPath = "../both_games/cardFiles/deck.csv";
		readme += name + "'s Relations Game!\n\nImportant information:\nThe app.js file is the backend server which controls most game functions. All other\nfiles are intended for use from the client perspective (index.html).\n\nIncluded with this game in the cardFiles directory are example csv files that contain card\ninformation. For the Relations game, rows are sets of related cards. Each row must have at least\ntwo cells of card information.\n\n";
	}
	readme += " Do not change the name of any files in the cardFiles directory.\nContents may be changed so long as they follow the above rules.\n\nTo Host on a Server:\nLink to instructions - https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-14-04\nNote: Above instructions should only include \"Install Node.js\" (be sure to install version 12.18.2), \"Install PM2\", and \n\"Manage Application with PM2\" (using app.js instead of hello.js). If running app.js results in missing package\nerrors, run the command \"npm install\"\n\nThis set of game files uses Node.js version 12.18.2\npackage.json is a file that contains all dependency packages required to run this\ngame. Use npm install before launching the node app to ensure that everything runs as intended.";
	gameFiles.file("readMe.txt", readme);

	//Add the server app.js file
	var rawFile = new XMLHttpRequest();
	rawFile.open("GET", filePath, false);
	rawFile.onreadystatechange = function ()
	{
		if(rawFile.readyState === 4) {
			if(rawFile.status === 200 || rawFile.status == 0) {	
				var allText = rawFile.responseText;
				allText = app + allText;
				gameFiles.file("app.js", allText);
			}
		}

		//add the index.html file
		var indexFile = new XMLHttpRequest();
		indexFile.open("GET", indexPath, false);
		indexFile.onreadystatechange = function ()
		{
			if(indexFile.readyState === 4) {
				if(indexFile.status === 200 || indexFile.status == 0) {
					var indexText = indexFile.responseText;
					gameFiles.file("index.html", indexText);
				}
			}

			//add the script file for the specific game
			var scriptFile = new XMLHttpRequest();
                	scriptFile.open("GET", scriptPath, false);
                	scriptFile.onreadystatechange = function ()
                	{
                        	if(scriptFile.readyState === 4) {
                                	if(scriptFile.status === 200 || scriptFile.status == 0) {
                                        	var scriptText = scriptFile.responseText;
                                        	scriptFolder.file(scriptPath.substring(scriptPath.indexOf("/js/")+4), scriptText);
                                	}
                        	}

				//add the card file(s)
				if(filePath.includes("commJudge")) {
					var qFile = new XMLHttpRequest();
                        		qFile.open("GET", qCardPath, false);
                        		qFile.onreadystatechange = function ()
                        		{
                                		if(qFile.readyState === 4) {
                                        		if(qFile.status === 200 || qFile.status == 0) {
                                                		var qText = qFile.responseText;
								qName = app.substring(app.indexOf("questions")+17);
								qName = qName.substring(0, qName.indexOf("\""));
                                                		cardsFolder.file(qName, qText);
                                        		}
                                		}

						var aFile = new XMLHttpRequest();
                                        	aFile.open("GET", aCardPath, false);
                                        	aFile.onreadystatechange = function ()
                                        	{
                                                	if(aFile.readyState === 4) {
                                                        	if(aFile.status === 200 || aFile.status == 0) {
                                                                	var aText = aFile.responseText;
									aName = app.substring(app.indexOf("answers")+15);
									aName = aName.substring(0, aName.indexOf("\""));
                                                                	cardsFolder.file(aName, aText);
                                                        	}
                                                	}

							//add scripts to the script folder
                                                	scriptFolder.file('constants.js', constants);

                                                	//add style to the style folder
                                                	styleFolder.file('style.css', style);

                                                	gameFiles.generateAsync({type:"blob"})
                                                	  .then(function(content) {
                                                        	  saveAs(content, name + "_game.zip");
                                                  	});

							//=== End of Comm Judge Game

	                                        }

	                                        aFile.send(null);

                        		}

                        		qFile.send(null);

				} else if (filePath.includes("relations")) {
					var deckFile = new XMLHttpRequest();
                        		deckFile.open("GET", deckPath, false);
                        		deckFile.onreadystatechange = function ()
                        		{
                                		if(deckFile.readyState === 4) {
                                        		if(deckFile.status === 200 || deckFile.status == 0) {
                                                		var deckText = deckFile.responseText;
								deckName = app.substring(app.indexOf("generalDeck")+15);
								deckName = deckName.substring(0, deckName.indexOf("\""));
                                                		cardsFolder.file(deckName, deckText);
                                        		}
                                		}

						//add scripts to the script folder
                        			scriptFolder.file('constants.js', constants);

                        			//add style to the style folder
                        			styleFolder.file('style.css', style);

						gameFiles.generateAsync({type:"blob"})
						  .then(function(content) {
							  saveAs(content, name + "_game.zip");
						  });

						//=== End of Relations Game

                        		}

		                	deckFile.send(null);

				}

			}

			scriptFile.send(null);

		}

		indexFile.send(null);

	}

	rawFile.send(null);
}
