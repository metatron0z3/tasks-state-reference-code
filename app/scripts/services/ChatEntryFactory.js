'use strict';

/**
 * @ngdoc service
 * @name webClientApp.ChatEntryFactory
 * @description
 * # ChatEntryFactory
 * Factory in the webClientApp.
 */
angular
  .module('webClientApp')
  .factory('ChatEntryFactory', ChatEntryFactory);

  ChatEntryFactory.$inject = [
    'Ref',
    '$q',
    '$firebaseObject',
    '$firebaseArray',
    '$firebaseUtils',
    'AssetFactory',
    'TroopApi'
  ];

  function ChatEntryFactory(
    Ref,
    $q,
    $firebaseObject,
    $firebaseArray,
    $firebaseUtils,
    AssetFactory,
    TroopApi
  ) {

    var that = this;

    var factory = {

      getFirebaseObjectByKey: function(troopId, chatEntryId) {

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
            console.log('ChatEntryFactory', this.$ref().toString(), $.extend({}, err))
            // prints an error to the console (via Angular's logger)
            // $log.error(err);
            // frees memory and cancels any remaining listeners
            this.$destroy(err);
          },
        })(
          Ref.child('chatEntries')
            .child(troopId)
            .child(chatEntryId)
        );
      },

      create: function(data) {

        var deferred = $q.defer();

        var chatEntryRef = Ref.child('chatEntries').child(data.troopId).push(
          {
            chatId: data.chatId || null,
            memberId: data.memberId || null,
            text: data.text || null,
            assetId: data.assetId || null,
            updatedAt: firebase.database.ServerValue.TIMESTAMP,
            createdAt: firebase.database.ServerValue.TIMESTAMP
          },
          function(error) {

            if (error) {
              deferred.reject(error);
              return false;
            }

            var chatEntryId = chatEntryRef.key;

            Ref.child('chats')
              .child(data.troopId)
              .child(data.chatId)
              .child('/totalChatEntries')
              .transaction(function(currentValue) {
                return (currentValue || 0) + 1;
              });

            deferred.resolve(chatEntryRef);
          }
        );

        return deferred.promise;
      },

      update: function(data, cb) {

      },

      delete: function(entry) {

        var deferred = $q.defer();


        Ref.child('chatEntries')
          .child(entry.troopId)
          .child(entry.$id)
          .remove();

        Ref.child('chats')
          .child(entry.troopId)
          .child(entry.chatId)
          .child('totalChatEntries')
          .transaction(function(currentValue) {
            return (currentValue - 1) || 0;
          });

          deferred.resolve(entry);
          return deferred.promise;
      },

      getEntries: function(troopId, chatId) {

        return new $firebaseArray.$extend({

          $$added: function(snap, prevChild) {

            var added = false;

            // check to make sure record does not exist
            var i = this.$indexFor(snap.key);

            if( i === -1 ) {
              // parse data and create record
              var rec = snap.val();
              if( ! angular.isObject(rec) ) {
                rec = { $value: rec };
              }

              if ( ! rec.archived ) {

                rec.$id = snap.key;
                rec.$priority = snap.getPriority();
                rec.troopId = troopId;

                $firebaseUtils.applyDefaults(rec, this.$$defaults);

                added = rec;
              }
            }

            return added;
          },
          $$updated: function(snap) {

            var changed = false;
            var rec = this.$getRecord(snap.key);
            if( angular.isObject(rec) ) {
              // apply changes to the record
              changed = $firebaseUtils.updateRec(rec, snap);
              $firebaseUtils.applyDefaults(rec, this.$$defaults);
              rec.troopId = troopId;
            }
            return changed;
          },
          $$error: function (err) {
            console.log('ChatEntryFactory - getEntries', this.$ref().toString(), $.extend({}, err))
            // prints an error to the console (via Angular's logger)
            // $log.error(err);
            // frees memory and cancels any remaining listeners
            this.$destroy(err);
          },
        })(
          Ref.child('chatEntries')
            .child(troopId)
            .orderByChild('chatId')
            .equalTo(chatId)
            .limitToLast(250)
        );
      },
      addAsset: function(data) {

        var deferred = $q.defer();
        var assetRef;

        AssetFactory.create({
          troopId: data.troopId,
          cardId: data.cardId,
          boardId: data.boardId,
          chatId: data.chatId,
          memberId: data.memberId,
          createdByUserId: data.createdByUserId,
          mimeType: data.$file.type,
          fileName: data.$file.name
        })

        .then(function(ref) {
          assetRef = ref;

          return factory.create({
            troopId: data.troopId,
            chatId: data.chatId,
            memberId: data.memberId,
            assetId: assetRef.key
          })

        })
        .then(function(chatEntryRef) {

          assetRef.child('chatEntryId').set(chatEntryRef.key);

          deferred.resolve({
            assetRef: assetRef,
            chatEntryRef: chatEntryRef
          });
        })
        .catch(function(error) {

          deferred.reject(error);
        })


        return deferred.promise;

      },
      uploadAsset: function(data, cb) {

        var deferred = $q.defer();

        factory.addAsset(data)
          .then(function(resp) {

            var uploader = TroopApi.uploadFile({
              troopId: data.troopId,
              assetId: resp.assetRef.key,
              $file: data.$file
            });

            deferred.resolve({
              chatEntryRef: resp.chatEntryRef,
              assetRef: resp.assetRef,
              uploader: uploader
            });
          })
          .catch(function(error) {

            deferred.reject(error);
          })

        return deferred.promise;
      }


    };

    return factory;
  }
