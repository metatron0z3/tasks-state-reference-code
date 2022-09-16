'use strict';

/**
 * @ngdoc service
 * @name webClientApp.UAParser
 * @description
 * # UAParser
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'UAParser',
    [
      function () {
        var parser = new UAParser();
        var userAgent = parser.getResult();

        return userAgent;

      }
    ]);
