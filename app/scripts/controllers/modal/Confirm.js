'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:ConfirmModalCtrl
 * @description
 * # ConfirmModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'ConfirmModalCtrl',
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


        $scope.cancel = function() {
          // default initialization, should set function in .then() after .showModal()
        };

        $scope.accept = function() {
          // default initialization, should set function in .then() after .showModal()
        }

        $scope.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };

        $scope.$on('onEscapeKey', function(event) {
          $scope.close();
        })
      }
    ]
  );
