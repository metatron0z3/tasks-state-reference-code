/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

'use strict';

/**
 * @ngdoc service
 * @name webClientApp.ChatFactory
 * @description
 * # ChatFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'ChatFactory',
    [
      'Ref',
      '$q',
      '$firebaseObject',
      '$firebaseArray',
      '$firebaseUtils',
      'agLogger',
      'TroopLogger',
      function(
        Ref,
        $q,
        $firebaseObject,
        $firebaseArray,
        $firebaseUtils,
        agLogger,
        TroopLogger
      ) {

        var logConfig = {
          slug: 'service: ChatFactory.js - ',
          path: [ 'services', 'ChatFactory.js']
        };


        var that = this;

        var factory = {

          getFirebaseObjectByKey: function(troopId, chatId) {

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
                TroopLogger.error(logConfig, 'ChatFactory', this.$ref().toString(), $.extend({}, err))
                // prints an error to the console (via Angular's logger)
                // $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('chats')
                .child(troopId)
                .child(chatId)
            );
          },

          create: function(data) {

            TroopLogger.debug(logConfig, 'Chat Factory - create chats ref')

            if ( ! data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID' });
            }

            var deferred = $q.defer();

            var chatRef = Ref.child('chats').child(data.troopId).push(
              {
                boardId: data.boardId || null,
                cardId: data.cardId || null,
                memberId: data.memberId || null,
                totalChatEntries: 0,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                createdAt: firebase.database.ServerValue.TIMESTAMP
              },
              function(error) {

                if (error) {
                  deferred.reject(error);
                  return false;
                }

                var chatId = chatRef.key;

                if (data.cardId) {
                  // update card with chatId
                  Ref.child('cards')
                    .child(data.troopId)
                    .child(data.cardId)
                    .child('chatId')
                    .set(chatId);

                    Ref.child('cards')
                      .child(data.troopId)
                      .child(data.cardId)
                      .once('value', function(cardSnap) {

                        var card = cardSnap.val();
                        card.$id = cardSnap.key;

                        // check to see if creator still member of board before adding to chat.members
                        Ref.child('boards')
                          .child(data.troopId)
                          .child(data.boardId)
                          .child('members')
                          .child(card.createdByMemberId)
                          .once('value', function(snap) {

                             if (snap.exists()) {
                               // they are a member of this board
                               var members = {};
                               members[card.createdByMemberId] = true;

                               chatRef.child('members').set(members);
                             }

                           });

                      });
                }
                else if (data.boardId) {

                  // update board with chatId
                  Ref.child('boards')
                    .child(data.troopId)
                    .child(data.boardId)
                    .child('chatId')
                    .set(chatId);

                  // update chat with all board member ids
                  Ref.child('boards')
                    .child(data.troopId)
                    .child(data.boardId)
                    .once('value', function(boardSnap) {

                    var board = boardSnap.val();
                    board.$id = boardSnap.key;

                    var members = {};
                    _.each(board.members, function(val, memberId) {
                      members[memberId] = false;
                    });

                    chatRef.child('members').set(members);
                  });

                }
                else if (data.memberId && data.talkingToTroopMemberId) {

                  Ref.child('members')
                    .child(data.troopId)
                    .child(data.memberId)
                    .child('memberChats')
                    .child(data.talkingToTroopMemberId)
                    .set(chatId);

                  Ref.child('members')
                    .child(data.troopId)
                    .child(data.talkingToTroopMemberId)
                    .child('memberChats')
                    .child(data.memberId)
                    .set(chatId);

                  var members = {};
                  members[data.memberId] = true;
                  members[data.talkingToTroopMemberId] = true;

                  chatRef.child('members').set(members);
                }

                deferred.resolve(chatRef);

              }
            );

            return deferred.promise;
          },

          update: function(data) {



          },

          delete: function(board) {


          },
          getAssets: function(troopId, chatId) {

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
                TroopLogger.error(logConfig, 'ChatFactory', this.$ref().toString(), $.extend({}, err));
                // prints an error to the console (via Angular's logger)
                // $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('assets')
                .child(troopId)
                .orderByChild('chatId')
                .equalTo(chatId)
            );
          }


        };

        return factory;
      }
    ]
  );
