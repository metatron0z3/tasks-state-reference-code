'use strict';

/**
 * @ngdoc service
 * @name webClientApp.NotificationFactory
 * @description
 * # NotificationFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'NotificationFactory',
    [
      '$q',
      'Ref',
      '$notification',
      'TROOP_ICON_URL',
      function(
        $q,
        Ref,
        $notification,
        TROOP_ICON_URL
      ) {

        var factory = {
          sendToBrowserNotification: function(notification) {

            if ( ! notification.fromMemberId ) {

              return false;
            }

            Ref.child('members')
              .child(notification.troopId)
              .child(notification.fromMemberId)
              .once('value', function(memberSnap) {

                if ( ! memberSnap.exists() ) {
                  return false;
                }

                var fromTroopMember = memberSnap.val();



                if ( ! fromTroopMember ) {
                  return false;
                }

                fromTroopMember.$id = memberSnap.key;

                factory.getMessage(notification)
                .then(function(resp) {

                  $notification(
                    fromTroopMember.name,
                    {
                      body: resp.message.replace('<b>', '').replace('</b>', ''),
                      dir: 'auto',
                      lang: 'en',
                      //tag: 'my-tag',
                      icon: TROOP_ICON_URL,
                      delay: 5000, // in ms
                      focusWindowOnClick: true // focus the window on click
                    }
                  );

                })
                .catch(function(error) {
                  console.log(error);
                });

            })
          },
          getNewCardText: function(notification, deferred) {

            if ( ! notification.cardId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_CARD_ID' })
              return false;
            }


            Ref.child('cards')
              .child(notification.troopId)
              .child(notification.cardId)
              .once('value', function(cardSnap) {

                if ( ! cardSnap.exists() ) {
                  deferred.reject({ code: 'CARD_NOT_EXISTS'});
                  return false;
                }

                var card = cardSnap.val();

                if ( ! card ) {
                  deferred.reject({ code: 'CARD_EMPTY'});
                  return false;
                }
                else if ( ! card.boardId ) {
                  deferred.reject({ code: 'CARD_MISSING_BOARD_ID'});
                  return false;
                }
                else if ( card.archived ) {
                  deferred.reject({ code: 'CARD_ARCHIVED'});
                  return false;
                }


                card.$id = cardSnap.key;

                Ref.child('boards')
                  .child(notification.troopId)
                  .child(card.boardId)
                  .once('value', function(boardSnap) {

                    if ( ! boardSnap.exists() ) {
                      deferred.reject({ code: 'BOARD_NOT_EXISTS'});
                      return false;
                    }

                    var board = boardSnap.val();

                    if ( ! board ) {
                      deferred.reject({ code: 'BOARD_EMPTY'});
                      return false;
                    }
                    else if ( board.archived ) {
                      deferred.reject({ code: 'BOARD_ARCHIVED'});
                      return false;
                    }

                    board.$id = boardSnap.key;


                    deferred.resolve({ message: '<b>' + board.boardName + '</b>: Added a new card "' + card.cardName + '"' });

                  });


              });





          },
          getNewBoardText: function(notification, deferred) {

            if ( ! notification.boardId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_BOARD_ID' })
              return false;
            }

            Ref.child('boards')
              .child(notification.troopId)
              .child(notification.boardId)
              .once('value', function(boardSnap) {

                if ( ! boardSnap.exists() ) {
                  deferred.reject({ code: 'BOARD_NOT_EXISTS'});
                  return false;
                }

                var board = boardSnap.val();

                if ( ! board ) {
                  deferred.reject({ code: 'BOARD_EMPTY'});
                  return false;
                }

                board.$id = boardSnap.key;


                deferred.resolve({ message: 'Created a new board <b>' + board.boardName + '</b>.' });

              });

          },
          getNewNoteText: function(notification, deferred) {

            if ( ! notification.noteId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_NOTE_ID' })
              return false;
            }

            var that = this;

            this.cardRef = Ref.child('cards')
              .child(notification.troopId)
              .child(notification.cardId);


            this.cardRef.once('value', function(cardSnap) {

                if ( ! cardSnap.exists() ) {
                  deferred.reject({ code: 'CARD_NOT_EXISTS'});
                  return false;
                }

                var card = cardSnap.val();

                if ( ! card ) {
                  deferred.reject({ code: 'CARD_EMPTY'});
                  return false;
                }

                that.cardRef.child('notes')
                  .child(notification.noteId)
                  .once('value', function(noteSnap) {

                if ( ! noteSnap.exists() ) {
                  deferred.reject({ code: 'NOTE_NOT_EXISTS'});
                  return false;
                }

                var note = noteSnap.val();

                if ( ! note ) {
                  deferred.reject({ code: 'NOTE_EMPTY'});
                  return false;
                }

                note.$id = noteSnap.key;


                deferred.resolve({ message: 'Posted a new note <b>' + note.text.truncateOnWord(140) + '</b> on a card '+card.cardName+'.' });

              });
            });
          },
          getBoardMessageText: function(notification, deferred) {

            if ( ! notification.chatEntryId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_CHAT_ENTRY_ID' })
              return false;
            }


            Ref.child('chatEntries')
              .child(notification.troopId)
              .child(notification.chatEntryId)
              .once('value', function(chatEntrySnap) {

                if ( ! chatEntrySnap.exists() ) {
                  deferred.reject({ code: 'CHAT_ENTRY_NOT_EXISTS'});
                  return false;
                }

                var chatEntry = chatEntrySnap.val();

                if ( ! chatEntry ) {
                  deferred.reject({ code: 'CHAT_ENTRY_EMPTY'});
                  return false;
                }

                chatEntry.$id = chatEntrySnap.key;

                Ref.child('chats')
                  .child(notification.troopId)
                  .child(chatEntry.chatId)
                  .once('value', function(chatSnap) {

                    if ( ! chatSnap.exists() ) {
                      deferred.reject({ code: 'CHAT_NOT_EXISTS'});
                      return false;
                    }

                    var chat = chatSnap.val();

                    if ( ! chat ) {
                      deferred.reject({ code: 'CHAT_EMPTY'});
                      return false;
                    }

                    chat.$id = chatSnap.key;

                    Ref.child('boards')
                      .child(notification.troopId)
                      .child(chat.boardId)
                      .once('value', function(boardSnap) {

                        if ( ! boardSnap.exists() ) {
                          deferred.reject({ code: 'BOARD_NOT_EXISTS'});
                          return false;
                        }

                        var board = boardSnap.val();

                        if ( ! board ) {
                          deferred.reject({ code: 'BOARD_EMPTY'});
                          return false;
                        }

                        board.$id = boardSnap.key;

                        var message;

                        if (chatEntry.assetId) {
                          message = '<b>' + board.boardName + '</b>: Added a file.';
                        }
                        else {
                          var text = chatEntry.text;

                          if (text.length > 100) {
                            text = text.substr(0, 100) + '...';
                          }

                          message = '<b>' + board.boardName + '</b>: "' + text + '"';
                        }

                        deferred.resolve({ message: message });

                      });

                  });





              });

          },
          getCardCommentText: function(notification, deferred) {

            if ( ! notification.chatEntryId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_CHAT_ENTRY_ID' })
              return false;
            }

            Ref.child('chatEntries')
              .child(notification.troopId)
              .child(notification.chatEntryId)
              .once('value', function(chatEntrySnap) {

                if ( ! chatEntrySnap.exists() ) {
                  deferred.reject({ code: 'CHAT_ENTRY_NOT_EXISTS'});
                  return false;
                }

                var chatEntry = chatEntrySnap.val();

                if ( ! chatEntry ) {
                  deferred.reject({ code: 'CHAT_ENTRY_EMPTY'});
                  return false;
                }
                else if ( ! chatEntry.chatId ) {
                  deferred.reject({
                    code: 'CHAT_ENTRY_MISSING_CHAT_ID',
                    chatEntry: chatEntry
                  });
                  return false;
                }

                chatEntry.$id = chatEntrySnap.key;

                Ref.child('chats')
                  .child(notification.troopId)
                  .child(chatEntry.chatId)
                  .once('value', function(chatSnap) {

                    var chat = chatSnap.val();

                    if ( ! chat ) {
                      deferred.reject({ code: 'CHAT_EMPTY'});
                      return false;
                    }
                    else if ( ! chat.cardId ) {
                      deferred.reject({ code: 'CHAT_MISSING_CARD_ID'});
                      return false;
                    }

                    chat.$id = chatSnap.key;

                    Ref.child('cards')
                      .child(notification.troopId)
                      .child(chat.cardId)
                      .once('value', function(cardSnap) {

                        var card = cardSnap.val();

                        if ( ! card ) {
                          deferred.reject({ code: 'CARD_EMPTY'});
                          return false;
                        }
                        else if ( ! card.boardId ) {
                          deferred.reject({ code: 'CARD_MISSING_BOARD_ID'});
                          return false;
                        }

                        card.$id = cardSnap.key;

                        Ref.child('boards')
                          .child(notification.troopId)
                          .child(card.boardId)
                          .once('value', function(boardSnap) {

                            if ( ! boardSnap.exists() ) {
                              deferred.reject({ code: 'BOARD_NOT_EXISTS'});
                              return false;
                            }

                            var board = boardSnap.val();

                            if ( ! board ) {
                              deferred.reject({ code: 'BOARD_EMPTY'});
                              return false;
                            }

                            board.$id = boardSnap.key;

                            deferred.resolve({
                              message: '<b>' + board.boardName + '</b>: Commented on the card "' + card.cardName + '"'
                            });

                          });
                      });
                  });
              });
          },
          getDirectMessageText: function(notification, deferred) {

            if ( ! notification.chatEntryId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_CHAT_ENTRY_ID' })
              return false;
            }

            Ref.child('chatEntries')
              .child(notification.troopId)
              .child(notification.chatEntryId)
              .once('value', function(chatEntrySnap) {

                if ( ! chatEntrySnap.exists() ) {
                  deferred.reject({ code: 'CHAT_ENTRY_NOT_EXISTS'});
                  return false;
                }

                var chatEntry = chatEntrySnap.val();

                if ( ! chatEntry ) {
                  deferred.reject({ code: 'CHAT_ENTRY_EMPTY'});
                  return false;
                }

                chatEntry.$id = chatEntrySnap.key;

                var message;

                if (chatEntry.assetId) {
                  message = 'Added a file.';
                }
                else {
                  var text = chatEntry.text;

                  if (text.length > 100) {
                    text = text.substr(0, 100) + '...';
                  }

                  message = text;
                }

                deferred.resolve({ message: message });

              });
          },
          getInviteToTroopText: function(notification, deferred) {

            if ( ! notification.troopId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_TROOP_ID' })
              return false;
            }

            Ref.child('troops')
              .child(notification.troopId)
              .once('value', function(troopSnap) {

                if ( ! troopSnap.exists() ) {
                  deferred.reject({ code: 'TROOP_NOT_EXISTS'});
                  return false;
                }

                var troop = troopSnap.val();

                if ( ! troop ) {
                  deferred.reject({ code: 'TROOP_EMPTY'});
                  return false;
                }

                troop.$id = troopSnap.key;

                deferred.resolve({ message: 'Invited you to join the troop <b>' + troop.troopName + '</b>' });

              });

          },
          getInviteToBoardText: function(notification, deferred) {

            if ( ! notification.troopId ) {
              deferred.reject({ code: 'NOTIFICATION_MISSING_TROOP_ID' })
              return false;
            }

            Ref.child('boards')
              .child(notification.troopId)
              .child(notification.boardId)
              .once('value', function(boardSnap) {

                if ( ! boardSnap.exists() ) {
                  deferred.reject({ code: 'BOARD_NOT_EXISTS'});
                  return false;
                }

                var board = boardSnap.val();

                if ( ! board ) {
                  deferred.reject({ code: 'BOARD_EMPTY'});
                  return false;
                }

                board.$id = boardSnap.key;

                deferred.resolve({ message: 'Invited you to join the board <b>' + board.boardName + '</b>' });

              });

          },
          getMessage: function(notification) {

            var deferred = $q.defer();

            if ( ! notification ) {

              deferred.reject({ code: 'NOTIFICATION_EMPTY' });
              return deferred.promise;
            }

            switch (notification.notificationType) {

              case 'newCard':
                factory.getNewCardText(notification, deferred);
                break;

              case 'newBoard':
                factory.getNewBoardText(notification, deferred);
                break;

              case 'newNote':
                factory.getNewNoteText(notification, deferred);
                break;

              case 'boardMessage':
                factory.getBoardMessageText(notification, deferred);
                break;

              case 'cardComment': // this got replaced by newNote
                factory.getCardCommentText(notification, deferred);
                break;

              case 'directMessage':
                factory.getDirectMessageText(notification, deferred);
                break;

              // case 'inviteToTroop':
              //   factory.getInviteToTroopText(notification, deferred);
              //   break;

              case 'inviteToBoard':
                factory.getInviteToBoardText(notification, deferred);
                break;
            }

            return deferred.promise;
          }

        };

        return factory;
      }
    ]
  );
