'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:HomeHeaderCtrl
 * @description
 * # HomeHeaderCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
    .controller(
    'HomeHeaderCtrl',
    [
      '$scope',
      '$rootScope',
      '$localStorage',
      '$timeout',
      'Me',
      'Ref',
      'ModalService',
      'UAParser',
      function (
        $scope,
        $rootScope,
        $localStorage,
        $timeout,
        Me,
        Ref,
        ModalService,
        UAParser
      ) {

        var that = this;

        $scope.Me = Me;
        $scope.err = null;
        $scope.storage = $localStorage;
        $scope.showModal = true;
        $scope.labels = {};
        $scope.showLogin = false;


        $scope.link = {'url': 'https://itunes.apple.com/us/app/troop-app/id1025705328?mt=8' };


        if (UAParser.os.name === 'Android') {
          $scope.link.url = 'https://play.google.com/store/apps/details?id=work.troop.troop';
        }

        $scope.showSignUpModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/sign-up.html',
            controller: 'SignUpModalCtrl'
          }).then(function(modal) {

            modal.close.then(function(result) {

            });

          });
        };

        $scope.showLoginModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/login.html',
            controller: 'LoginModalCtrl'
          }).then(function(modal) {

            modal.close.then(function(result) {

            });

          });
        };

        $scope.toggleLoginMenu = function() {
          $rootScope.showLoginMenu = !$rootScope.showLoginMenu;
          $scope.showLogin = $rootScope.showLoginMenu;

        }

        $scope.$on('window-size-changed', function(event, size) {
          $scope.$apply();
        });

      }
    ]
);
