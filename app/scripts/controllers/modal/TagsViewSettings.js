/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TagsViewSettingsModalCtrl
 * @description
 * # TagsViewSettingsModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('TagsViewSettingsModalCtrl', TagsViewSettingsModalCtrl)

  TagsViewSettingsModalCtrl.$inject = [
    '$scope',
    '$timeout',
    'Me',
    'Nav',
    'TroopLogger',
    'close'
  ];

  function TagsViewSettingsModalCtrl (
    $scope,
    $timeout,
    Me,
    Nav,
    TroopLogger,
    close
  ) {
    var logConfig = {
      slug: 'controller: TagsViewSettingsModal - ',
      path: [ 'controllers', 'modal', 'TagsViewSettings.js']
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

          $scope.save(tagsViewSettingsModalForm);

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

      Me.currentBoard.viewSettings.tag.showImage = $scope.viewSettings.tag.showImage;
      Me.currentBoard.$save()
      .then(closeModal)
      .catch(function brokenDreamCatcher(error) {
        TroopLogger.error(logConfig, 'save()', error);
      });

    }



  }


})(); // end of file
