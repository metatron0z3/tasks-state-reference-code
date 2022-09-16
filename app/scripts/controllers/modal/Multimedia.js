'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:MultimediaModalCtrl
 * @description
 * # MultimediaModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
		.controller(
		'MultimediaModalCtrl',
		[
      '$scope',
			'$timeout',
      'Me',
      'close',
      function (
        $scope,
				$timeout,
        Me,
        close
      ) {
        var that = this;


        $scope.showModal = true;

        this.setData = function(data) {
          $scope.asset = data.asset;

        };

				$scope.$on('onEscapeKey', function(event) {
					$scope.close();
				})

        $scope.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };
			}
		]);
