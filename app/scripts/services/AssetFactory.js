'use strict';

/**
 * @ngdoc service
 * @name webClientApp.AssetFactory
 * @description
 * # AssetFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'AssetFactory',
    [
      'Ref',
      '$q',
      '$firebaseObject',
      function(
        Ref,
        $q,
        $firebaseObject
      ) {

        return {

          getFirebaseObjectByKey: function(troopId, assetId) {

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
                console.log('AssetFactory', this.$ref().toString(), $.extend({}, err))
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('assets')
                .child(troopId)
                .child(assetId)
            );
          },
          delete: function(data) {

            var deferred = $q.defer();

            Ref.child('assets')
              .child(data.troopId)
              .child(data.assetId)
              .remove(function(error) {

                if ( error ) {
                  deferred.reject(error);
                  return false;
                }

                if (data.cardId) {
                  Ref.child('cards')
                    .child(data.troopId)
                    .child(data.cardId)
                    .child('assets')
                    .child(data.assetId)
                    .remove(function(error) {

                      if ( error ) {
                        deferred.reject(error);
                        return false;
                      }

                      deferred.resolve();

                    });

                  return false;
                }

                deferred.resolve();

              });

            return deferred.promise;

          },
          create: function(data) {

            if ( ! data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID' });
            }

            var deferred = $q.defer();

            var assetRef = Ref.child('assets').child(data.troopId).push(
              {
                boardId: data.boardId || null,
                cardId: data.cardId || null,
                memberId: data.memberId || null,
                chatId: data.chatId || null,
                chatEntryId: data.chatEntryId || null,
                createdByUserId: data.createdByUserId || null,
                mimeType: data.mimeType || null,
                caption: data.caption || null,
                originalUrl: data.originalUrl || null,
                fileName: data.fileName || null,
                metaData: data.metaData || null,
                isAvatar: data.isAvatar === true || null,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                createdAt: firebase.database.ServerValue.TIMESTAMP
              },
              function(error) {

                if (error) {
                  deferred.reject(error);
                }
                else {
                  deferred.resolve(assetRef);
                }
              }
            );

            return deferred.promise;
          },
          createAvatar: function(data) {

            // * userId/avatarAssetId			string - Firebase auto generated
        		// - mimeType				string - mimeTypes
        		// - storageSize				64 bit integer - size in bytes
        		// - originalUrl				string
        		// - fileName				string
        		// - archived				boolean
        		// - createdAt				64 bit integer - epoch time milliseconds
        		// - updatedAt				64 bit integer - epoch time milliseconds
        		// - metaData				(dependent on mime type)

            var deferred = $q.defer();

            var assetRef = Ref.child('avatars').child(data.uid).push(
              {
                mimeType: data.mimeType || null,
                storageSize: data.storageSize || null,
                originalUrl: data.originalUrl || null,
                fileName: data.fileName || null,
                archived: data.archived || null,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                metaData: data.metaData || null
              },
              function(error) {

                if (error) {
                  deferred.reject(error);
                }
                else {
                  deferred.resolve(assetRef);
                }
              }
            );

            return deferred.promise;
          },
          formatDuration: function(duration) {

            var hours = parseInt( duration / 3600 ) % 24;
            var minutes = parseInt( duration / 60 ) % 60;
            var seconds = duration % 60;

            if (hours < 10) {
              hours = '0' + hours;
            }
            if (minutes < 10) {
              minutes = '0' + minutes;
            }
            if (seconds < 10) {
              seconds = '0' + seconds;
            }

            return hours + ':' + minutes + ':' + seconds;
          }

        };
      }
    ]
  );
