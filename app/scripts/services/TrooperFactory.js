'use strict';

/**
 * @ngdoc service
 * @name webClientApp.TrooperFactory
 * @description
 * # TrooperFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'TrooperFactory',
    [
      '$q',
      'UAParser',
      'Ref',
      '$firebaseObject',
      '$log',
      function(
        $q,
        UAParser,
        Ref,
        $firebaseObject,
        $log
      ) {

        return {

          getFirebaseObjectByKey: function(trooperId) {

            return new $firebaseObject.$extend({
              $loaded: function(resolve, reject) {
                var promise = this.$$conf.sync.ready();


                promise.then(function() {
                  //... do something
                });

                if (arguments.length) {
                  // allow this method to be called just like .then
                  // by passing any arguments on to .then
                  promise = promise.then.call(promise, resolve, reject);
                }
                return promise;
              },

              // each time an update arrives from the server, apply the change locally
              $$updated: function(snap) {
                // apply the changes using the super method
                var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);

                if (changed) {


                }

                // return whether or not changes occurred
                return changed;
              },
              $$error: function (err) {
                //var e = new Error('dummy');
                //console.log('TrooperFactory', this.$ref().toString(), $.extend({}, err), e.stack);
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('users')
                .child(trooperId)
            );

          },

          create: function(trooperId, data, cb) {

            var trooperRef = Ref.child('users/' + trooperId);
            trooperRef.set(
              {
                email: data.email || null,
                name: data.name || null,
                source: data.source || null,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                createdAt: firebase.database.ServerValue.TIMESTAMP
              },
              cb
            );


            return trooperRef;
          },
          update: function(trooperId, data, cb) {

            var trooperRef = Ref.child('users/' + trooperId);

            var payload = {
              updatedAt: firebase.database.ServerValue.TIMESTAMP
            };

            if ( data.hasOwnProperty('email') ) {
              payload.email = data.email;
            }
            if ( data.hasOwnProperty('name') ) {
              payload.name = data.name;
            }

            trooperRef.update(payload, cb);

            return trooperRef;
          },
          setName: function(trooperId, data, cb) {

            var payload = {};

            if ( data.hasOwnProperty('name') ) {
              payload.name = data.name;
            }
            var trooperRef = Ref.child('users/' + trooperId);

            trooperRef.update(payload, cb);

          },
          exists: function(email) {

            var deferred = $q.defer();

            Ref.child('users')
               .orderByChild('email')
               .equalTo(email)
               .limitToFirst(1)
               .once('value', function (userSnapArray) {

                 if (userSnapArray.exists()) {

                   userSnapArray.forEach(function(userSnap) {

                     var user = userSnap.val();
                     user.$id = userSnap.key;
                     deferred.resolve(user);

                   });
                 }
                 else {
                   deferred.reject({
                     code: 'USER_DOES_NOT_EXIST'
                   });
                 }
               });


            return deferred.promise;

          }
        };
      }
    ]
  );
