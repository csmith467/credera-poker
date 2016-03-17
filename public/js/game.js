$(document).ready(function() {

});

var app = angular.module('crederaApp', []);

app.controller('pokerController', function($scope, $http) {

   // Get game values
   $scope.gameCode = getQuerystring("game");
   $scope.playerId = getQuerystring("player");

   // Connect to websocket
   var socket = io.connect('http://127.0.0.1:8080');

   // Add to websocket room
   socket.emit('create', $scope.gameCode);

   // Listen for player updates
   socket.on('players', function(data) {
      console.log("Got players");
      $scope.players = data;
      $scope.$apply();
      $scope.calculate();
   });

   // Listen for end of game
   socket.on('endgame', function(data) {
      console.log("Ending game.");
      window.location = "index.html?status=end";
   });

   // Listen for reset (Next Round)
   socket.on('reset', function(data) {
      if($("#divPlayedCard").is(":visible")) {
         $("#divPlayedCard").hide();
         $("#divPlayingCards").show();
      } else {
         $("#divTable").hide();
         $("#divPlayingCards").show();
      }
   });

  // Set default card values
  $scope.numbers = [
     { text: "0", value:0},
     { text: "1/2", value:0.5},
     { text: "1", value:1},
     { text: "2", value:2},
     { text: "3", value:3},
     { text: "5", value:5},
     { text: "8", value:8},
     { text: "13", value:13},
     { text: "20", value:20},
     { text: "40", value:40},
     { text: "100", value:100},
     { text: "?", value:"?"},
 ];

 $scope.showTotals = false;
 $scope.showBack = true;

   // Get player info
   $http.get("/getPlayer/" + $scope.playerId).then(function(response) {
      $scope.player = response.data;
   });

   // Get game info
   $http.get("/getGame/" + $scope.gameCode).then(function(response) {
      $scope.game = response.data;
   });

   // Back button
   $scope.back= function() {

      if($("#divPlayedCard").is(":visible")) {
         $("#divPlayedCard").hide();
         $("#divPlayingCards").show();
      } else {
         $("#divTable").hide();
         $("#divPlayingCards").show();
      }

      $scope.player.played = false;
      $scope.player.estimate = "";
      // Update Player Info
      socket.emit('updatePlayerInfo', $scope.player);
   }

// Click function of an Estimate Card
 $scope.selectCard= function(text, number) {

   // Update selected card text
    $scope.card = text;

    // Switch layout
    if($("#divTable").is(":visible")) {
      $("#divPlayingCards").hide();
      $("#divPlayedCard").show();
   } else {
      $("#divPlayingCards").hide();
      $("#divTable").show();
   }

   // Update player info
   $scope.player.played = true;
   $scope.player.estimate = text;
   socket.emit('updatePlayerInfo', $scope.player);
 }

 // Start Next Round
  $scope.nextRound= function() {
     socket.emit('nextRound', { accesscode: $scope.gameCode });
  };

  // End the game
  $scope.endGame= function() {
     var params = { accesscode: $scope.gameCode };
     $http.post("/removeGame", params).then(function(response) {
     });
  };

  // Calculate average estimate
 $scope.calculate= function() {

    var calc = true;
   for (var i = 0; i < $scope.players.length; i++) {
     if ($scope.players[i].played == false) {
        calc = false;
        break;
     }
   }

   if (calc) {
      var total = 0;
      var count = 0;
      for (var i = 0; i < $scope.players.length; i++) {
        if ($scope.players[i].estimate != "?") {
           if ($scope.players[i].estimate == "1/2") {
             total += Number(0.5);
          } else {
            total += Number($scope.players[i].estimate);
          }
           count++;
        }
      }

      var est = total / count;
      if (est % 1 === 0) {
         $scope.estimate = est.toFixed(0);
      } else {
         $scope.estimate = est.toFixed(1);
      }
      $scope.showBack = false;
      $scope.showTotals = true;
   } else {
      $scope.estimate = "--";
      $scope.showBack = true;
      $scope.showTotals = false;
   }

    $scope.$apply();
 }

   $scope.getPlayers = function(code) {
      var params = { accesscode: $scope.gameCode };
      $http.post("/getPlayers", params).then(function(response) {
        $scope.players = response.data;
      });
   };

   $scope.updatePlayer = function(id, estimate) {
      $http.get("/getPlayer/" + id).then(function(response) {
        $scope.player = response.data;
        console.log($scope.player);
        $scope.player.played = true;
        $scope.player.estimate = estimate;
        $http.put("/updatePlayer/" + id, $scope.player).then(function(response) {
           //$scope.getPlayers();
       });
      });
   };

   $scope.getPlayer = function(id) {
      $http.post("/getPlayer/" + id).then(function(response) {
        $scope.player = response.data;
      });
   };

   // Get initial players
   socket.emit('refreshPlayers', {accesscode: $scope.gameCode});

});

// Get Query String function
function getQuerystring(name) {
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regexS = "[\\?&]" + name + "=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if(results == null)
    return "";
  else
    return decodeURIComponent(results[1].replace(/\+/g, " "));
}
