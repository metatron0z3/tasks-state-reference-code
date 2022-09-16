'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:jhExperience
 * @description
 * # jhExperience
 */
angular.module('webClientApp')
    .directive('jhExperience',
    [
      function (
        '$rootScope'
      ) {
        $rootScope,
        return {
          scope: {

            tpCardId: '='
          },
          link: function(scope, element, attrs) {


          }
        }


      }
    ]);
