/* global Firebase, _, $ */
/* jshint -W098 */
/* jshint -W055 */
/* jshint -W014 */
/* jshint -W040 */

(function () {
  'use strict';

/**
 * @ngdoc service
 * @name webClientApp.NotificationFirebaseArray
 * @description
 * # NotificationFirebaseArray
 * Factory in the webClientApp.
 */
angular
  .module('webClientApp')
  .factory('NotificationFirebaseArray', NotificationFirebaseArray);

  NotificationFirebaseArray.$inject = [
    '$state',
    '$rootScope',
    '$firebaseObject',
    '$firebaseArray',
    '$firebaseUtils',
    '$localStorage',
    '$q',
    '$log',
    '$notification',
    'Ref',
    'NotificationFactory',
    'TroopFactory',
    'TroopMemberFactory',
    'BoardFactory',
    'CardFactory',
    'ChatEntryFactory',
    'TROOP_ICON_URL',
    'TroopApi',
    'agLogger',
    'TroopLogger'
  ];

  function NotificationFirebaseArray(
    $state,
    $rootScope,
    $firebaseObject,
    $firebaseArray,
    $firebaseUtils,
    $localStorage,
    $q,
    $log,
    $notification,
    Ref,
    NotificationFactory,
    TroopFactory,
    TroopMemberFactory,
    BoardFactory,
    CardFactory,
    ChatEntryFactory,
    TROOP_ICON_URL,
    TroopApi,
    agLogger,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'service: NotificationFirebaseArray - ',
      path: [ 'services', 'NotificationFirebaseArray.js']
    };

    NotificationList.prototype = {
      userId: null,
      troopId: null,
      troopMemberId: null,
      count: 250,
      breakdown: {},
      $firebaseArray: null,
      deferred: null,
      $loaded: function() {
        // var that = this;
        // this.deferred.promise.then(function() {
        //   console.log('troopId:', that.troopId, 'notification loaded exec');
        // })
        return this.deferred.promise;
      },
      $destroy: function() {

        this.$firebaseArray.$destroy();
        this.$troop.$destroy();
        this.$troopMember.$destroy();

        _.each(this.fromMembers, function(member, memberId) {
          member.$destroy();
        });

        _.each(this.boards, function(board, boardId) {
          board.$destroy();
        });

        _.each(this.cards, function(card, cardId) {
          card.$destroy();
        });

        _.each(this.notes, function(note, noteId) {
          note.$destroy();
        });

        _.each(this.chatEntries, function(chatEntry, chatEntryId) {
          chatEntry.$destroy();
        });

      }
    };

    return NotificationList;

    function NotificationList(options) {

      var vm = this;

      var $customFirebaseArray = $firebaseArray.$extend({
        $$added: notificationAdded,
        $$updated: notificationUpdated,
        $$removed: notificationRemoved,
        $$process: notificationProcess,
        $$error: notificationError,
        $save: notificationSave,
        _addAfter: addAfter
      });

      vm.deferred = $q.defer();
      vm.sortOrder = 'desc';
      vm.currentState = $state.current.name;
      vm.stateParams = $state.params;
      vm.userId = options.userId;
      vm.troopId = options.troopId;
      vm.troopMemberId = options.troopMemberId;
      vm.getCurrentTroop = options.getCurrentTroop;
      vm.$troopMember = null;
      vm.$firebaseArray = null;
      vm.fromMembers = {};
      vm.boards = {};
      vm.cards = {};
      vm.notes = {};
      vm.isRead = {};
      vm.chatEntries = {};
      vm.breakdown = {
        totalNotifications: 0,
        totalReadNotifications: 0,
        totalUnreadNotifications: 0,

        totalBoardMessageNotifications: 0,
        readBoardMessageNotifications: 0,
        unreadBoardMessageNotifications: 0,

        totalDirectMessageNotifications: 0,
        readDirectMessageNotifications: 0,
        unreadDirectMessageNotifications: 0,

        totalNonMessageNotifications: 0,
        readNonMessageNotifications: 0,
        unreadNonMessageNotifications: 0,

        nonMessage: {},
        boardMessage: {},
        directMessage: {},
      };

      if ( options.count ) {

        vm.count = options.count;
      }

      vm.unWatchFirebaseArray = null;
      vm.getMessage = getMessage;
      vm.markAllNotificationAsRead = markAllNotificationAsRead;
      vm.deleteAllNotifications = deleteAllNotifications;

      activate();

      //return;
      // I don't think this is nescessery
      //

      /** $firebaseArray extend **/
      function notificationAdded(snap, prevChild) {
        //console.log('$$added',snap.val());
        var added = false;

        // check to make sure record does not exist
        var i = this.$indexFor(snap.key);

        if ( i === -1 ) {
          // parse data and create record
          var notification = snap.val();
          if ( ! angular.isObject(notification) ) {

            notification = { $value: notification };
          }

          notification.$id = snap.key;
          notification.$priority = snap.getPriority();

          notification.ref = snap.ref;
          notification.troopId = vm.troopId;
          notification.userId = vm.userId;
          $firebaseUtils.applyDefaults(notification, this.$$defaults);
          vm.isRead[notification.$id] = notification.isRead;
          added = parseNotification(notification, 'added');
          // added = notification;
        }

        return added;
      }

      function notificationUpdated(snap) {

        var changed = false;
        var notification = vm.$firebaseArray.$getRecord(snap.key);

        if ( angular.isObject(notification) ) {

          var wasRead = vm.isRead[notification.$id]; //notification.isRead;

          // apply changes to the record
          changed = $firebaseUtils.updateRec(notification, snap);

          notification.ref = snap.ref;
          notification.troopId = vm.troopId;
          notification.userId = vm.userId;
          $firebaseUtils.applyDefaults(notification, vm.$firebaseArray.$$defaults);

          if (
             ( ! wasRead )   // wasn't read
             && notification.isRead // and now is
          ) {

            parseNotification(notification, 'updated');
          }

        }

        return changed;
      }

      function notificationRemoved(snap) {

        TroopLogger.debug(logConfig, 'notificationRemoved', this.$indexFor(snap.key), snap.key, [snap.val()]);
        updateNotificationCounts(snap.val(), 'removed');

        return this.$indexFor(snap.key) > -1;
      }

      function notificationProcess(event, rec, prevChild) {
        //console.log('$$process',event);
        var key = this.$$getKey(rec);
        var changed = false;
        var curPos;
        switch(event) {
          case 'child_added':
            curPos = this.$indexFor(key);
            break;
          case 'child_moved':
            curPos = this.$indexFor(key);
            this._spliceOut(key);
            break;
          case 'child_removed':
            TroopLogger.debug(logConfig, 'notificationProcess', event);
            // remove record from the array
            changed = this._spliceOut(key) !== null;
            break;
          case 'child_changed':
            changed = true;
            break;
          default:
            TroopLogger.error(logConfig,'Invalid event type: ' + event);
            //throw new Error('Invalid event type: ' + event);
        }
        if ( angular.isDefined(curPos) ) {

          changed = this._addAfter(rec, prevChild) !== curPos;
        }

        if ( changed ) {

          this.$list.sort(function sortDesc(a, b) {

            if (a.createdAt > b.createdAt) {
              return -1;
            }
            if (a.createdAt < b.createdAt) {
              return 1;
            }
            // a must be equal to b
            return 0;
          });


          var i;
          for (i = 0; i < this.$list.length; i++) {

            this._indexCache[this.$$getKey(this.$list[i])] = i;
          }

          // send notifications to anybody monitoring $watch
          this.$$notify(event, key, prevChild);
        }
        return changed;
      }

      function addAfter(rec, prevChild) {

        var i;
        if ( prevChild === null ) {
          i = 0;
        }
        else {
          i = this.$indexFor(prevChild) + 1;
          if ( i === 0 ) {
            i = this.$list.length;
          }
        }
        this.$list.splice(i, 0, rec);
        this._indexCache[this.$$getKey(rec)] = i;
        return i;
      }

      function notificationError(err) {
        // prints an error to the console (via Angular's logger)
        TroopLogger.error(logConfig, 'notificationError()', this.$ref().toString(), $.extend({}, err));
        // frees memory and cancels any remaining listeners
        this.$destroy(err);
      }

      function notificationSave(indexOrItem) {

        this._assertNotDestroyed('$save');
        var item = this._resolveItem(indexOrItem);
        var key = this.$keyAt(item);
        if ( key !== null ) {

          delete item.userId;
          delete item.troopId;
          delete item.ref;

          var ref = this.$ref().ref.child(key);
          var data = $firebaseUtils.toJSON(item);

          data.updatedAt = firebase.database.ServerValue.TIMESTAMP;

          return $firebaseUtils.doSet(ref, data).then(function() {

            vm.$firebaseArray.$$notify('child_changed', key);
            return ref;
          });
        }
        else {

          TroopLogger.debug(logConfig, 'Invalid record; could determine key for ' + indexOrItem);
          return $firebaseUtils.reject('Invalid record; could determine key for ' + indexOrItem);
        }
      }

      /** NotificationList **/
      function activate() {

        vm.$troop = TroopFactory.getFirebaseObjectByKey(vm.troopId);
        vm.$troopMember = TroopMemberFactory.getFirebaseObjectByKey(
          vm.troopId,
          vm.troopMemberId
        );

        vm.$firebaseArray = new $customFirebaseArray(
          Ref.child('notifications')
          .child(vm.userId)
          .child(vm.troopId)
          .orderByChild('createdAt')
          .limitToLast(vm.count)
        );

        vm.$firebaseArray.$loaded()
        .catch(function(error) {

          if ( error && error.code ) {

            switch(error.code) {

              case 'FILTERED_MESSAGE':
              TroopLogger.debug(logConfig,'$firebaseArray.$loaded', error);
              break;

              default:
              TroopLogger.error(logConfig,'$firebaseArray.$loaded', error);
              break;
            }
          }
          else {

            TroopLogger.error(logConfig,'$firebaseArray.$loaded', error);
          }
        })
        .finally(function waitForNotificationsToLoad() {
          //console.log('troopId', vm.troopId, ' NotificationFirebaseArray resolve()')
          //console.log('vm.$firebaseArray',vm.$firebaseArray);
          // array is loaded now resolve promise
          vm.deferred.resolve();

          vm.unWatchFirebaseArray = vm.$firebaseArray.$watch(function(event) {

            var notification = vm.$firebaseArray.$getRecord(event.key);
            if ( ! notification ) {
              return false;
            }

            var currentTroop = vm.getCurrentTroop();

            if (
              currentTroop
              && vm.$troop
              && ( currentTroop.$id === vm.$troop.$id  )
            ) {

              broadcastNotificationEvent(event, notification);
            }

          });
        });


        listenForStateChange();
      }

      function broadcastNotificationEvent(event, notification) {

        $rootScope.$broadcast('notification', {
          event: event,
          notification: notification
        });

      }

      function listenForStateChange() {

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

          vm.currentState = toState.name;

          var currentTroop = vm.getCurrentTroop();
          if (
            currentTroop
            && vm.$troop
            && ( currentTroop.$id === vm.$troop.$id  )
          ) {

            switch (toState.name) {

              case 'home.dashboard.board.chat':
                removeAllBoardChatNotifications(toParams.boardId);
                break;
              case 'home.dashboard.troopMember.chat':
                removeAllDirectChatNotifications(toParams.troopMemberId);
                break;
            }

          }
        });
      }

      function markAllNotificationAsRead() {

        _.each(vm.$firebaseArray, function(notification, notificationId) {

          if ( ! notification.isRead ) {

            notification.isRead = true;

            vm.$firebaseArray.$save(notification);
          }

        });
      }

      function deleteAllNotifications() {

        _.each(vm.$firebaseArray, function(notification, notificationId) {

          if (notification.notificationType === 'inviteToBoard') {

            TroopApi.acceptBoardInvite({
              memberId: vm.troopMemberId,
              boardId: notification.boardId,
              troopId: notification.troopId,
              inviteId: notification.inviteId,
              reject: true
            })
            .then(function() {

              return vm.$firebaseArray.$remove(notificationId);

            })
            .catch(function(error) {
              TroopLogger.error(logConfig, 'TroopApi.acceptBoardInvite()', error);
            });
          }

          else {

            vm.$firebaseArray.$remove(notificationId);
          }
        });
      }

      function removeAllBoardChatNotifications(boardId) {
        TroopLogger.debug(logConfig, 'removeAllBoardChatNotifications', boardId, vm.userId, vm.troopId);

        Ref.child('notifications')
        .child(vm.userId)
        .child(vm.troopId)
        .orderByChild('notificationType')
        .equalTo('boardMessage')
        .once('value', function(snapArray) {
          TroopLogger.debug(logConfig, 'snapArray', snapArray.val());

          snapArray.forEach(function(snap) {

            var notification = snap.val();
            TroopLogger.debug(logConfig, 'notification', notification,boardId)
            if (
              notification
              && notification.boardId === boardId
            ) {
              TroopLogger.debug(logConfig, 'remove', notification)
              snap.ref.remove();  // Not sure about this one

              vm.breakdown.totalBoardMessageNotifications--;
              vm.breakdown.totalNotifications--;

              // stop negative notification count
              if(vm.breakdown.totalBoardMessageNotifications < 0) {
                vm.breakdown.totalBoardMessageNotifications = 0;
              }

              if(vm.breakdown.totalNotifications < 0) {
                vm.breakdown.totalNotifications = 0;
              }
              // -----------

              if (notification.isRead) {

                vm.breakdown.readBoardMessageNotifications--;
                vm.breakdown.totalReadNotifications--;

                // stop negative notification count
                if(vm.breakdown.readBoardMessageNotifications < 0) {
                  vm.breakdown.readBoardMessageNotifications = 0;
                }

                if(vm.breakdown.totalReadNotifications < 0) {
                  vm.breakdown.totalReadNotifications = 0;
                }
                // -----------
              }
              else{

                vm.breakdown.unreadBoardMessageNotifications--;
                vm.breakdown.totalUnreadNotifications--;

                // stop negative notification count
                if(vm.breakdown.unreadBoardMessageNotifications < 0) {
                  vm.breakdown.unreadBoardMessageNotifications = 0;
                }

                if(vm.breakdown.totalUnreadNotifications < 0) {
                  vm.breakdown.totalUnreadNotifications = 0;
                }
                // -----------
              }
            }
          });

          vm.breakdown.boardMessage[boardId] = {
            read: 0,
            total: 0,
            unread: 0
          };
        });
      }

      function removeAllDirectChatNotifications(fromMemberId) {

        Ref.child('notifications')
        .child(vm.userId)
        .child(vm.troopId)
        .orderByChild('notificationType')
        .equalTo('directMessage')
        .once('value', function(snapArray) {

          snapArray.forEach(function(snap) {

            var notification = snap.val();

            if (
              notification
              && notification.fromMemberId === fromMemberId
            ) {
              TroopLogger.debug(logConfig, 'remove', notification);
              snap.ref.remove(); // Here too

              vm.breakdown.totalDirectMessageNotifications--;
              vm.breakdown.totalNotifications--;

              // stop negative notification count
              if(vm.breakdown.totalDirectMessageNotifications < 0) {
                vm.breakdown.totalDirectMessageNotifications = 0;
              }

              if(vm.breakdown.totalNotifications < 0) {
                vm.breakdown.totalNotifications = 0;
              }
              // -----------

              if (notification.isRead) {

                vm.breakdown.readDirectMessageNotifications--;
                vm.breakdown.totalReadNotifications--;

                // stop negative notification count
                if(vm.breakdown.readDirectMessageNotifications < 0) {
                  vm.breakdown.readDirectMessageNotifications = 0;
                }

                if(vm.breakdown.totalReadNotifications < 0) {
                  vm.breakdown.totalReadNotifications = 0;
                }
                // -----------
              }
              else{

                vm.breakdown.unreadDirectMessageNotifications--;
                vm.breakdown.totalUnreadNotifications--;

                // stop negative notification count
                if(vm.breakdown.unreadDirectMessageNotifications < 0) {
                  vm.breakdown.unreadDirectMessageNotifications = 0;
                }

                if(vm.breakdown.totalUnreadNotifications < 0) {
                  vm.breakdown.totalUnreadNotifications = 0;
                }
                // -----------
              }
            }
          });

          vm.breakdown.directMessage[fromMemberId] = {
            read: 0,
            total: 0,
            unread: 0
          };
        });
      }

      function parseNotification(notification, event) {

        var deferred = $q.defer();

        checkForDependencyData(notification)
        .then(function() {

          return checkCurrentState(notification);
        })
        .then(function notifyBrowser() {

          return sendBrowserNotification(notification);
        })
        .then(function count() {

          return updateNotificationCounts(notification, event);
        })
        .then(function cleanChats() {

          return filterOutChatTypes(notification);
        })
        .then(function processingFinished() {

          deferred.resolve(notification);
        })
        .catch(function(error) {

          // erronous notification, remove it
          // TODO flip this logic around
          // let's only remove the notification of exact circumstances
          //
          if ( error && error.code ) {

            switch (error.code) {

              case 'FILTERED_MESSAGE':
                TroopLogger.debug(logConfig,'parseNotification()', error, notification.$id, [notification]);
                break;

              default:
                TroopLogger.debug(logConfig, 'parseNotification() - removing notification', error, vm.$firebaseArray.$indexFor(notification.$id), notification.$id, [notification]);

                if ( vm.$firebaseArray.$indexFor(notification.$id) === -1 ) {
                  TroopLogger.info(logConfig, 'parseNotification() - notification.ref.remove()', error);

                  notification.ref.remove();
                }
                else {
                  TroopLogger.info(logConfig, 'parseNotification() - vm.$firebaseArray.$remove()', error);

                  vm.$firebaseArray.$remove(notification);
                }

                break;
            }
          }
          else {
            TroopLogger.error(logConfig, 'parseNotification()', error);
          }

          // deferred.reject(error);
          deferred.resolve(false);
        });

        return deferred.promise;
      }

      function checkCurrentState(notification) {
        TroopLogger.debug(logConfig, 'checkCurrentState');
        // TroopLogger.debug(logConfig, 'notification',notification);
        // TroopLogger.debug(logConfig, 'vm.currentState',vm.currentState);
        // TroopLogger.debug(logConfig, 'vm.stateParams',vm.stateParams);
        // TroopLogger.debug(logConfig, '$state',$state);

        var deferred = $q.defer();

        if (
          ( notification.notificationType === 'boardMessage' )
          && ( $state.current.name === 'home.dashboard.board.chat' )
          && ( $state.params.boardId === notification.boardId)
        ) {

          TroopLogger.debug(logConfig, 'reject  SKIP_COUNTING_BOARD_CHAT');
          deferred.reject({ code: 'SKIP_COUNTING_BOARD_CHAT' });
        }
        else if (
          ( notification.notificationType === 'directMessage' )
          && ( $state.current.name === 'home.dashboard.troopMember.chat' )
          && ( $state.params.troopMemberId === notification.fromMemberId)
        ) {

          TroopLogger.debug(logConfig, 'reject  SKIP_COUNTING_TROOP_MEMBER_CHAT');
          deferred.reject({ code: 'SKIP_COUNTING_TROOP_MEMBER_CHAT' });
        }
        else {

          deferred.resolve(notification);
        }

        return deferred.promise;
      }

      function getMessage(notification) {

        switch ( notification.notificationType ) {

          case 'directMessage':
          case 'boardMessage':
            return getChatMessageText(notification);

          case 'newBoard':
            return getNewBoardText(notification);

          case 'newCard':
            return getNewCardText(notification);

          case 'newNote':
            return getNewNoteText(notification);

          case 'inviteToBoard':
            return getInviteToBoardText(notification);

          default:
            return '';
        }

      }

      function getNewNoteText(notification) {
        return [
          'Added a note on the card ',
          vm.cards[notification.cardId].cardName,
          ': "',
          vm.notes[notification.noteId].text.truncateOnWord(50),
          '"'
        ].join('');
      }

      function getNewCardText(notification) {

        return [
          'Added a card: ',
          vm.cards[notification.cardId].cardName
        ].join('');
      }

      function getNewBoardText(notification) {

        return [
          'Created a board: ',
          vm.boards[notification.boardId].boardName
        ].join('');
      }

      function getChatMessageText(notification) {

        var boardName = '';
        var message = '';
        if ( notification.notificationType === 'boardMessage' ) {

          boardName = [
            ' on board: "',
            vm.boards[notification.boardId].boardName,
            '"'
          ].join('');
        }

        if (vm.chatEntries[notification.chatEntryId].assetId) {

          message = 'Added a file.';
        }
        else {

          message = [
            'Said: "',
            vm.chatEntries[notification.chatEntryId].text.truncateOnWord(50),
            '"'
          ].join('');
        }
        return [
          message,
          boardName
        ].join('');
      }

      function getInviteToTroopText(notification) {

        return [
          'Invited you to join the troop: ',
          vm.$troop.troopName
        ].join('');
      }

      function getInviteToBoardText(notification) {

        return [
          'Invited you to join the board: ',
          vm.boards[notification.boardId].boardName
        ].join('');
      }

      function updateNotificationCounts(notification, event) {

        switch ( notification.notificationType ) {

          case 'directMessage':
            return countDirectMessage(notification, event);

          case 'boardMessage':
            return countBoardMessage(notification, event);

          case 'newBoard':
          case 'newCard':
          case 'newNote':
          case 'inviteToBoard':
            return countNonMessage(notification, event);

          default:
            TroopLogger.debug(logConfig, 'reject  UNKNOWN_NOTIFICATION_TYPE');
            return $q.reject({ code: 'UNKNOWN_NOTIFICATION_TYPE' });

        }

      }

      function countTotalNotifications(notification, event) {

        switch(event) {

          case 'updated':
            vm.breakdown.totalReadNotifications += 1;
            vm.breakdown.totalUnreadNotifications = vm.breakdown.totalNotifications - vm.breakdown.totalReadNotifications;
            break;

          case 'added':
            vm.breakdown.totalNotifications += 1;
            if ( notification.isRead ) {
              vm.breakdown.totalReadNotifications += 1;
            }

            vm.breakdown.totalUnreadNotifications = vm.breakdown.totalNotifications - vm.breakdown.totalReadNotifications;
            break;

          case 'removed':
            vm.breakdown.totalNotifications--;

            // stop negative notification count
            if(vm.breakdown.totalNotifications < 0) {
              vm.breakdown.totalNotifications = 0;
            }
            // -----------

            if ( notification.isRead ) {
              vm.breakdown.totalReadNotifications--;

              // stop negative notification count
              if(vm.breakdown.totalReadNotifications < 0) {
                vm.breakdown.totalReadNotifications = 0;
              }
              // -----------
            }

            vm.breakdown.totalUnreadNotifications = vm.breakdown.totalNotifications - vm.breakdown.totalReadNotifications;
            break;
        }


      }

      function countDirectMessage(notification, event) {


        switch(event) {

          case 'updated':
            vm.breakdown.directMessage[notification.fromMemberId].read = (vm.breakdown.directMessage[notification.fromMemberId].read || 0) + 1;

            vm.breakdown.directMessage[notification.fromMemberId].unread =
              vm.breakdown.directMessage[notification.fromMemberId].total -
              vm.breakdown.directMessage[notification.fromMemberId].read;
            break;

          case 'added':
            vm.breakdown.totalDirectMessageNotifications = (vm.breakdown.totalDirectMessageNotifications || 0) + 1;

            if ( ! vm.breakdown.directMessage ) {

              vm.breakdown.directMessage = {};
            }

            if ( ! vm.breakdown.directMessage[notification.fromMemberId] ) {

              vm.breakdown.directMessage[notification.fromMemberId] = {
                total: 0,
                read: 0,
                unread: 0
              };
            }

            vm.breakdown.directMessage[notification.fromMemberId].total = (vm.breakdown.directMessage[notification.fromMemberId].total || 0) + 1;

            if ( notification.isRead ) {

              vm.breakdown.readDirectMessageNotifications = (vm.breakdown.readDirectMessageNotifications || 0) + 1;
              vm.breakdown.directMessage[notification.fromMemberId].read = (vm.breakdown.directMessage[notification.fromMemberId].read || 0) + 1;
            }

            vm.breakdown.unreadDirectMessageNotifications =
              vm.breakdown.totalDirectMessageNotifications -
              vm.breakdown.readDirectMessageNotifications;

            vm.breakdown.directMessage[notification.fromMemberId].unread =
              vm.breakdown.directMessage[notification.fromMemberId].total -
              vm.breakdown.directMessage[notification.fromMemberId].read;
            break;

          case 'removed':
            vm.breakdown.totalDirectMessageNotifications--;
            vm.breakdown.directMessage[notification.fromMemberId].total--;

            // stop negative notification count
            if(vm.breakdown.totalDirectMessageNotifications < 0) {
              vm.breakdown.totalDirectMessageNotifications = 0;
            }

            if(vm.breakdown.directMessage[notification.fromMemberId].total < 0) {
              vm.breakdown.directMessage[notification.fromMemberId].total = 0;
            }
            // -----------

            if ( notification.isRead ) {

              vm.breakdown.readDirectMessageNotifications--;
              vm.breakdown.directMessage[notification.fromMemberId].read--;

              // stop negative notification count
              if(vm.breakdown.readDirectMessageNotifications < 0) {
                vm.breakdown.readDirectMessageNotifications = 0;
              }

              if(vm.breakdown.directMessage[notification.fromMemberId].read < 0) {
                vm.breakdown.directMessage[notification.fromMemberId].read = 0;
              }
              // -----------
            }
            break;
        }

        return countTotalNotifications(notification, event);
      }

      function countBoardMessage(notification, event) {

        switch(event) {

          case 'updated':

            vm.breakdown.boardMessage[notification.boardId].read = (vm.breakdown.boardMessage[notification.boardId].read || 0) + 1;

            vm.breakdown.boardMessage[notification.boardId].unread =
              vm.breakdown.boardMessage[notification.boardId].total -
              vm.breakdown.boardMessage[notification.boardId].read;
            break;

          case 'added':
            vm.breakdown.totalBoardMessageNotifications = (vm.breakdown.totalBoardMessageNotifications || 0) + 1;

            if ( ! vm.breakdown.boardMessage ) {
              vm.breakdown.boardMessage = {};
            }

            if ( ! vm.breakdown.boardMessage[notification.boardId] ) {
              vm.breakdown.boardMessage[notification.boardId] = {
                total: 0,
                read: 0,
                unread: 0
              };
            }

            vm.breakdown.boardMessage[notification.boardId].total = (vm.breakdown.boardMessage[notification.boardId].total || 0) + 1;

            if ( notification.isRead ) {

              vm.breakdown.readBoardMessageNotifications = (vm.breakdown.readBoardMessageNotifications || 0) + 1;
              vm.breakdown.boardMessage[notification.boardId].read = (vm.breakdown.boardMessage[notification.boardId].read || 0) + 1;
            }

            vm.breakdown.unreadBoardMessageNotifications =
              vm.breakdown.totalBoardMessageNotifications -
              vm.breakdown.readBoardMessageNotifications;

            vm.breakdown.boardMessage[notification.boardId].unread =
              vm.breakdown.boardMessage[notification.boardId].total -
              vm.breakdown.boardMessage[notification.boardId].read;
            break;

          case 'removed':
            vm.breakdown.totalBoardMessageNotifications--;
            vm.breakdown.boardMessage[notification.boardId].total--;

            if(vm.breakdown.boardMessage[notification.boardId].total < 0) {
              vm.breakdown.boardMessage[notification.boardId].total = 0;
            }


            if ( notification.isRead ) {

              vm.breakdown.readBoardMessageNotifications--;
              vm.breakdown.boardMessage[notification.boardId].read--;

              // stop negative notification count
              if(vm.breakdown.readBoardMessageNotifications < 0) {
                vm.breakdown.readBoardMessageNotifications = 0;
              }

              if(vm.breakdown.boardMessage[notification.boardId].read < 0) {
                vm.breakdown.boardMessage[notification.boardId].read = 0;
              }
              // -----------
            }

              vm.breakdown.unreadBoardMessageNotifications =
              vm.breakdown.totalBoardMessageNotifications -
              vm.breakdown.readBoardMessageNotifications;

              vm.breakdown.boardMessage[notification.boardId].unread =
              vm.breakdown.boardMessage[notification.boardId].total -
              vm.breakdown.boardMessage[notification.boardId].read;

              // stop negative notification count
              if(vm.breakdown.totalBoardMessageNotifications < 0) {
                vm.breakdown.totalBoardMessageNotifications = 0;
              }

              if(vm.breakdown.unreadBoardMessageNotifications < 0) {
                vm.breakdown.unreadBoardMessageNotifications = 0;
              }

              if(vm.breakdown.boardMessage[notification.boardId].unread < 0) {
                vm.breakdown.boardMessage[notification.boardId].unread = 0;
              }
              // -----------

            break;
        }

        return countTotalNotifications(notification, event);
      }

      function countNonMessage(notification, event) {

        countNonMessageTotal(notification, event);

        if ( ! vm.breakdown.nonMessage[notification.boardId] ) {
          vm.breakdown.nonMessage[notification.boardId] = {
            read: 0,
            unread: 0,
            total: 0
          };
        }

        switch(event) {

          case 'updated':
            vm.breakdown.nonMessage[notification.boardId].read = (vm.breakdown.nonMessage[notification.boardId].read || 0) + 1;

            vm.breakdown.nonMessage[notification.boardId].unread =
              vm.breakdown.nonMessage[notification.boardId].total -
              vm.breakdown.nonMessage[notification.boardId].read;

              // stop negative notification count
              if(vm.breakdown.nonMessage[notification.boardId].unread < 0) {
                vm.breakdown.nonMessage[notification.boardId].unread = 0;
              }
            break;

          case 'added':
            vm.breakdown.nonMessage[notification.boardId].total = (vm.breakdown.nonMessage[notification.boardId].total || 0) + 1;

            if ( notification.isRead ) {

              vm.breakdown.nonMessage[notification.boardId].read = (vm.breakdown.nonMessage[notification.boardId].read || 0) + 1;
            }

            vm.breakdown.nonMessage[notification.boardId].unread =
              vm.breakdown.nonMessage[notification.boardId].total -
              vm.breakdown.nonMessage[notification.boardId].read;

              // stop negative notification count
              if(vm.breakdown.nonMessage[notification.boardId].unread < 0) {
                vm.breakdown.nonMessage[notification.boardId].unread = 0;
              }
            break;

          case 'removed':
            vm.breakdown.nonMessage[notification.boardId].total--;

            // stop negative notification count
            if(vm.breakdown.nonMessage[notification.boardId].total < 0) {
              vm.breakdown.nonMessage[notification.boardId].total = 0;
            }
            // -----------

            if ( notification.isRead ) {

              vm.breakdown.nonMessage[notification.boardId].read--;

              // stop negative notification count
              if(vm.breakdown.nonMessage[notification.boardId].read < 0) {
                vm.breakdown.nonMessage[notification.boardId].read = 0;
              }
              // -----------
            }

            vm.breakdown.nonMessage[notification.boardId].unread =
              vm.breakdown.nonMessage[notification.boardId].total -
              vm.breakdown.nonMessage[notification.boardId].read;


            // stop negative notification count
            if(vm.breakdown.nonMessage[notification.boardId].unread < 0) {
              vm.breakdown.nonMessage[notification.boardId].unread = 0;
            }

            break;
        }

        return countTotalNotifications(notification, event);
      }

      function countNonMessageTotal(notification, event) {

        switch(event) {

          case 'updated':
            vm.breakdown.readNonMessageNotifications = (vm.breakdown.readNonMessageNotifications || 0) + 1;

            vm.breakdown.unreadNonMessageNotifications =
              vm.breakdown.totalNonMessageNotifications -
              vm.breakdown.readNonMessageNotifications;

              // stop negative notification count
              if(vm.breakdown.unreadNonMessageNotifications < 0) {
                vm.breakdown.unreadNonMessageNotifications = 0;
              }
            break;

          case 'added':
            vm.breakdown.totalNonMessageNotifications = (vm.breakdown.totalNonMessageNotifications || 0) + 1;

            if ( notification.isRead ) {

              vm.breakdown.readNonMessageNotifications = (vm.breakdown.readNonMessageNotifications || 0) + 1;
            }

            vm.breakdown.unreadNonMessageNotifications =
              vm.breakdown.totalNonMessageNotifications -
              vm.breakdown.readNonMessageNotifications;

              // stop negative notification count
              if(vm.breakdown.unreadNonMessageNotifications < 0) {
                vm.breakdown.unreadNonMessageNotifications = 0;
              }
            break;

          case 'removed':
            vm.breakdown.totalNonMessageNotifications--;

            // stop negative notification count
            if(vm.breakdown.totalNonMessageNotifications < 0) {
              vm.breakdown.totalNonMessageNotifications = 0;
            }
            // -----------

            if ( notification.isRead ) {

              vm.breakdown.readNonMessageNotifications--;

              // stop negative notification count
              if(vm.breakdown.readNonMessageNotifications < 0) {
                vm.breakdown.readNonMessageNotifications = 0;
              }
              // -----------
            }

            vm.breakdown.unreadNonMessageNotifications =
              vm.breakdown.totalNonMessageNotifications -
              vm.breakdown.readNonMessageNotifications;
            break;
        }

        //return countTotalNotifications(notification, event);
      }

      function filterOutChatTypes(notification) {

        var deferred = $q.defer();

        switch (notification.notificationType) {

          case 'directMessage':
          case 'boardMessage':

            TroopLogger.debug(logConfig, 'reject  FILTERED_MESSAGE');
            deferred.reject({ code: 'FILTERED_MESSAGE'});
            break;

          default:
            deferred.resolve(notification);
            break;
        }

        return deferred.promise;
      }

      function sendBrowserNotification(notification) {

        var deferred = $q.defer();

        if ( ! $localStorage.alreadyNotified ) {
          $localStorage.alreadyNotified = {};
        }

        if (
          ( ! notification.isRead )
          && ( ! $localStorage.alreadyNotified[notification.$id] )
        ) {

          $localStorage.alreadyNotified[notification.$id] = true;

          var message = getMessage(notification);

          $notification(
            vm.fromMembers[notification.fromMemberId].name,
            {
              body: message.replace('', '').replace('', ''),
              dir: 'auto',
              lang: 'en',
              //tag: 'my-tag',
              icon: TROOP_ICON_URL,
              delay: 5000, // in ms
              focusWindowOnClick: true // focus the window on click
            }
          );
        }
        else {

        }

        deferred.resolve(notification);

        return deferred.promise;
      }

      function checkForFromMemberData(notification) {

        var deferred = $q.defer();

        if ( ! vm.fromMembers.hasOwnProperty(notification.fromMemberId) ) {

          vm.fromMembers[notification.fromMemberId] = TroopMemberFactory.getFirebaseObjectByKey(
            notification.troopId,
            notification.fromMemberId
          );

          vm.fromMembers[notification.fromMemberId].$loaded()
          .then(function() {

            if ( vm.fromMembers[notification.fromMemberId].$value === null ) {

              TroopLogger.debug(logConfig, 'reject  FROM_MEMBER_DOES_NOT_EXIST');
              deferred.reject({ code: 'FROM_MEMBER_DOES_NOT_EXIST'});
            }
            else if (
              vm.fromMembers[notification.fromMemberId].troopPermission === 'discharged'
              || vm.fromMembers[notification.fromMemberId].troopPermission === 'banned'
              ) {

              TroopLogger.debug(logConfig, 'reject  FROM_MEMBER_DISCHARGED');
              deferred.reject({ code: 'FROM_MEMBER_DISCHARGED'});
            }
            else {

              deferred.resolve(vm.fromMembers[notification.fromMemberId]);
            }

          })
        }
        else {
          deferred.resolve(vm.fromMembers[notification.fromMemberId]);
        }

        return deferred.promise;
      }

      function checkForBoardData(notification) {

        var deferred = $q.defer();

        if ( ! vm.boards.hasOwnProperty(notification.boardId) ) {

          vm.boards[notification.boardId] = BoardFactory.getFirebaseObjectByKey(
            notification.troopId,
            notification.boardId
          );

          vm.boards[notification.boardId].$loaded()
          .then(function() {

            //agLogger.debug('boardData',vm.boards[notification.boardId]);

            if ( vm.boards[notification.boardId].$value === null ) {

              TroopLogger.debug(logConfig, 'reject  BOARD_DOES_NOT_EXIST');
              deferred.reject({ code: 'BOARD_DOES_NOT_EXIST'});
            }
            else if ( vm.boards[notification.boardId].archived ) {

              TroopLogger.debug(logConfig, 'reject  BOARD_ARCHIVED');
              deferred.reject({ code: 'BOARD_ARCHIVED'});
            }
            else {

              deferred.resolve(vm.boards[notification.boardId]);
            }

          })
        }
        else {
          deferred.resolve(vm.boards[notification.boardId]);
        }

        return deferred.promise;
      }

      function checkForCardData(notification) {

        var deferred = $q.defer();

        if ( ! vm.cards.hasOwnProperty(notification.cardId) ) {

          vm.cards[notification.cardId] = CardFactory.getFirebaseObjectByKey(
            notification.troopId,
            notification.cardId
          );

          vm.cards[notification.cardId].$loaded()
          .then(function() {

            if ( vm.cards[notification.cardId].$value === null ) {

              TroopLogger.debug(logConfig, 'reject  CARD_DOES_NOT_EXIST');
              deferred.reject({ code: 'CARD_DOES_NOT_EXIST'});
            }
            else if ( vm.cards[notification.cardId].archived ) {

              TroopLogger.debug(logConfig, 'reject  CARD_ARCHIVED');
              deferred.reject({ code: 'CARD_ARCHIVED'});
            }
            else {

              deferred.resolve(vm.cards[notification.cardId]);
            }

          });
        }
        else {
          deferred.resolve(vm.cards[notification.cardId]);
        }

        return deferred.promise;
      }

      function checkForNoteData(notification) {

        var deferred = $q.defer();

        if ( ! vm.notes.hasOwnProperty(notification.noteId) ) {

          vm.notes[notification.noteId] = CardFactory.getNote(
            notification.troopId,
            notification.cardId,
            notification.noteId
          );

          vm.notes[notification.noteId].$loaded()
          .then(function() {

            if ( vm.notes[notification.noteId].$value === null ) {

              TroopLogger.debug(logConfig, 'reject  NOTE_DOES_NOT_EXIST');
              deferred.reject({ code: 'NOTE_DOES_NOT_EXIST'});
            }
            else {

              deferred.resolve(vm.notes[notification.noteId]);
            }

          });
        }
        else {
          deferred.resolve(vm.notes[notification.noteId]);
        }

        return deferred.promise;
      }

      function checkForChatEntryData(notification) {

        var deferred = $q.defer();

        if ( ! vm.chatEntries.hasOwnProperty(notification.chatEntryId) ) {

          vm.chatEntries[notification.chatEntryId] = ChatEntryFactory.getFirebaseObjectByKey(
            notification.troopId,
            notification.chatEntryId
          );

          vm.chatEntries[notification.chatEntryId].$loaded()
          .then(function() {

            if ( vm.chatEntries[notification.chatEntryId].$value === null ) {

              TroopLogger.debug(logConfig, 'reject  CHAT_ENTRY_DOES_NOT_EXIST');
              deferred.reject({ code: 'CHAT_ENTRY_DOES_NOT_EXIST'});
            }
            else {

              deferred.resolve(vm.chatEntries[notification.chatEntryId]);
            }

          });
        }
        else {
          deferred.resolve(vm.chatEntries[notification.chatEntryId]);
        }

        return deferred.promise;
      }

      function checkBoardDependancyData(notification) {

        var deferred = $q.defer();

        checkForFromMemberData(notification)
        .then(function() {
          return checkForBoardData(notification);
        })
        .then(function() {
          deferred.resolve(notification);
        })
        .catch(function(error) {

          TroopLogger.debug(logConfig, 'checkBoardDependancyData error',error);
          deferred.reject(error);
        });

        return deferred.promise;
      }

      function checkCardDependancyData(notification) {

        var deferred = $q.defer();

        checkForFromMemberData(notification)
        .then(function(member) {

          return checkForBoardData(notification)
        })
        .then(function(board) {

          return checkForCardData(notification)
        })
        .then(function(card) {

          deferred.resolve(notification);
        })
        .catch(function(error) {

          TroopLogger.debug(logConfig, 'checkCardDependancyData error',error);
          deferred.reject(error);
        });

        return deferred.promise;
      }

      function checkNoteDependancyData(notification) {
        var deferred = $q.defer();

        checkForFromMemberData(notification)
        .then(function() {

          return checkForBoardData(notification);
        })
        .then(function() {

          return checkForCardData(notification);
        })
        .then(function() {

          return checkForNoteData(notification);
        })
        .then(function() {

          deferred.resolve(notification);
        })
        .catch(function(error) {

          TroopLogger.debug(logConfig, 'checkNoteDependancyData error',error);
          deferred.reject(error);
        });

        return deferred.promise;
      }

      function checkDirectMessageDependancyData(notification) {

        var deferred = $q.defer();

        checkForFromMemberData(notification)
        .then(function() {
          return checkForChatEntryData(notification);
        })
        .then(function() {
          deferred.resolve(notification);
        })
        .catch(function(error) {

          TroopLogger.debug(logConfig, 'checkDirectMessageDependancyData error',error);
          deferred.reject(error);
        });

        return deferred.promise;
      }

      function checkBoardMessageDependancyData(notification) {

        var deferred = $q.defer();

        checkForFromMemberData(notification)
        .then(function() {

          return checkForBoardData(notification);
        })
        .then(function() {

          return checkForChatEntryData(notification);
        })
        .then(function() {

          deferred.resolve(notification);
        })
        .catch(function(error) {

          TroopLogger.debug(logConfig, 'checkBoardMessageDependancyData error',error);
          deferred.reject(error);
        });

        return deferred.promise;
      }

      function checkForDependencyData(notification) {

        switch (notification.notificationType) {

          case 'directMessage':
            return checkDirectMessageDependancyData(notification);

          case 'boardMessage':
            return checkBoardMessageDependancyData(notification);

          case 'newBoard':
            return checkBoardDependancyData(notification);

          case 'newCard':
            return checkCardDependancyData(notification);

          case 'newNote':
            return checkNoteDependancyData(notification);

          case 'inviteToBoard':
            return checkBoardDependancyData(notification);

          default:

            TroopLogger.debug(logConfig, 'reject UNKNOWN_NOTIFICATION_TYPE');
            return $q.reject({ code: 'UNKNOWN_NOTIFICATION_TYPE'});

        }

      }

    }

  }

})(); // end of file
