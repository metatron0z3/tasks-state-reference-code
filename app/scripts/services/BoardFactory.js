/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

/**
 * @ngdoc service
 * @name webClientApp.BoardFactory
 * @description
 * # BoardFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'BoardFactory',
    [
      '$rootScope',
      '$q',
      '$log',
      'Ref',
      'ChatFactory',
      'CardFactory',
      'CardListFactory',
      'BoardListFactory',
      'TroopMemberFactory',
      'AssetFactory',
      '$firebaseObject',
      '$firebaseArray',
      '$firebaseUtils',
      'x2js',
      'MIME_TYPES',
      'DEFAULT_VIEW_SETTINGS',
      'TroopLogger',
      function(
        $rootScope,
        $q,
        $log,
        Ref,
        ChatFactory,
        CardFactory,
        CardListFactory,
        BoardListFactory,
        TroopMemberFactory,
        AssetFactory,
        $firebaseObject,
        $firebaseArray,
        $firebaseUtils,
        x2js,
        MIME_TYPES,
        DEFAULT_VIEW_SETTINGS,
        TroopLogger
      ) {
        var logConfig = {
          slug: 'service: BoardFactory - ',
          path: [ 'services', 'BoardFactory.js']
        };

        var that = this;

        this.parseXmlFile = function(zipFile, dataFileName) {

          var rawXML = zipFile.file(dataFileName).asText();
          return x2js.xml_str2json(rawXML);
        };

        this.importMozartProject = function(options, cb) {
          var jsonObj = that.parseXmlFile(options.jsZipFile, 'project.xml');

          var members = {};
          members[options.troopMemberId] = true;

          var board = {
            boardName: jsonObj.project._name,
            troopId: options.troopId,
            createdByMemberId: options.troopMemberId,
            private: true,
            readOnly: true,
            members: members
          };


          var boardRef = thisFactory.create(
            board,
            function(error) {
              if (error) {
                that.onError(error);
                return false;
              }
            }
          );

          boardRef.once('value', function(snap) {

            board = snap.val();
            board['$id'] =  boardRef.key;

            // yay a list of cards
            var cards = jsonObj.project.cards;
            if (jsonObj.project.cards && jsonObj.project.cards.card) {

              if (_.isArray(jsonObj.project.cards.card)) {
                cards = jsonObj.project.cards.card;
              }
              else {
                // oh there's only 1 card
                cards = [ jsonObj.project.cards.card ];
              }

            }

            var cardOrderIndex = [];

            _.each(cards, function(card) {

              var order = 1;

              if (card.order) {
                order = card.order;
              }
              else if (cardOrderIndex.length > 1) {
                order = cardOrderIndex[0] + 1;
              }

              cardOrderIndex.push(order);

              var cardRef = CardFactory.create(
                {
                  order: order,
                  troopId: options.troopId,
                  board: board,
                  cardName: card._title,
                  description: card._body,
                  tagString: '',
                  createdByMemberId: options.troopMemberId,
                },
                function(error) {
                  if (error) {
                    that.onError(error);
                    return false;
                  }

                  var assets = null;

                  if (card.assets) {
                    assets = card.assets.asset;
                  }
                  else if (card.asset) {
                    assets = card.asset;
                  }

                  if (assets) {
                    var assetOrderIndex = [];

                    _.each(assets, function(asset) {

                      var filename = null;

                      if (_.isString(asset) ) {
                        filename = asset;

                      }
                      else {
                        filename = asset._file;

                      }

                      if (asset) {



                        var order = 1;

                        if (asset.order) {
                          order = asset.order;
                        }
                        else if (assetOrderIndex.length > 1) {
                          order = assetOrderIndex[0] + 1;
                        }

                        assetOrderIndex.push(order);

                        var ext = filename.split('.').pop();

                        var metaData;

                        if (asset.metaData) {
                          metaData = asset.metaData;
                        }
                        else {

                          metaData = {};

                          if (asset.caption) {
                            metaData.videoIframe = asset.caption;
                          }

                        }



                        var assetRef = CardFactory.uploadAsset(
                          {
                            $file: new File(
                              [options.jsZipFile.file(filename).asArrayBuffer()],
                              filename,
                              {
                                type: MIME_TYPES[ext] || 'text/plain'
                              }
                            ),
                            troopId: options.troopId,
                            cardId: cardRef.key,
                            order: order,
                            mimeType: asset.mimeType || MIME_TYPES[ext] || 'text/plain',
                            fileName: asset.fileName || filename || null,
                            metaData: metaData || null,
                            createdByUserId: options.troopMemberId,
                            uid: options.uid,
                            token: options.token

                          },
                          function() {

                          }
                        );

                        $rootScope.$broadcast('asset-upload-start', assetRef);

                      }

                    });
                  }

                }
              );

            });

            board.cards = cards;
            cb(board);
          });



        };

        this.importTroopBoard = function(options, cb) {

          var deferred = $q.defer();
          var text = options.jsZipFile.file('board.json').asText();
          var jsonObj = JSON.parse(text);
          var members = {};
          members[options.troopMemberId] = true;

          thisFactory.create({
            boardName: jsonObj.board.boardName,
            description: jsonObj.board.description,
            troopId: options.troopId,
            tagNames: jsonObj.board.tagNames,
            createdByMemberId: options.troopMemberId,
            private: true,
            readOnly: true,
            allowNotes: true,
            members: members,
            viewSettings: DEFAULT_VIEW_SETTINGS
          })
          .then(function(boardRef) {

            boardRef.once('value', function(snap) {

              var board = snap.val();
              board.$id = boardRef.key;

              var cardOrderIndex = [];

              _.each(jsonObj.cards, function (card) {

                var order = 1;

                if (card.order) {
                  order = card.order;
                }
                else if (cardOrderIndex.length > 1) {
                  order = cardOrderIndex[0] + 1;
                }

                cardOrderIndex.push(order);

                CardFactory.create({
                  troopId: options.troopId,
                  board: board,
                  order: order,
                  cardName: card.cardName,
                  description: card.description,
                  tags: card.tags,
                  createdByMemberId: options.troopMemberId
                })
                .then(function (cardRef) {

                  that.cardRef = cardRef;

                  var assets = null;

                  if (card.assets) {

                    assets = card.assets;
                  }
                  else if (card.asset) {

                    assets = card.asset;
                  }
                  if (assets) {

                    var assetOrderIndex = [];

                    _.each(assets, function (existingOrder, assetId) {

                      var asset = jsonObj.assets[assetId];

                      var filename = null;

                      if (_.isString(asset)) {

                        filename = asset;
                      }
                      else {

                        filename = assetId + '_original_' + asset.fileName;
                      }

                      var reg = new RegExp('^' + assetId);

                      if (asset) {

                        var order = 1;

                        if (asset.order) {
                          order = asset.order;
                        }
                        else if (existingOrder >= 0) {
                          order = existingOrder;
                        }
                        else if (assetOrderIndex.length > 1) {
                          order = assetOrderIndex[0] + 1;
                        }

                        assetOrderIndex.push(order);

                        var ext = filename.split('.').pop();

                        var metaData;

                        if (asset.metaData) {
                          metaData = asset.metaData;
                        }
                        else {

                          metaData = {};

                          if (asset.caption) {
                            metaData.videoIframe = asset.caption;
                          }

                        }

                        CardFactory.uploadAsset({
                          $file: new File(
                              [options.jsZipFile.file(reg)[0].asArrayBuffer()],
                              filename, {
                                type: MIME_TYPES[ext] || 'text/plain'
                              }
                          ),
                          troopId: options.troopId,
                          cardId: cardRef.key,
                          boardId: board.$id,
                          order: order,
                          mimeType: asset.mimeType || MIME_TYPES[ext] || 'text/plain',
                          fileName: asset.fileName || filename || null,
                          metaData: metaData || null,
                          createdByUserId: options.createdByUserId
                        })
                        .then(function(resp) {

                          $rootScope.$broadcast('asset-upload-start', resp.assetRef);
                        })
                        .catch(function(error) {

                          console.log(error);
                        });

                      }
                    });
                  }
                });

              });

              board.cards = jsonObj.cards;
              deferred.resolve(board);

            });
          })
          .catch(function (error) {

            console.log(error);
          });

          return deferred.promise;

        };

        var thisFactory = {

          getFirstVisibleView: getFirstVisibleView,

          getFirebaseObjectByKey: function(troopId, boardId) {

            if ( ! troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID' });
            }
            else if ( ! boardId ) {
              return $q.reject({ code: 'MISSING_BOARD_ID' });
            }

            return new $firebaseObject.$extend({
              viewMap: {
                card: 'cards',
                tag: 'tags',
                chat: 'chat',
                list: 'table',
                grid: 'grid',
                document: 'document'
              },
              $loaded: function(resolve, reject) {
                var promise = this.$$conf.sync.ready();

                var that = this;
                that.troopId = troopId;

                promise.then(function() {

                  // TroopLogger.debug(logConfig, 'BoardFirebaseObject.$loaded()', $.extend({}, that));

                //   // legacy support, check for view settings and set if not found
                //   if ( ! that.viewSettings ) {
                //
                //     TroopLogger.debug(logConfig, 'Missing viewSettings', $.extend({}, that));
                //     that.viewSettings = DEFAULT_VIEW_SETTINGS;
                //
                //     // check for legacy layout prop and map to card.imageSize
                //     if ( that.layout ) {
                //       that.viewSettings.card.imageSize = that.layout;
                //       delete that.layout;
                //     }
                //
                //     that.$save();
                //   }
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

                TroopLogger.debug(logConfig, 'BoardFirebaseObject.$save()');
                var self = this;
                var ref = self.$ref();
                var data = $firebaseUtils.toJSON(self);

                delete data.troopId;
                // delete data.chatId;
                delete data.orderedTagNames;

                data.updatedAt = firebase.database.ServerValue.TIMESTAMP;

                return $firebaseUtils.doSet(ref, data).then(function() {

                  self.$$notify();
                  return self.$ref();

                });
              },
              $$error: function (err) {
                TroopLogger.error(this.$ref().toString(), $.extend({}, err));
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
              getFirstVisibleView: function() {

                return getFirstVisibleView(this.viewSettings);
              }
            })(
              Ref.child('boards')
                .child(troopId)
                .child(boardId)
            );
          },

          create: function(data) {
            TroopLogger.debug(logConfig, 'create()');
            if ( ! data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID' });
            }

            var deferred = $q.defer();

            var members = {};
            members[data.createdByMemberId] = true;

            var boardRef = Ref.child('boards').child(data.troopId).push(
              {
                boardName: data.boardName,
                createdByMemberId: data.createdByMemberId,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                private: !! data.private,
                readOnly: !! data.readOnly,
                allowNotes: !! data.allowNotes,
                description: data.description || null,
                chatId: data.chatId || null,
                tagNames: data.tagNames || null,
                viewSettings: data.viewSettings,
                members: members
              },
              function(error) {

                if (error) {
                  deferred.reject(error);
                  return false;
                }

                TroopLogger.debug(logConfig, 'create() - board created');

                var boardId = boardRef.key;

                Ref.child('members')
                  .child(data.troopId)
                  .child(data.createdByMemberId)
                  .child('boards')
                  .once('value', function(snap) {

                    TroopLogger.debug(logConfig, 'create() - adding board to member');

                    var payload;

                    if (snap.exists()) {

                      var order = 1;

                      var boards = snap.val();

                      _.each(boards, function(board) {

                        order = Math.max(order, board.order || -Infinity);

                      });

                      order = order + 1;

                      payload = {
                        order: order,
                        permission: 'admin'
                      };

                    }
                    else {


                      payload = {
                        order: 1,
                        permission: 'admin'
                      };
                    }

                    Ref.child('members')
                      .child(data.troopId)
                      .child(data.createdByMemberId)
                      .child('updatedAt')
                      .set(firebase.database.ServerValue.TIMESTAMP)
                      .then(function(){
                        Ref.child('members')
                          .child(data.troopId)
                          .child(data.createdByMemberId)
                          .child('boards')
                          .child(boardId)
                          .set(payload, function() {
                            TroopLogger.debug(logConfig, 'create() - board added');

                            TroopLogger.debug(logConfig, 'create() - adding chat');
                            var members = {};
                            members[data.createdByMemberId] = true;
                            ChatFactory.create({
                              troopId: data.troopId,
                              boardId: boardId,
                              totalChatEntries: 0,
                              members: members,
                              createdAt: firebase.database.ServerValue.TIMESTAMP,
                              updatedAt: firebase.database.ServerValue.TIMESTAMP
                            })
                            .then(function(chatRef) {
                              TroopLogger.debug(logConfig, 'create() - chat added');

                              deferred.resolve(boardRef);
                            })
                            .catch(function(error) {

                              deferred.reject(error);
                            });

                          });
                      })

                  });



              }
            );

            return deferred.promise;
          },

          update: function(data) {

            var deferred = $q.defer();

            var payload = {
              updatedAt: firebase.database.ServerValue.TIMESTAMP,
              viewSettings: data.board.viewSettings
            };

            if ( data.board.hasOwnProperty('chatId') ) {
              payload.chatId = data.board.chatId;
            }
            if ( data.board.hasOwnProperty('boardName') ) {
              payload.boardName = data.board.boardName;
            }
            if ( data.board.hasOwnProperty('description') ) {
              payload.description = data.board.description;
            }
            if ( data.board.hasOwnProperty('private') ) {
              payload.private = data.board.private;
            }
            if ( data.board.hasOwnProperty('readOnly') ) {
              payload.readOnly = data.board.readOnly;
            }
            if ( data.board.hasOwnProperty('allowNotes') ) {
              payload.allowNotes = data.board.allowNotes;
            }
            if ( data.board.hasOwnProperty('tagNames') ) {
              payload.tagNames = data.board.tagNames;
            }

            Ref.child('boards')
              .child(data.board.troopId)
              .child(data.board.$id)
              .update(
                payload,
                function(error) {

                  if ( error ) {

                    deferred.reject(error);
                    return false;
                  }

                  deferred.resolve();
                }
              );

            return deferred.promise;
          },

          archive: function(board) {

            var deferred = $q.defer();

            //var troopId = board.troopId;
            // soft delete, archive board
            Ref.child('boards')
              .child(board.troopId)
              .child(board.$id)
              .child('archived')
              .set( true, function(error) {

                if (error) {
                  deferred.reject(error);
                  return false;
                }


                archiveCards(board)
                .then(function() {
                  return removeBoardInvites(board);
                })
                // .then(function() {
                //   return removeBoardMembership(board);
                // })
                .then(function(){
                  deferred.resolve();
                })

              });


            return deferred.promise;

          },

          getAssets: function(troopId, boardId) {

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
                console.log('BoardFactory', this.$ref().toString(), $.extend({}, err))
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('assets')
                .child(troopId)
                .orderByChild('boardId')
                .equalTo(boardId)
            );
          },

          getCards: function(troopId, boardId) {

            return new CardListFactory(
              Ref.child('cards')
                .child(troopId)
                .orderByChild('boardId')
                .equalTo(boardId)
            );
          },

          getBoards: function(troopId) {

            return new BoardListFactory(
              Ref.child('boards')
               .child(troopId)
            );
          },

          importBoard: function(options) {

            if (options.jsZipFile.file('board.json')) {
              return that.importTroopBoard(options);
            }
            else if (options.jsZipFile.file('project.xml')) {
              return that.importMozartProject(options);
            }

          },

          joinBoard: function(options, cb) {

            var deferred = $q.defer();
            var sortedBoards = _.sortBy(options.troopMember.boards, 'order').reverse();
            var order = sortedBoards[0] ? sortedBoards[0].order + 1 : 1;

            // update member with board info
            Ref.child('members')
              .child(options.troopMember.troopId)
              .child(options.troopMember.$id)
              .child('boards')
              .child(options.boardId)
              .set(
                {
                  order: order,
                  permission: options.permission
                },
                function(error) {

                  if ( error ) {
                    deferred.reject(error);
                    return false;
                  }

                  // update board with memberId
                  Ref.child('boards')
                    .child(options.troopMember.troopId)
                    .child(options.boardId)
                    .child('members')
                    .child(options.troopMember.$id)
                    .set(true);

                  // add member to board chat list
                  Ref.child('boards')
                    .child(options.troopMember.troopId)
                    .child(options.boardId)
                    .once('value', function(boardSnap) {

                      var board = boardSnap.val();
                      board.$id = boardSnap.ref;
                      board.troopId = options.troopMember.troopId;

                      if (board.chatId) {

                        Ref.child('chats')
                          .child(board.troopId)
                          .child(board.chatId)
                          .child('members')
                          .child(options.troopMember.$id)
                          .set(true, function(error) {

                            if ( error ) {
                              deferred.reject(error);
                            }
                            else {
                              deferred.resolve();
                            }
                          });
                      }
                      else {
                        deferred.resolve();
                      }
                    });
                }
              );
            return deferred.resolve();
          },

          leaveBoard: function(options) {

            var deferred = $q.defer();

            TroopLogger.debug(logConfig, "BoardFactory - leaveBoard()", options)

            removeMembersBoardChats(options.board, options.troopMember.$id)
            .then(function() {
              return removeMemberFromBoard(options.board, options.troopMember.$id)
            })
            .then(function() {
              return removeBoardFromMember(options.board, options.troopMember.$id)
            })
            .then(function() {
              deferred.resolve();
            })

            return deferred.promise;
          },

          adminCount: function(troopMembers, boardId) {
            var adminCount = 0;

            _.each(troopMembers, function(troopMember) {

              if (
                troopMember.boards
                && troopMember.boards.hasOwnProperty(boardId)
                && troopMember.boards[boardId].permission === 'admin'
              ) {
                adminCount++;
              }

            });

            return adminCount;
          },

          createDefault: function(options) {

            TroopLogger.debug(logConfig, 'crateDefault() in boardfactory - args-passed: ', options)

            var members = {};
            members[options.troopMemberId] = true;

            return thisFactory.create({
              boardName: 'General',
              viewSettings: DEFAULT_VIEW_SETTINGS,
              troopId: options.troopId,
              createdByMemberId: options.troopMemberId,
              private: false,
              readOnly: false,
              allowNotes: true,
              members: members
            });

          }
        };

        return thisFactory;

        function getFirstVisibleView(viewSettings) {

          var orderedViews = ['card', 'tag', 'chat', 'list', 'grid', 'document'];
          var firstVisibleView = null;

          $.each(orderedViews, function(index, view) {

            if ( viewSettings[view].visible ) {

              firstVisibleView = view;
              return false;
            }
          });
          TroopLogger.debug(logConfig, 'getFirstVisibleView viewSettings',viewSettings, 'firstVisibleView',firstVisibleView);
          return firstVisibleView;
        }

        function removeBoardMembership(board) {
          var deferred = $q.defer();
          // remove board from member's list
          Ref.child('members')
             .child(board.troopId)
             .once('value', function(memberSnapArray) {
               memberSnapArray.forEach(function(memberSnap) {

                 var member = memberSnap.val();
                 member.$id = memberSnap.key;
                 member.troopId = board.troopId;
                 if (
                   member.boards
                   && member.boards[board.$id]
                    ) {
                   TroopMemberFactory.removeFromBoard({
                     troopId: member.troopId,
                     memberId: member.$id,
                     boardId: board.$id
                   })
                 }
               });
               deferred.resolve();
             });
             return deferred.promise;
        }

        function removeMemberFromBoard(board, troopMemberId) {
          var deferred = $q.defer()

          Ref.child('boards')
            .child(board.troopId)
            .child(board.$id)
            .child('members')
            .child(troopMemberId)
            .remove( function(error){
              if (error) {
                TroopLogger.debug(logConfig, 'removeMemberFromBoard - error', error)
                deferred.reject({ code: 'COULD_NOT_REMOVE_BOARD_FROM_MEMBER' })
              }
              else {
                deferred.resolve();
              }
            });

          return deferred.promise;
        }

        function removeBoardFromMember(board, troopMemberId) {
          var deferred = $q.defer()

          Ref.child('members')
            .child(board.troopId)
            .child(troopMemberId)
            .child('boards')
            .child(board.$id)
            .remove( function(error){
              if (error) {
                TroopLogger.debug(logConfig('removeBoardFromMember - error', error))
                deferred.reject({ code: 'COULD_NOT_REMOVE_MEMBER_FROM_BOARD' })
              }
              else {
                deferred.resolve();
              }
            });

          return deferred.promise;
        }

        function removeMembersBoardChats(board, troopMemberId) {
          var deferred = $q.defer();

          // remove member from board chat list

          if (board.chatId) {
            Ref.child('chats')
              .child(board.troopId)
              .child(board.chatId)
              .child('members')
              .child(troopMemberId)
              .remove();

            deferred.resolve();
          }

          return deferred.promise;
        }

        function archiveCards(board) {
          var deferred = $q.defer();
          // archive all cards in the board,
          // which will take care of archiving the card assets as well
          Ref.child('cards')
             .child(board.troopId)
             .once('value', function(cardSnapArray) {
               cardSnapArray.forEach(function(cardSnap) {

                var card = cardSnap.val();
                card.$id = cardSnap.key;
                card.troopId = board.troopId;
                if (card.boardId === board.$id){
                  CardFactory.archive(card);
                }
               });
               deferred.resolve();
             });

          return deferred.promise;
        }

        function removeBoardInvites(board) {
          var deferred = $q.defer();

          // remove board invites
          Ref.child('boardInvites')
             .child(board.troopId)
             .once('value', function(inviteSnapArray) {

               inviteSnapArray.forEach(function(inviteSnap) {

                 var invite = inviteSnap.val();
                 invite.$id = inviteSnap.key;
                 invite.troopId = board.troopId;

                 if (invite.boardId === board.$id) {
                   Ref.child('boardInvites')
                      .child(invite.troopId)
                      .child(invite.$id)
                      .remove();
                 }
               })
               deferred.resolve();
             })

          return deferred.promise;
        }

      }
    ]
  );
