'use strict';

/**
 * @ngdoc filter
 * @name webClientApp.filter:encodeURIComponent
 * @function
 * @description
 * # encodeURIComponent
 * Filter in the webClientApp.
 */
angular.module('webClientApp')
  .filter('encodeURIComponent', function () {
    return function () {
      return window.encodeURIComponent;
    };
  });

