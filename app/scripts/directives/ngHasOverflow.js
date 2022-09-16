'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:ngHasOverflow
 * @description
 * # ngHasOverflow
 */
angular.module('webClientApp')
  .directive(
    'ngHasOverflow',
    [
      '$timeout',
      function (
        $timeout
      ) {
        return function(scope, element, attrs) {
          var overflowCheck = function() {
            if (
              element[0].offsetHeight < element[0].scrollHeight ||
              element[0].offsetWidth < element[0].scrollWidth
            ) {
              element.addClass('has-overflow');
            }
            else {
              element.removeClass('has-overflow');
            }

          };

          scope.$watch(
            function() {
              overflowCheck();
              return element;
            },
            function(newValue, oldValue) {
              $timeout(overflowCheck, 500);
            }
          );



        };
      }
    ]
  );
