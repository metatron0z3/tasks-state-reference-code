'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:ProfileSidebarCtrl
 * @description
 * # ProfileSidebarCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'ProfileSidebarCtrl',
    [
      '$scope',
      'Me',
      function (
          $scope,
          Me
      ) {

        var that = this;

        $scope.troopMemberLoaded = false;
        $scope.Me = Me;

        Me.$doneTryingToLoadCurrentTroopMember()
        .then(function() {

          return Me.currentTroopMember.$loaded();
        })
        .then(function() {
          $scope.troopMemberLoaded = true;
        })
        .catch(function(error) {

          console.log(error);
        });

      }
    ]
  );
