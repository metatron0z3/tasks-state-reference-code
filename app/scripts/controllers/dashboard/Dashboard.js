'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:DashboardCtrl
 * @description
 * # DashboardCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'DashboardCtrl',
    [
      '$scope',
      '$localStorage',
      'Me',
      'ModalService',
      'agLogger',
      function (
        $scope,
        $localStorage,
        Me,
        ModalService,
        agLogger
      ) {
        var that = this;

        $scope.Me = Me;

        Me.modalIsOn = false;

        // clear out invite
        $localStorage.lastInviteToken = null;

        /// DEPRICATED
        //angular.element('body').scope().$broadcast('event', 'args')
        $scope.$on('setLogLevel', function(event, logLevel) {
          agLogger.setLogLevel(logLevel || 'off');
        });

        $scope.$on('getLogLevel', function(event) {

          agLogger.log(agLogger.getLogLevel());
        });


        $scope.$on('modal-open', function(event) {
          Me.modalIsOn = true;

        });

        $scope.$on('modal-close', function(event) {
          Me.modalIsOn = false;

        });

        $scope.$on('showLoggerSettings', function(event) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/logger-settings.html',
            controller: 'LoggerSettingsModalCtrl'
          });

        });
      }
    ]
  );
