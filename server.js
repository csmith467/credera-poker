// Set variables
var express = require('express');
var http = require('http')
var app = express();
var server = http.createServer(app);
var mongojs = require('mongojs');
var dbo = mongojs('mongodb://pokeruser:pokerpass@ds015899.mlab.com:15899/heroku_qlnfhl0c', ['players','games']);
var bodyParser = require('body-parser');
var mongo = require('mongodb').MongoClient,
   client = require('socket.io').listen(app).sockets;

// Connect to database
mongo.connect('mongodb://pokeruser:pokerpass@ds015899.mlab.com:15899/heroku_qlnfhl0c', function(err, db) {
   if (err) throw err;
   console.log('Connected to the database.');
   // Connect to websocket
   client.on('connection', function(socket) {
      // Log when someone has connected.
      console.log('A client has connected.');

      // Define collection
      var col = db.collection('players');

      // Function to send players back to the clients
      var sendPlayers = function(code) {
         console.log('sending players');
         col.find({ "accesscode": code }).toArray(function(err, res) {
            console.log(res);
            client.in(code).emit('players', res);
         });
      }

      // Create room
      socket.on('create', function(room) {
         console.log("Creating room.");
         socket.join(room);
      });

      socket.on('refreshPlayers', function(data) {
         sendPlayers(data.accesscode);
      });

      socket.on('updatePlayerInfo', function(data) {
         console.log("Updating player.")
         dbo.players.update({_id: mongojs.ObjectId(data._id)},
            {$set: { played: data.played, estimate: data.estimate}},
            function(err, doc) {
               console.log("Player updated successfully");
               sendPlayers(data.accesscode);
            });
      });

      socket.on('nextRound', function(data) {
         console.log("Resetting players.")
         dbo.players.update({accesscode: data.accesscode},
            {$set: { played: false, estimate: ""}},
            { multi: true },
            function(err, doc) {
               console.log("Players reset successfully");
               sendPlayers(data.accesscode);
               client.in(data.accesscode).emit('reset');
            });
      });

   });

});

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Get all players
app.post('/getPlayers', function(req, res) {
   console.log("Getting players.")
   dbo.players.find( { "accesscode": req.body.accesscode }, function(err, doc) {
      //console.log(doc);
      res.json(doc);
   });
});

// Remove Game
app.post('/removeGame', function(req, res) {
   console.log("Removing players.")
   dbo.players.remove( { "accesscode": req.body.accesscode }, function(err, doc) {
      console.log("Players removed.")
   });

   dbo.games.remove( { "accesscode": req.body.accesscode }, function(err, doc) {
      console.log("Game removed.")
   });

   client.in(req.body.accesscode).emit('endgame');
});

// Get game by access code
app.post('/getGame/:accesscode', function(req, res) {
   var accesscode = req.params.accesscode;
   console.log(accesscode);

   console.log("About to get game.");
   dbo.games.find( { "accesscode": accesscode }, function(err, doc) {
      res.json(doc);
   });
});

// Create New Game
app.post('/createGame', function(req, res) {
   console.log("Creating a new game.");
   dbo.games.insert(req.body, function(err, doc) {
      res.json(doc);
   });
});

// Create New Player
app.post('/createPlayer', function(req, res) {
   console.log("Creating a new player.");
   dbo.players.insert(req.body, function(err, doc) {
      res.json(doc);
   });
});

// Remove Player
app.delete('/removePlayer/:id', function(req, res) {
   console.log("Removing player.");
   var id = req.params.id;

   dbo.players.delete({_id: mongojs.ObjectId(id)}, function(err, doc) {
      res.json(doc);
   });
});

// Get Player
app.get('/getPlayer/:id', function(req, res) {
   console.log("Getting player details.");
   var id = req.params.id;
   dbo.players.findOne({_id: mongojs.ObjectId(id)}, function(err, doc) {
      res.json(doc);
      console.log(doc);
   });
});

// Get Player
app.get('/getGame/:code', function(req, res) {
   console.log("Getting game details.");
   var code = req.params.code;
   dbo.games.findOne({accesscode: code}, function(err, doc) {
      res.json(doc);
      console.log(doc);
   });
});

// Update Player
app.put('/updatePlayer/:id', function(req, res) {
   console.log("Updating player.");
   var id = req.params.id;
   console.log(id);
   console.log(req.body);
   dbo.players.findAndModify({
      query: {_id: mongojs.ObjectId(id)},
      update: {$set: { played: req.body.played, estimate: req.body.estimate}},
      new: true },
      function(err, doc) {
         res.json(doc);
      });
});

// Get Games
app.get('/getGames', function(req, res) {
   console.log("Getting games.");
   dbo.games.find({}, function(err, doc) {
      res.json(doc);
      console.log(doc);
   });
});

// Remove Game
app.post('/adminRemoveGame', function(req, res) {
   console.log("Removing Game.");
   console.log(req.body.gameId)

   dbo.players.remove( {_id: mongojs.ObjectId(req.body.gameId)}, function(err, doc) {
      console.log("Players removed.")
   });

   dbo.games.remove( {_id: mongojs.ObjectId(req.body.gameId)}, function(err, doc) {
      console.log("Game removed.")
   });

   res.json();
});

var port = Number(process.env.PORT || 3000);

server.listen(port);
console.log("Server running on port " + port);
