'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:NotificationModalCtrl
 * @description
 * # NotificationModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
    .controller(
        'NotificationModalCtrl',
        [
          '$scope',
          '$state',
          '$localStorage',
          '$timeout',
          'Me',
          'BoardFactory',
          'Ref',

          'close',
          'ModalService',
          function (
              $scope,
              $state,
              $localStorage,
              $timeout,
              Me,
              BoardFactory,
              Ref,
              close,
              ModalService
          ) {

            var that = this;
            this.something = false;


            $scope.someScopeObj = {};



            this.someFunction = function() {};

            this.someOtherFunction = function() {};

            $scope.showNotificationSettingsModal = function(action) {

              if ( Me.modalIsOn ) {

                return;
              }

              ModalService.showModal({
                templateUrl: '/views/modal/notification-settings.html',
                controller: 'NotificationModalCtrl'
              }).then(function(modal) {

                modal.scope.action = action;

                modal.close.then(function(result) {

                });

              });
            };

            $scope.close = function () {
              $scope.showModal = false;

              $timeout(close, 800);

            };


          }

        ]
    );
