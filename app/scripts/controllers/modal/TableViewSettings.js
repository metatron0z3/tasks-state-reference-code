/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TableViewSettingsModalCtrl
 * @description
 * # TableViewSettingsModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('TableViewSettingsModalCtrl', TableViewSettingsModalCtrl)

  TableViewSettingsModalCtrl.$inject = [
    '$scope',
    '$timeout',
    'Me',
    'Nav',
    'TroopLogger',
    'close'
  ];

  function TableViewSettingsModalCtrl (
    $scope,
    $timeout,
    Me,
    Nav,
    TroopLogger,
    close
  ) {
    var logConfig = {
      slug: 'controller: TableViewSettingsModal - ',
      path: [ 'controllers', 'modal', 'TableViewSettings.js']
    };

    var vm = this;

    vm.close = closeModal;
    vm.save = save;
    vm.viewSettings = {};

    activate();

    return;

    function activate() {

      vm.showModal = true;
      angular.merge(vm.viewSettings, Me.currentBoard.viewSettings);

      $scope.$on('onEnterKey', function(event) {

        $timeout(function() {

          vm.save(tableViewSettingsModalForm);

        }, 0 );
      });

      $scope.$on('onEscapeKey', function(event) {
        vm.close();
      })

    }

    function closeModal() {
      vm.showModal = false;

      $timeout(close, 800);

    }

    function save(form) {

      Me.currentBoard.viewSettings.list.showImage = vm.viewSettings.list.showImage;
      Me.currentBoard.viewSettings.list.showAuthor = vm.viewSettings.list.showAuthor;
      Me.currentBoard.viewSettings.list.showDate = vm.viewSettings.list.showDate;
      // Me.currentBoard.viewSettings.list.showTags = vm.viewSettings.list.showTags;

      Me.currentBoard.$save()
      .then(closeModal)
      .catch(function brokenDreamCatcher(error) {
        console.log(error)
        TroopLogger.error(logConfig, 'save()', error);
      });

    }



  }

})(); // end of file
