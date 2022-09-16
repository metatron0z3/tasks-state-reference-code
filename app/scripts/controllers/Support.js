'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:SupportCtrl
 * @description
 * # SupportCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'SupportCtrl',
    [
      '$scope',
      'ModalService',
      function (
        $scope,
        ModalService
      ) {

        var that = this;
        this.highestClick = false;
        this.levelClick = false;

        this.check = function() {

          if ( that.highestClick && that.levelClick ) {

            ModalService.showModal({
              templateUrl: '/views/modal/konami.html',
              controller: 'KonamiModalCtrl'
            })
            .then(function(modal) {

              // modal.controller.setMember(member);

              // modal.close.then(function(result) {
              //
              // });

            });
          }
        };
        $scope.personal = function() {
        };

        $scope.contain = function() {
        };

        $scope.frequently = function() {
        };

        $scope.highest = function() {

          that.highestClick = true;
          that.check();
        };

        $scope.level = function() {

          that.levelClick = true;
          that.check();
        };


      }
    ]

  );
