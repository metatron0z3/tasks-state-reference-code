'use strict';

/**
 * @ngdoc service
 * @name webClientApp.TroopMemberFactory
 * @description
 * # TroopMemberFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'TroopMemberFactory',
    [
      '$q',
      '$firebaseObject',
      '$firebaseUtils',
      '$log',
      'Slug',
      'AssetFactory',
      'Ref',
      'TroopApi',
      'TroopLogger',
      'MIME_TYPES',
      'ANIMAL_AVATARS',
      function(
        $q,
        $firebaseObject,
        $firebaseUtils,
        $log,
        Slug,
        AssetFactory,
        Ref,
        TroopApi,
        TroopLogger,
        MIME_TYPES,
        ANIMAL_AVATARS
      ) {
        var logConfig = {
          slug: 'service: TroopMemberFactory - ',
          path: [ 'services', 'TroopMemberFactory.js']
        };
        return {

          // This will need to be updated to set a default MemberName of user's first name
          // if exists then append a 1,2 etc...
          exists: function(troopId, TroopMemberName) {
            var deferred = $q.defer();

            Ref.child('members')
              .orderByChild('troopId')
              .equalTo(troopId)
              .once('value', function(snapshot) {

                var troopMemberNameExists = false;
                snapshot.forEach(function(childSnapshot) {

                  if (childSnapshot.val().memberName === TroopMemberName) {
                    troopMemberNameExists = true;
                  }

                });

                if (troopMemberNameExists) {
                  deferred.reject('TROOP_MEMBER_NAME_EXISTS');
                }
                else {
                  deferred.resolve(false);
                }
              });

            return deferred.promise;
          },
          getFirebaseObjectByKey: function(troopId, troopMemberId) {

            TroopLogger.debug(logConfig, 'getFirebaseObjectByKey', troopId, troopMemberId)

            return new $firebaseObject.$extend({

              $loaded: function(resolve, reject) {
                var promise = this.$$conf.sync.ready();

                var that = this;
                that.troopId = troopId;


                promise.then(function() {

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
              $save: function() {

                TroopLogger.debug(logConfig, 'TroopMemberFirebaseObject.$save()');
                var self = this;
                var ref = self.$ref();
                var data = $firebaseUtils.toJSON(self);

                delete data.troopId;

                data.updatedAt = firebase.database.ServerValue.TIMESTAMP;

                return $firebaseUtils.doSet(ref, data).then(function() {

                  self.$$notify();
                  return self.$ref();

                });
              },
              $$error: function (err) {

                TroopLogger.error(logConfig, 'TroopMemberFactory', this.$ref().toString(), err);
                // prints an error to the console (via Angular's logger)
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('members')
                .child(troopId)
                .child(troopMemberId)
            );
          },
          create: function(data) {

            if ( ! data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID' });
            }

            var that = this;
            var deferred = $q.defer();
            var troopMemberRef;
            var payload = {
              memberName: data.memberName || null,
              userId: data.userId || null,
              name: data.name || null,
              troopPermission: data.troopPermission || null,
              createdAt: firebase.database.ServerValue.TIMESTAMP,
              updatedAt: firebase.database.ServerValue.TIMESTAMP,
              title: data.title || null,
              blurb: data.blurb || null,
              avatarAssetId: data.avatarAssetId || null,
              boards: data.boards || null,
              groups: data.groups || null,
              memberChats: data.memberChats || null,
              devices: data.devices || null
            };
            var cb = function(error) {

              if (error) {
                deferred.reject(error);
                return false;
              }

              deferred.resolve(troopMemberRef);
            };

            if ( data.troopMemberId ) {
              troopMemberRef = Ref.child('members')
                                  .child(data.troopId)
                                  .child(data.troopMemberId);
              troopMemberRef.set(payload, cb);
            }
            else {
              troopMemberRef = Ref.child('members')
                                  .child(data.troopId)
                                  .push(payload, cb);
            }


            return deferred.promise;
          },
          update: function(data) {

            var deferred = $q.defer();

            var payload = {};

            if ( data.hasOwnProperty('name') ) {
              payload.name = data.name;
            }
            if ( data.hasOwnProperty('blurb') ) {
              payload.blurb = data.blurb;
            }
            if ( data.hasOwnProperty('avatarAssetId') ) {
              payload.avatarAssetId = data.avatarAssetId;
            }

            TroopApi.updateUser(payload)
              .then(function(response){


                if ( response.data === true ) {

                  deferred.resolve();
                }
                else {

                  deferred.reject(response.data);
                }
              });

            return deferred.promise;
          },

          uploadAvatarAssetFromUrl: function(options) {

            var that = this;
            var deferred = $q.defer();
            var assetRef;

            AssetFactory.create({
              troopId: options.troopId,
              memberId: options.memberId,
              createdByUserId: options.createdByUserId,
              mimeType: options.mimeType,
              fileName: options.fileName,
              metaData: options.metaData,
              isAvatar: true
            })
            .then(function(ref) {

              assetRef = ref;

              Ref.child('members')
                .child(options.troopId)
                .child(options.memberId)
                .child('avatarAssetId')
                .set(assetRef.key);

              return TroopApi.uploadFromUrl({
                url: options.url,
                uid: options.uid,
                assetId: assetRef.key,
                troopId: options.troopId
              });

            })
            .then(function(resp) {

              deferred.resolve(assetRef);
            })
            .catch(function(error) {

              deferred.reject(error);
            });

            return deferred.promise;
          },
          uploadAvatarAsset: function(options) {

            var that = this;
            var deferred = $q.defer();
            var assetRef;

            AssetFactory.createAvatar({
              //troopId: options.troopId,
              //memberId: options.memberId,
              uid: options.createdByUserId,
              mimeType: options.mimeType,
              fileName: options.fileName,
              metaData: options.metaData
            })
            .then(function writeAvatarAsset(assetRef) {

              return TroopApi.updateUser({ avatarAssetId: assetRef.key })

            })
            .then(function uploadFile(response) {

              return TroopApi.uploadFile({
                uid: options.createdByUserId,
                assetId: assetRef.key,
                $file: options.$file
              });
            })
            .then(function complete(uploader) {

              deferred.resolve(assetRef);
            })
            .catch(function(error) {

              deferred.reject(error);
            });

            return deferred.promise;

          },
          generateAvatar: function(troopMemberId) {

            var memberIdMD5 = CryptoJS.MD5(troopMemberId).toString();
            var index = parseInt(memberIdMD5.charCodeAt(0)) % ANIMAL_AVATARS.length;

            return ANIMAL_AVATARS[index];
          },
          setBoardPermission: function(options) {

            var deferred = $q.defer();

            Ref.child('members')
              .child(options.troopId)
              .child(options.memberId)
              .child('boards')
              .child(options.boardId)
              .child('permission')
              .set(options.permission, function(error) {

                if ( error ) {
                  deferred.reject(error);
                }
                else {
                  deferred.resolve();
                }
              });

            return deferred.promise;
          },
          setTroopPermission: function(options) {

            return TroopApi.updateTroop({
              uid: options.uid,
              troopId: options.troopId,
              memberId: options.memberId,
              troopPermission: options.troopPermission
            });
          },
          removeFromBoard: function(options) {

            var deferred = $q.defer();

            Ref.child('boards')
              .child(options.troopId)
              .child(options.boardId)
              .child('members')
              .child(options.memberId)
              .set(false, function(error) {

                if ( error ) {
                  deferred.reject(error);
                }
                else {
                  deferred.resolve();
                }
              });

            Ref.child('members')
              .child(options.troopId)
              .child(options.memberId)
              .child('boards')
              .child(options.boardId)
              .remove(function(error) {

                if ( error ) {
                  deferred.reject(error);
                }
                else {
                  deferred.resolve();
                }
              });



            return deferred.promise;
          },
          removeFromTroop: function(troopMember) {

            var deferred = $q.defer();

            if (troopMember.devices) {
              _.each(troopMember.devices, function(val, deviceId) {
                Ref.child('devices/' + deviceId).remove();
              });
            }

            Ref.child('users')
              .child(troopMember.userId)
              .child('troops')
              .child(troopMember.troopId)
              .remove();

            Ref.child('members')
              .child(troopMember.troopId)
              .child(troopMember.$id)
              .remove();


            deferred.resolve();

            return deferred.promise;
          }
        };
      }
    ]
  );
