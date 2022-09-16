'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:ngClearStyle
 * @description
 * # ngClearStyle
 */
angular.module('webClientApp')
  .directive('ngClearStyle', function () {
    return function(scope, element, attrs) {

      setTimeout(function() {
        element[0].removeAttribute('style');
      }, 100)

    };
  });