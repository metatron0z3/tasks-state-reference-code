'use strict';

/**
 * @ngdoc filter
 * @name webClientApp.filter:getTroopMember
 * @function
 * @description
 * # getTroopMember
 * Filter in the webClientApp.
 */
angular.module('webClientApp')
  .filter(
    'getTroopMember',
    [
      'Ref',
      function (Ref) {
        return function (troopMemberId, property) {

          if ( ! property ) {
            property = 'displayName';
          }

          var propertyDisplay = 'Fetching...';

          Ref.child('members/' + troopMemberId)
            .once(
              'value',
              function(snapshot) {
                var troopMember = snapshot.val();

                propertyDisplay = troopMember[property];
              }
            );

          return propertyDisplay;
        };
      }
    ]
  );

