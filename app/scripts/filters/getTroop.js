'use strict';

/**
 * @ngdoc filter
 * @name webClientApp.filter:getTroop
 * @function
 * @description
 * # getTroop
 * Filter in the webClientApp.
 */
angular.module('webClientApp')
  .filter(
    'getTroop',
    [
      'Ref',
      function (Ref) {
        return function (troopId, property) {

          if ( ! property ) {
            property = 'troopName';
          }

          var propertyDisplay = 'Fetching...';

          Ref.child('troops/' + troopId)
            .once(
              'value',
              function(snapshot) {
                var troop = snapshot.val();

                propertyDisplay = troop[property];
              }
            );

          return propertyDisplay;
        };
      }
    ]
  );

