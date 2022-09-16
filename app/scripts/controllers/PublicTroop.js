/* global Firebase */
/* jshint strict: true */
/* jshint -W014 */


'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:PublicTroopCtrl
 * @description
 * # PublicTroopCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'PublicTroopCtrl',
    [
      '$scope',
      '$state',
      '$stateParams',
      '$localStorage',
      '$q',
      'Me',
      'Nav',
      function (
        $scope,
        $state,
        $stateParams,
        $localStorage,
        $q,
        Me,
        Nav
      ) {

        var that = this;

        $scope.isProcessing = true;
        Me.isLoggingIn = true;

        Me.$doneTryingToLoadBoard()
        .then(function() {

          Me.currentBoard.$loaded();
        })
        .then(function() {
          
          var firstVisibleView = Me.currentBoard.getFirstVisibleView();

          Nav.toBoard(
            Me.currentBoard.viewMap[firstVisibleView],
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            Me.currentBoard.$id
          );
        })



      }
    ]

  );
