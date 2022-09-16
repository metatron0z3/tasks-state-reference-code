'use strict';

angular.module('webClientApp')
  .filter(
    'reverse',
    [
      function() {
        return function(items) {
          return angular.isArray(items)? items.slice().reverse() : [];
        };
      }
    ]
  );
