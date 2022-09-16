/**
 * @ngdoc function
 * @name webClientApp.directive:ngSetFocus
 * @description
 * # ngSetFocusDirective
 * A directive that sets focus on first input element of every form
 */
angular.module('webClientApp').
  directive(
    'ngSetFocus',
    [
      '$timeout',
      function(
          $timeout
      ) {
        return {
          scope: {
            ngSetFocus: '='
          },
          link: function(scope, element, attrs) {

            scope.$watch('ngSetFocus', function() {

              if (scope.ngSetFocus) {
                $timeout(function(){
                    element[0].focus();
                }, 100);
              }
            });
          }
        }
      }
    ]
  );
