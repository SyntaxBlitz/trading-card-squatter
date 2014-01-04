Steam      = require("steam");
fs         = require("fs");
cheerio	   = require("cheerio");

var config = {};

eval(fs.readFileSync('config.js').toString());

// By default, node-steam doesn't do anything with this event. We make use of its event-handling system to extend the available handlers.
Steam.SteamClient.prototype._handlers[Steam.EMsg.ClientItemAnnouncements] = function(data) {
  this.emit('item', data);
}

var cardBot = {
	userName : config.userName,
	passWord : config.passWord,
	sentryFile: config.sentryFile,
	customurl: config.customurl,

	codeFile: "code.txt",

	bot: null,

	webSessionID: null,
	webCookies: null,

	gameArray: [],
	currentGameIndex: null,

	initialise: function() {
		this.bot = new Steam.SteamClient();

		// Register events
		this.bot.on("loggedOn",  	this.loggedOn);
		this.bot.on("sentry",    	this.saveSentry);
		this.bot.on("webSessionID",	this.webSessionIDEvent);
		this.bot.on("item",			this.itemEvent);

		// This bit assumes you have Steam Guard enabled. If you don't, it'll actually work just fine but nag you about Steam Guard anyway. Just ignore it.

		fs.exists(cardBot.sentryFile, function(exists) {		// We have to switch to using `cardBot.` instead of `this.` becaus we're in a callback and `this` gets reassigned.
			if (exists) {
				console.log("Reading sentry hash");
				fs.readFile(cardBot.sentryFile, function(err, buf) {
					if (err) throw err;
					cardBot.bot.logOn(cardBot.userName, cardBot.passWord, buf);
				});
			} else {
				fs.exists(cardBot.codeFile, function(exists) {
					if (exists) {
						console.log("Reading code.txt");
						fs.readFile(cardBot.codeFile, function(err, buf) {
							if (err) throw err;
							cardBot.bot.logOn(cardBot.userName, cardBot.passWord, null, buf.toString());
						});
					} else {
						console.warn("There is no sentry hash saved. Sending email. When you get the code, put it in code.txt and run again. Then delete code.txt.");
						// when you get the code, call logOn with (username, password, null, codeStr) and then let the saveSentry event callback save the file.
						cardBot.bot.logOn(cardBot.userName, cardBot.passWord);
					}
				});
			}
		});
	},

	// EVENT HANDLERS

	loggedOn: function() {
		console.log("Logged on. Steam community ID is " + this.steamID);
		this.setPersonaState(Steam.EPersonaState.Online);
	},

	webSessionIDEvent: function(sessionID) {
		console.log("Got webSession");
		cardBot.webSessionID = sessionID;

		this.webLogOn(function(cookie) {
			cardBot.webCookies = cookie.split(";");

			cardBot.populateGameArray();
		});
	},

	populateGameArray: function() {
		var request = requestObject();

		var badgesUrl = "http://steamcommunity.com/id/" + cardBot.customurl + "/badges/";
		request(badgesUrl, function(error, response, body) {
			if (!error) {
				console.log("Loaded badges page");
				$ = cheerio.load(body);
				$(".badge_title_stats").each(function (index) {
					var cardDropsRemainingText = $(this).children(".progress_info_bold").first().html();
					var match;
					if (cardDropsRemainingText != null && (match = cardDropsRemainingText.match(/(\d+) card drops remaining/i)) != null) {
						var numDrops = parseInt(match[1]);
						var appId = parseInt($(this).children(".badge_title_playgame").children(".btn_small_thin").first().attr("href").substring(12));
						cardBot.gameArray.push({dropsLeft: numDrops, gameID: appId});
					}
				});

				cardBot.currentGameIndex = -1;	// quick hack to go along with the fact that nextGame() increments at the start
				cardBot.nextGame();
			} else {
				console.error("Failed to load badges page");
				process.exit(1);
			}
		});
	},

	saveSentry: function(buf) {
		console.log("Sentry event");
		fs.writeFile(cardBot.sentryFile, buf, function(err) {
			if (err) {
				console.log("Failed to save sentry hash.");
				return;
			}
			console.log("Saved sentry hash.");
		});
	},

	itemEvent: function(buf) {
		if (buf[1] != 0) {			// if the number equals zero, there are no new item announcements: this is probably because the user has accessed his inventory.
			var gameObject = cardBot.gameArray[cardBot.currentGameIndex];
			gameObject.dropsLeft--;
			console.log("\tGot a drop. " + gameObject.dropsLeft + " drops left");	// Yes, it will occasionally say "1 drops left". Deal with it or PR.
			if (gameObject.dropsLeft == 0) {
				cardBot.nextGame();
			}
		}
	},
	
	nextGame: function() {
		cardBot.currentGameIndex++;
		if (cardBot.currentGameIndex == cardBot.gameArray.length) {
			console.log("All done! :D");
			process.exit(0);
		} else {
			console.log("Playing game with id " + cardBot.gameArray[cardBot.currentGameIndex].gameID);
			cardBot.bot.gamesPlayed([cardBot.gameArray[cardBot.currentGameIndex].gameID]);	// can't use `this.` because it's occasionally called from within an event
		}
	},

	// END EVENT HANDLERS
};

var requestObject = function() {
	var request = require("request");
	var j = request.jar();
	request = request.defaults( {jar: j} );
	for(var cookieIndex in cardBot.webCookies) {
		j.add(request.cookie(cardBot.webCookies[cookieIndex]));
	}

	return request;
}

cardBot.initialise();