'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:ngEscKey
 * @description
 * # ngEscKey
 */
angular.module('webClientApp')
  .directive(
    'ngEscKey',
    function () {
      return {
        scope: {
          ngEscKeyAction: '&ngEscKey',
          ngModel: '=ngModel'
        },
        link: function(scope, element, attrs) {

          element.bind("keydown.esc keypress.esc", function(event) {
            var keyCode = event.which || event.keyCode;

            // If enter key is pressed
            if (keyCode === 27) {

              scope.ngEscKeyAction();

              event.stopPropagation();
              event.preventDefault();
            }
          });
        }
      };

  });
