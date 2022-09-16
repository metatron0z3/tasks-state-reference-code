'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:dotdotdot
 * @description
 * # dotdotdot
 */
angular.module('webClientApp')
  .directive('dotdotdot', [
    '$timeout',
    function ($timeout) {
      return {
        required: 'ngBindHtml',
        restrict: 'A',
        priority: 100,
        link: function(scope, element, attributes) {

          scope.$watch(
            element.html(),
            function(value) {

              element.dotdotdot({
                watch: false,
                wrap: 'letter'
              });
            }
          )


        }
      }
    }
  ]);