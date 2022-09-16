/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:LoggerSettingsModalCtrl
 * @description
 * # LoggerSettingsModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('LoggerSettingsModalCtrl', LoggerSettingsModalCtrl)

  LoggerSettingsModalCtrl.$inject = [
    '$scope',
    '$timeout',
    '$localStorage',
    'agLogger',
    'LOG_LEVEL',
    'close'
  ];

  function LoggerSettingsModalCtrl (
    $scope,
    $timeout,
    $localStorage,
    agLogger,
    LOG_LEVEL,
    close
  ) {


    var vm = this;

    activate();

    return;

    function activate() {

      $scope.showModal = true;
      $scope.$storage = $localStorage;
      $scope.logLevels = [];

      $scope.$on('onEscapeKey', function(event) {
        $scope.close();
      })

      var currentLevel = agLogger.getLogLevel();

      var index = 0;
      var selectedIndex = 0;
      _.each(agLogger.LOG_LEVELS, function(value, label) {

        $scope.logLevels.push({
          label: label,
          value: value
        });

        if ( value === currentLevel ) {
          selectedIndex = index;
        }

        index++;
      });

      $scope.levelChoice = $scope.logLevels[selectedIndex];

      $scope.changeLogLevel = function(level){

        agLogger.setLogLevel(level);
        $localStorage.loggerSettings.level = level;
      }

      $scope.close = function() {
        $scope.showModal = false;

        $timeout(close, 800);

      };
    }
  }


})(); // end of file
