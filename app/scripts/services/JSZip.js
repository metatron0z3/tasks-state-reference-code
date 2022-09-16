'use strict';

/**
 * @ngdoc service
 * @name webClientApp.JSZip
 * @description
 * # JSZip
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'JSZip',
    [
      function (

      ) {

        return function(zipFile) {

          return new JSZip(zipFile);
        }

      }
    ]);
