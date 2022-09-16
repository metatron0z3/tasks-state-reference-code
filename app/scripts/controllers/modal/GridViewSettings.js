/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:GridViewSettingsModalCtrl
 * @description
 * # GridViewSettingsModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('GridViewSettingsModalCtrl', GridViewSettingsModalCtrl)

  GridViewSettingsModalCtrl.$inject = [
    '$scope',
    '$timeout',
    'Me',
    'Nav',
    'TroopLogger',
    'close'
  ];

  function GridViewSettingsModalCtrl (
    $scope,
    $timeout,
    Me,
    Nav,
    TroopLogger,
    close
  ) {
    var logConfig = {
      slug: 'controller: GridViewSettingsModal - ',
      path: [ 'controllers', 'modal', 'GridViewSettings.js']
    };

    var vm = this;

    $scope.close = closeModal;
    $scope.save = save;
    $scope.viewSettings = {};

    activate();

    return;

    function activate() {


      $scope.showModal = true;

      angular.merge($scope.viewSettings, Me.currentBoard.viewSettings);

      $scope.$on('onEnterKey', function(event) {

        $timeout(function() {

          $scope.save($scope.gridViewSettingsModalForm);

        }, 0 );
      });

      $scope.$on('onEscapeKey', function(event) {
        $scope.close();
      })

    }

    function closeModal() {
      $scope.showModal = false;

      $timeout(close, 800);

    }

    function save(form) {

      Me.currentBoard.viewSettings.grid.showTitle = $scope.viewSettings.grid.showTitle;
      Me.currentBoard.viewSettings.grid.showNonImages = $scope.viewSettings.grid.showNonImages;
      Me.currentBoard.$save()
      .then(closeModal)
      .catch(function brokenDreamCatcher(error) {
        TroopLogger.error(logConfig, 'save()', error);
      });

    }

  }


})(); // end of file
