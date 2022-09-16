angular
  .module(
    'firebase.FirebaseApp',
    ['firebase', 'firebase.config']
  )
  .factory(
    'FirebaseApp',
    [
      'FB_API_KEY',
      'FB_AUTH_DOMAIN',
      'FB_DATABASE_URL',
      'FB_STORAGE_BUCKET',
      function(
        FB_API_KEY,
        FB_AUTH_DOMAIN,
        FB_DATABASE_URL,
        FB_STORAGE_BUCKET
      ) {
        'use strict';

        var config = {
          apiKey: FB_API_KEY,
          authDomain: FB_AUTH_DOMAIN,
          databaseURL: FB_DATABASE_URL,
          storageBucket: FB_STORAGE_BUCKET,
        };

        var app = firebase.initializeApp(config);
        return app;
      }
    ]
  );
