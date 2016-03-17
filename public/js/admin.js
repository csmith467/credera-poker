$(document).ready(function() {


});



var app = angular.module('crederaApp', []);

app.controller('pokerController', function($scope, $http) {

   // Remove Game
   $scope.remove = function(id) {
      $http.post("/adminRemoveGame", { gameId : id }).then(function(response) {
         $scope.refreshGames();
      });
   };

   // Refresh Games
   $scope.refreshGames = function() {
      $http.get("/getGames").then(function(response) {
         $scope.games = response.data;
         // Change layout
         if ($scope.games.length == 0) {
            $("#divNoGames").show();
            $("#divGameTable").hide();
         } else {
            $("#divNoGames").hide();
            $("#divGameTable").show();
         }
      });
   };

   // Get initial games
   $scope.refreshGames();

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
