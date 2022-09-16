'use strict';

/**
 * @ngdoc service
 * @name webClientApp.InviteFactory
 * @description
 * # InviteFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'InviteFactory',
    [
      '$q',
      'Ref',
      '$firebaseObject',
      '$firebaseArray',
      function(
        $q,
        Ref,
        $firebaseObject,
        $firebaseArray
      ) {

        var that = this;

        var factory = {

          getFirebaseObjectByKey: function(troopId, inviteId) {

            return new $firebaseObject.$extend({
              $loaded: function(resolve, reject) {
                var promise = this.$$conf.sync.ready();

                var that = this;
                that.troopId = troopId;

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

                  this.troopId = troopId;

                }
                // return whether or not changes occurred
                return changed;
              },
              $$error: function (err) {
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('troopInvites')
                .child(troopId)
                .child(inviteId)
            );
          },

          create: function(data) {

            console.log('data: ', data)

            if ( ! data.permission ) {
              return $q.reject({ code: 'MISSING_INVITE_PERMISSION' });
            }

            var deferred = $q.defer();

            var inviteTable = 'troopInvites';
            var payload = {
              permission: data.permission,
              fromMemberId: data.fromMemberId || null,
              createdAt: firebase.database.ServerValue.TIMESTAMP
            };

            if ( data.boardId ) {
              payload.boardId = data.boardId;
              payload.memberId = data.memberId;
              inviteTable = 'boardInvites';
            }

            if ( data.email ) {
              payload.email = data.email;
            }

            var inviteRef = Ref.child(inviteTable).child(data.troopId).push(
              payload,
              function(error) {

                if ( error ) {

                  deferred.reject(error);
                  return false;
                }

                deferred.resolve(inviteRef);
              }
            );

            return deferred.promise;
          },

          update: function(data) {

          },

          delete: function(data) {


          }

        };

        return factory;
      }
    ]
  );
