'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpUserProfile
 * @description
 * # tpUserProfile
 */
angular.module('webClientApp').directive(
  'tpUserProfile',
  [
    function tpUserProfile() {


      var controller = [
        '$scope',
        '$element',
        '$timeout',
        'Me',
        function tpUserProfileController(
          $scope,
          $element,
          $timeout,
          Me
        ) {

        }
      ];

      return {
        restrict: 'A',
        scope: {
          user: '=tpUserProfile'
        },
        controller: controller,
        templateUrl: '/views/directives/troop/tp-user-profile.html'
      };
    }
  ]
);
