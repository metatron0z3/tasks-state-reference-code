'use strict';

/**
 * @ngdoc service
 * @name webClientApp.Fingerprint
 * @description
 * # Fingerprint
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'Fingerprint',
    [
      '$q',
      function (
        $q
      ) {

        var deferred = $q.defer();

        new Fingerprint2({
          excludeLanguage: true,
          excludeColorDepth: true,
          excludeScreenResolution: true,
          excludeTimezoneOffset: true,
          excludeSessionStorage: true,
          excludeIndexedDB: true,
          excludeOpenDatabase: true,
          excludeDoNotTrack: true,
          excludeWebGL: true,
          excludeAdBlock: true,
          excludeHasLiedLanguages: true,
          excludeHasLiedResolution: true,
          excludeJsFonts: true,
          excludePlugins: true,
          excludeTouchSupport: true
        }).get(function(fingerprint) {
          deferred.resolve(fingerprint);
        });

        return deferred.promise;

      }
    ]);
