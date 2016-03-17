$(document).ready(function() {
   $(".form-control").keyup(function() {
		if ($(this).val() != "") {
			$("#divJoinAlert").hide();
		}
	});

   var status = getQuerystring("status");
   if (status == "end") {
      $("#divHomeButtons").hide();
      $("#divStartGame").hide();
      $("#divJoinGame").hide();
      $("#divEndGame").show();
   }

   //Initiat WOW JS
   new WOW().init();

});


var app = angular.module('crederaApp', []);

app.controller('pokerController', function($scope, $http) {

   $scope.start= function() {
      $("#divHomeButtons").hide();
      $("#divJoinGame").hide();
      $("#divEndGame").hide();
      $("#divStartGame").show();
   };

   $scope.join= function() {
      $("#divHomeButtons").hide();
      $("#divStartGame").hide();
      $("#divEndGame").hide();
      $("#divJoinGame").show();
   };

   $scope.startGame = function() {

      // Check Game Name
      if ($("#textNewGameName").val() == "") {
         $("#divJoinAlert").text("Please enter a name for the game.")
         $("#divJoinAlert").show();
         $("#textNewGameName").focus();
         return;
      }

      // Check Player Name
      if ($("#textNewPlayer").val() == "") {
         $("#divJoinAlert").text("Please enter your name.")
         $("#divJoinAlert").show();
         $("#textNewPlayer").focus();
         return;
      }

      // Check Access Code
      if ($("#textNewAccessCode").val() == "") {
         $("#divJoinAlert").text("Please enter an access code.")
         $("#divJoinAlert").show();
         $("#textNewAccessCode").focus();
         return;
      }

      // Check if game exists
      $http.post("/getGame/" + $scope.newGame.accesscode).then(function(response) {
         if (response.data == "") {
            // Insert the the game into the database
            $scope.createGame();
         } else {
            // Display error if game exists
            $("#divJoinAlert").text("A game with this access code already exists.  Please choose another code.")
            $("#divJoinAlert").show();
            // Clear access code field and set focus
            $scope.newGame.accesscode = "";
            $("#textNewAccessCode").focus();
         }
      }, function(response) {
         // Error
      });

   };

   // Add game to database
   $scope.createGame = function() {
      $http.post("/createGame", $scope.newGame).then(function(response) {
         $scope.createPlayer($scope.newGame.accesscode);
      });
   };

   // Add player to database
   $scope.createPlayer = function(gameCode) {
      $scope.newPlayer.accesscode = gameCode;
      $scope.newPlayer.played = false;
      $scope.newPlayer.estimate = "";
      $scope.newPlayer.admin = true;
      $http.post("/createPlayer", $scope.newPlayer).then(function(response) {
         // Go to game page
         window.location.href = "game.html?game=" + gameCode + "&player=" + response.data._id;
      });
   };

   // Join an existing game
   $scope.joinGame = function() {
      // Check Name
      if ($("#textJoinName").val() == "") {
         $("#divJoinAlert").text("Please enter your name.")
         $("#divJoinAlert").show();
         $("#textJoinName").focus();
         return;
      }

      // Check Access Code
      if ($("#textJoinAccessCode").val() == "") {
         $("#divJoinAlert").text("Please enter an access code.")
         $("#divJoinAlert").show();
         $("#textJoinAccessCode").focus();
         return;
      }

      // Check to see if game exists
      $http.post("/getGame/" + $scope.joinExistingGame.accesscode).then(function(response) {
         if (response.data == "") {
            // Show error message
            $("#divJoinAlert").text("This game does not exist.  Please enter another access code.")
            $("#divJoinAlert").show();
            // Clear access code field and set focus
            $scope.joinExistingGame.accesscode = "";
            $("#textJoinAccessCode").focus();
         } else {
            $scope.joinPlayer($scope.joinExistingGame.accesscode);
         }
      }, function(response) {

      });
   };

   // Add player to database and associate with game
   $scope.joinPlayer = function(gameCode) {
      $scope.joinNewPlayer.accesscode = gameCode;
      $scope.joinNewPlayer.played = false;
      $scope.joinNewPlayer.estimate = "";
      $scope.joinNewPlayer.admin = false;
      $http.post("/createPlayer", $scope.joinNewPlayer).then(function(response) {
         window.location.href = "game.html?game=" + gameCode + "&player=" + response.data._id;
      });
   };

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
