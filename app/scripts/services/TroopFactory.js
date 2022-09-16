/* global Firebase */
/* jshint -W098 */
'use strict';

/**
 * @ngdoc service
 * @name webClientApp.TroopFactory
 * @description
 * # TroopFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
  'TroopFactory',
  [
    '$q',
    '$log',
    'Ref',
    'BoardFactory',
    'TroopApi',
    'TroopLogger',
    'TroopFirebaseObject',
    '$firebaseObject',
    '$firebaseArray',
    '$firebaseUtils',
    function(
      $q,
      $log,
      Ref,
      BoardFactory,
      TroopApi,
      TroopLogger,
      TroopFirebaseObject,
      $firebaseObject,
      $firebaseArray,
      $firebaseUtils
    ) {

      var logConfig = {
        slug: 'service: TroopFactory - ',
        path: [ 'services', 'TroopFactory.js']
      };

      function dischargeAllMembers(troop, troopMembers) {
        var deferred = $q.defer();
        //loop through the troop members and discharge everyone

        function dischargeEach(troopMembers) {
          return $q.all(_.map(troopMembers, function(troopMember) {
            TroopApi.removeFromTroop({
              uid: troopMember.userId,
              memberId: troopMember.$id,
              troopId: troopMember.troopId,
              troopPermission: 'discharged'
            })
            .catch(function(error) {

              // agLogger.error('TroopApi.removeFromTroop', error);
              return $q.reject({ code: 'leaving troop did not work' });

            })
          }))
        }

          dischargeEach(troopMembers)
          .then(function() {
            deferred.resolve();
          })

        return deferred.promise;
      }

      function removeAllChats(troop) {
        var deferred = $q.defer();

        var chatRef = Ref.child('chats').child(troop.$id)
        var entriesRef = Ref.child('chatEntries').child(troop.$id)

        chatRef.once("value", function(snapshot) {
          if (snapshot.exists()) {
              chatRef
               .once('value', function(snap) {
                 snap.forEach(function(chatSnap) {
                   var chatId = chatSnap.key;
                   chatRef
                   .child(chatId)
                   .child('archived')
                   .set( true, function(error) {

                     if (error) {
                       deferred.reject(error);
                       return false;
                     }
                   })
                 })
               })

            entriesRef
              .once('value', function(snap) {
                snap.forEach(function(entrySnap) {
                  var entryId = entrySnap.key;
                  entriesRef
                  .child(entryId)
                  .child('archived')
                  .set( true, function(error) {

                    if (error) {
                      deferred.reject(error);
                      return false;
                    }
                  })
                })
              })

            deferred.resolve();
          }
          else{
            TroopLogger.debug(logConfig, 'Troop Factory - no chats to delete, moving on')
            deferred.resolve();
          }
        })

        return deferred.promise;
      }

      function deleteSlugAndPrivatize(troop) {
        var deferred = $q.defer();
        // delete the slug, if any
        // turn the troop private if needed
        Ref.child('troops')
          .child(troop.$id)
          .child('public')
          .once('value', function(publicVal) {
            if (publicVal && publicVal.val() === true) {
              return TroopApi.makeTroopPrivate({
                troopId: troop.$id
              });
            }
            else {
              return;
            }
          })

      }

      function removeTroopInvites(troop) {
        var deferred = $q.defer();

        var users = [];
        // remove troop invites
        Ref.child('troopInvites')
           .child(troop.$id)
           .once('value', function(inviteSnapArray) {

             inviteSnapArray.forEach(function(inviteSnap) {

               var invite = inviteSnap.val();
               invite.$id = inviteSnap.key;
               invite.troopId = troop.troopId;
               users.push(invite.toUserId)
               Ref.child('troopInvites')
                  .child(invite.troopId)
                  .child(invite.$id)
                  .remove();

             })
           })

        _.each(users, function(user, index, list) {
          Ref.child(user)
             .child(troop.$id)
             .remove();
        })

        deferred.resolve();

        return deferred.promise;
      }

      function archiveBoards(troop) {
        var deferred = $q.defer();
        // archive all boards in the troop,
        // which will take care of archiving the cards
        // which will take care of archiving the assets


        var boardPromises = []
        Ref.child('boards')
           .child(troop.$id)
           .once('value', function(boardSnapArray) {

             boardSnapArray.forEach(function(boardSnap) {
              var boardDefer = $q.defer();
              var board = boardSnap.val();
              board.$id = boardSnap.key;
              board.troopId = troop.$id;
              BoardFactory.archive(board)
              .then(function() {
                boardDefer.resolve()
              })
              boardPromises.push(boardDefer.promise)
             });
           })
           $q.all(boardPromises)
           .then(function() {
             deferred.resolve()
           })

        return deferred.promise;
      }

      return {

        getFirebaseObjectByKey: function(troopId) {
          return new TroopFirebaseObject(Ref.child('troops/' + troopId));
        },
        getTroopIdFromSlug: function(slug) {

          var deferred = $q.defer();

          Ref.child('troops')
          .orderByChild('troopSlug')
          .equalTo(slug)
          .limitToFirst(1)
          .once('value', function(troopSnapArray) {

            if ( ! troopSnapArray.numChildren() ) {
              // no troop found
              deferred.reject({ code: 'TROOP_NOT_FOUND'});
              return false;
            }

            var troopId = null;
            // loop through all 1 troops ;)
            troopSnapArray.forEach(function(troopSnap) {

              if ( ! troopId ) {
                troopId = troopSnap.key;
              }
            });

            if ( troopId ) {
              deferred.resolve(troopId);
            }
            else {
              deferred.reject({ code: 'UNKNOWN_ERROR'});
            }
          });

          return deferred.promise;

        },
        create: function(data) {

          var deferred = $q.defer();

          var troopRef = Ref.child('troops').push(
            {
              troopName: data.troopName || null,
              createdByUserId: data.createdByUserId || null,
              description: data.description || null,
              logoAssetId: data.logoAssetId || null,
              updatedAt: firebase.database.ServerValue.TIMESTAMP,
              createdAt: firebase.database.ServerValue.TIMESTAMP,
              memberNames: data.memberNames || null,
              groupNames: data.groupNames || null
            },
            function(error) {

              if (error) {
                deferred.reject(error);
              }
              else {
                deferred.resolve(troopRef);
              }
            }
          );

          return deferred.promise;
        },
        archive: function(troop) {

          var deferred = $q.defer();

          TroopApi.archiveTroop({
            troopId: troop.$id
          })
          .then(function(resp){

            if ( resp === true ) {

              TroopLogger.debug(logConfig, 'Troop Archive - discharged all members, finished archiving');
              deferred.resolve();
            }
            else {

              deferred.reject(resp);
            }
          });

          return deferred.promise;

        },
        update: function(data) {

          var deferred = $q.defer();

          if ( ! data.troopName ) {
            deferred.reject(new Error('Missing Troop Name'));
            return;
          }

          Ref.child('troops')
          .child(data.troopId)
          .update(
            {
              troopName: data.troopName,
              updatedAt: firebase.database.ServerValue.TIMESTAMP
            },
            function(error) {

              if (error) {
                deferred.reject(error);

              }
              else {
                deferred.resolve();
              }

            }
          );

          return deferred.promise;
        },
        getMembers: function(troopId) {

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

                if (
                  rec.troopPermission !== 'discharged'
                  && rec.troopPermission !== 'banned' ) {

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
              if( angular.isObject(rec) && rec.troopPermission !== 'discharged' && rec.troopPermission !== 'banned') {
                // apply changes to the record
                changed = $firebaseUtils.updateRec(rec, snap);
                $firebaseUtils.applyDefaults(rec, this.$$defaults);
                rec.troopId = troopId;
              }
              return changed;
            },
            $$error: function (err) {
              console.log('TroopFactory', this.$ref().toString(), $.extend({}, err));
              // prints an error to the console (via Angular's logger)
              //$log.error(err);
              // frees memory and cancels any remaining listeners
              this.$destroy(err);
            }
          })(
            Ref.child('members')
               .child(troopId)
          );
        }


      };
    }
  ]
);
