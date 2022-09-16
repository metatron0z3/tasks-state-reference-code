'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:BoardImportModalCtrl
 * @description
 * # BoardImportModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'BoardImportModalCtrl',
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
        that.completedCount = 0;

        $scope.showModal = true;

        that.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };

        $scope.setBoard = function(board) {
          $scope.board = board;

          var assetCount = 0;
          if (board.cards) {
            _.each(board.cards, function(card) {

              if (card.assets) {
                assetCount += _.keys(card.assets).length;
              }
            });
          }

          that.assetCount = assetCount;
          $scope.percent = 10;


        };


        $scope.$on('asset-upload-start', function(event, assetRef) {

          var onValueChange = function(snap) {
            var asset = snap.val();

            if (asset.upload && (asset.upload.state === 'finished') ) {

              that.completedCount += 1;
              var percent = Math.round( (that.completedCount / that.assetCount) * 10 ) * 10;

              $scope.percent = Math.max($scope.percent, percent);
              $scope.$apply();
              assetRef.off('value', onValueChange);

              if (percent === 100) {
                that.close();
              }
            }


          };

          assetRef.on('value', onValueChange);

        });

      }
    ]
  );
