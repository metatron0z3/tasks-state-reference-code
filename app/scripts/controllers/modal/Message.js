'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:MessageModalCtrl
 * @description
 * # MessageModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'MessageModalCtrl',
    [
      '$scope',
      '$timeout',
      'close',
      function (
        $scope,
        $timeout,
        close
      ) {

        var that = this;

        $scope.err = null;
        $scope.message = '';
        $scope.showModal = true;


        $scope.accept = function() {
          // default initialization, should set function in .then() after .showModal()
        }

        $scope.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };
      }
    ]
  );
