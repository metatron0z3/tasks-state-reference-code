angular
  .module(
    'firebase.Ref',
    ['firebase', 'firebase.FirebaseApp']
  )
  .factory(
    'Ref',
    [
      'FirebaseApp',
      function(
        FirebaseApp
      ) {
        'use strict';

        var rootRef = firebase.database().ref();

        return rootRef;
      }
    ]
  );
