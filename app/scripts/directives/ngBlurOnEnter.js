'use strict';


/**
 * @ngdoc directive
 * @name webClientApp.directive:ngBlurOnEnter
 * @description
 * # ngBlurOnEnter
 */
angular.module('webClientApp')
  .directive(
    'ngBlurOnEnter',
    function () {
      return {
        link: function(scope, element, attrs) {

          element.bind("keypress", function (event) {
            if(event.which === 13) {
              element.blur();
              //event.preventDefault();
            }
          });
        }
      }

  });
