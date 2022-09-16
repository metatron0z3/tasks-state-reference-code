'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:KonamiModalCtrl
 * @description
 * # KonamiModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
		.controller(
		'KonamiModalCtrl',
		[
			'$rootScope',
      '$scope',
			'$state',
			'$timeout',
			'$localStorage',
      'Me',
			'close',
      function (
				$rootScope,
        $scope,
				$state,
				$timeout,
				$localStorage,
        Me,
			  close
      ) {
        var that = this;

				$scope.$storage = $localStorage;
        $scope.showModal = true;
				$scope.colorScheme = 0;

				if ( ! $localStorage.jhSettings ) {
					$localStorage.jhSettings = {};
				}

				this.check = function() {

					if ( '72d92adaa209a6e2526d65fc5d596de8' === CryptoJS.MD5($localStorage.codeEntered.join('')).toString()) {

						$state.go('home.dashboard');
						$scope.close();
					}
				};
				$scope.addCode = function(code) {

					if ( $localStorage.codeEntered.length >= 12 ) {
						$localStorage.codeEntered.splice(0, 1);
					}

					$localStorage.codeEntered.push(code);
					that.check();
				};



        $scope.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };

				if ( ! $localStorage.codeEntered ) {
					$localStorage.codeEntered = [];
				}
				this.check();
			}
		]);
