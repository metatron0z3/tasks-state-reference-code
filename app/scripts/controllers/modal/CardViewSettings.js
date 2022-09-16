/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:CardViewSettingsModalCtrl
 * @description
 * # CardViewSettingsModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('CardViewSettingsModalCtrl', CardViewSettingsModalCtrl)

  CardViewSettingsModalCtrl.$inject = [
    '$scope',
    '$timeout',
    'Me',
    'Nav',
    'TroopLogger',
    'close'
  ];

  function CardViewSettingsModalCtrl (
    $scope,
    $timeout,
    Me,
    Nav,
    TroopLogger,
    close
  ) {
    var logConfig = {
      slug: 'controller: CardViewSettingsModal - ',
      path: [ 'controllers', 'modal', 'CardViewSettings.js']
    };

    var vm = this;

    $scope.close = closeModal;
    $scope.save = save;
    $scope.viewSettings = {};

    activate();

    return;

    function activate() {


      $scope.showModal = true;
      $scope.imageSizes = [
       {
         label: 'Thumbnail',
         value: 'thumbnail'
       },
      //  {
      //    label: 'Medium',
      //    value: 'medium'
      //  },
       {
         label: 'Panoramic',
         value: 'panoramic'
       },
       {
         label: 'Large',
         value: 'large'
       },
      //  {
      //    label: 'Macro',
      //    value: 'macro'
      //  }
      ];


      angular.merge($scope.viewSettings, Me.currentBoard.viewSettings);
      var index = _.findIndex($scope.imageSizes, function(size) {
        return size.value === $scope.viewSettings.card.imageSize;
      });

      $scope.imageSizeChoice = $.extend( {}, $scope.imageSizes[index] );

      $scope.$on('onEnterKey', function(event) {

        $timeout(function() {

          $scope.save($scope.cardViewSettingsModalForm);

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

      Me.currentBoard.viewSettings.card.imageSize = $scope.imageSizeChoice.value;
      Me.currentBoard.viewSettings.card.showHeader = $scope.viewSettings.card.showHeader;
      Me.currentBoard.$save()
      .then(closeModal)
      .catch(function brokenDreamCatcher(error) {
        console.log(error)
        TroopLogger.error(logConfig, 'save()', error);
      });

    }




  }


})(); // end of file
