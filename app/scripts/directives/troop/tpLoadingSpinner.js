'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpLoadingSpinner
 * @description
 * # tpLoadingSpinner
 */
angular.module('webClientApp')
  .directive('tpLoadingSpinner', [
    'Ref',
    function (
      Ref
    ) {

      return {
        scope: {
          tpLoadingSpinner: '='
        },
        link: function(scope, element, attrs) {

          scope.$watch('tpLoadingSpinner', function() {

          });

        }
      }
    }
  ]);
