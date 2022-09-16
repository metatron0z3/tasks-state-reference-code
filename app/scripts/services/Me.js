/* global _, $ */
/* jshint strict: true */
/* jshint -W014 */

'use strict';

/**
 * @ngdoc service
 * @name webClientApp.Me
 * @description
 * # Me
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'Me',
    [
      '$rootScope',
      '$state',
      '$location',
      '$timeout',
      '$q',
      '$localStorage',
      '$sessionStorage',
      '$firebaseObject',
      '$firebaseArray',
      'TroopApi',
      'NotificationFirebaseArray',
      'TroopFirebaseObject',
      'TrooperFactory',
      'TroopMemberFactory',
      'TroopFactory',
      'BoardFactory',
      'SearchFactory',
      'FileFactory',
      'NotificationFactory',
      'Fingerprint',
      'UAParser',
      'Ref',
      'Nav',
      'TROOP_ICON_URL',
      'DEMO_TROOP_ID',
      'HELP_TROOP_ID',
      'TroopLogger',
      function (
        $rootScope,
        $state,
        $location,
        $timeout,
        $q,
        $localStorage,
        $sessionStorage,
        $firebaseObject,
        $firebaseArray,
        TroopApi,
        NotificationFirebaseArray,
        TroopFirebaseObject,
        TrooperFactory,
        TroopMemberFactory,
        TroopFactory,
        BoardFactory,
        SearchFactory,
        FileFactory,
        NotificationFactory,
        Fingerprint,
        UAParser,
        Ref,
        Nav,
        TROOP_ICON_URL,
        DEMO_TROOP_ID,
        HELP_TROOP_ID,
        TroopLogger
      ) {
        var logConfig = {
          slug: 'service:    Me - ',
          path: [ 'services', 'Me.js']
        };

        var that = this;

        this.isSigningUp = false;
        this.isLoggingIn = false;
        this.windowUID = null;
        this.fingerprint = null;
        this.firebaseUser = null;
        this.lastBoardIds = {};
        this.firstBoardId = null;
        this.lastTroopId = null;
        this.lastTroopMemberId = null;
        this.enteredChats = {};
        this.trooper = null;
        this.troop = null;
        this.troopMember = null;
        this.troopMembers = null;
        this.notifications = null;
        this.allBoards = null;
        this.currentBoard = null;
        this.currentBoardAssets = null;
        this.currentTroopMember = null;
        this.currentTroopMemberAssets = null;
        this.currentBoardTagNamesRef = null;
        this.currentDevice = null;
        this.redirectingDeferred = $q.defer();
        this.currentBoardLoadingDeferred = $q.defer();
        this.trooperLoadingDeferred = $q.defer();
        this.troopLoadingDeferred = $q.defer();
        this.troopsLoadingDeferred = $q.defer();
        this.troopMemberLoadingDeferred = $q.defer();
        this.troopMemberCheckDeferred = $q.defer();
        this.allBoardsLoadingDeferred = $q.defer();
        this.troopMembersLoadingDeferred = $q.defer();
        this.notificationsLoadingDeferred = $q.defer();
        this.currentTroopMemberLoadingDeferred = $q.defer();
        this.offAuth = null;
        this.isjhExperience = false;
        this.isjhExperiencePlus = false;
        this.unWatchCurrentBoard = function() {};
        this.unWatchCurrentBoardAssets = function() {};
        this.unWatchNotifications = function() {};
        this.unWatchTroopMember = function() {};
        this.screen = {
          width: null,
          height: null,
          size: null
        };
        this.computedAssetInfoCache = {};
        this.currentRouteState = null;

        this.logout = function() {
          TroopLogger.debug(logConfig, 'logout()');
          if ( that.trooper ) {

            that.trooper.$destroy();
          }

          if ( that.troop ) {

            that.troop.$destroy();
          }

          if ( that.troops ) {

            _.each(that.troops, function(troop) {

              troop.$destroy();
            });
          }

          if ( that.troopMember ) {

            that.troopMember.$destroy();
          }

          if ( that.troopMembers ) {

            that.troopMembers.$destroy();
          }

          if ( that.notifications ) {

            _.each(that.notifications, function(notification) {

              notification.$destroy();
            });
          }

          if ( that.allBoards ) {

            that.allBoards.$destroy();
          }

          if ( that.currentBoard ) {

            that.currentBoard.$destroy();
          }

          if ( that.currentBoardAssets ) {

            that.currentBoardAssets.$destroy();
          }

          if ( that.currentTroopMember ) {

            that.currentTroopMember.$destroy();
          }

          if ( that.currentTroopMemberAssets ) {

            that.currentTroopMemberAssets.$destroy();
          }

        };
        this.saveState = function(newState, toParams) {

          $localStorage.windowIDs[that.windowUID].me.lastState = {
            newState: newState,
            toParams: toParams
          };
        };
        this.addDevice = function(deviceGUID) {

          var that = this;
          var deferred = $q.defer();
          var deviceRef = Ref.child('devices')
              .orderByChild('deviceGUID')
              .equalTo(deviceGUID)
              .limitToFirst(1);

          deviceRef.once('value', function(deviceSnapArray) {

            if ( deviceSnapArray.hasChildren() ) {

              deviceSnapArray.forEach(function(deviceSnap) {

                var device = deviceSnap.val();
                device.$id = deviceSnap.key;

                that.currentDevice = device;

                that.showPresence(deviceSnap.ref);
              });

            }
            else {

              that.trooper.$loaded().then(function() {

                var device = {
                  userId: that.trooper.$id,
                  deviceGUID: deviceGUID,
                  os: UAParser.os.name,
                  osVersion: UAParser.os.version,
                  model: UAParser.browser.name,
                  modelVersion: UAParser.browser.version
                };

                var newDeviceRef = Ref.child('devices').push(
                  device,
                  function(error) {

                    if (error) {
                      deferred.reject(error);
                    }
                    else {
                      deferred.resolve(newDeviceRef);

                      device.$id = newDeviceRef.key;

                      that.currentDevice = device;
                      that.showPresence(newDeviceRef);

                    }

                  }
                );

              });

            }

          });

          return deferred.promise;
        };
        this.showPresence = function(deviceRef) {

          // on disconnect remove device record
          deviceRef.onDisconnect().remove();

          if ( that.troopMember.$id === 'guest' ) {
            // no presence recorded if we're a guest
            return false;
          }

          // add device to troop member
          var troopMemberDeviceRef = Ref.child('members')
                                      .child(that.troop.$id)
                                      .child(that.troopMember.$id)
                                      .child('devices')
                                      .child(deviceRef.key);
          troopMemberDeviceRef.set(true);
          // on disconnect remove device from troop member
          troopMemberDeviceRef.onDisconnect().remove();

        };
        this.onConnected = function(snap) {

          if (
            ( snap.val() === true )
            && that.trooper
          ) {

            that.setFingerprint();
            $q.all([
              that.$loadedFingerprint(),
              that.trooper.$loaded()
            ])
            .then(function() {

              var deviceGUID = 'web:' + that.fingerprint;
              deviceGUID += that.windowUID.substr(4).replace(/-/g, '');
              that.addDevice(deviceGUID);
            });
          }
          else {
            // Lost connection
          }
        };
        this.stopMonitoringConnection = function() {

          if ( that.connectedRef ) {

            that.connectedRef.off('value', that.onConnected);
          }

          that.connectedRef = null;
        };
        this.monitorConnection = function() {

          if ( that.connectedRef ) {

            // already monintoring
            return false;
          }

          that.connectedRef = Ref.child('.info/connected');
          that.connectedRef.on('value', that.onConnected);
        };
        this.setFingerprint = function() {

          var deferred = $q.defer();

          if ( ! that.fingerprint ) {

            Fingerprint.then(function(fingerprint) {

              deferred.resolve(fingerprint);

              that.fingerprint = fingerprint;

              $localStorage.windowIDs[that.windowUID].me.fingerprint = fingerprint;
            });
          }
          else {
            deferred.resolve(that.fingerprint);
          }

          that.$loadedFingerprint = function() {
            return deferred.promise;
          };

          return deferred.promise;
        };
        this.freeMe = function() {
          TroopLogger.debug(logConfig, 'freeMe()');
          that.unWatchTroopMember();
          that.unWatchNotifications();
          that.unWatchCurrentBoard();
          that.unWatchCurrentBoardAssets();

          $localStorage.windowIDs[that.windowUID].me.trooperId = null;
          $localStorage.windowIDs[that.windowUID].me.troopId = null;
          $localStorage.windowIDs[that.windowUID].me.troopMemberId = null;
          $localStorage.windowIDs[that.windowUID].me.currentTroopMemberId = null;
          $localStorage.windowIDs[that.windowUID].me.currentBoardId = null;
          $localStorage.windowIDs[that.windowUID].me.enteredChats = {};
          $localStorage.windowIDs[that.windowUID].me.enteredNotes = {};

          that.loadTrooperFromStorage();
          that.loadTroopFromStorage();
          that.loadTroopMemberFromStorage();
          that.loadBoardFromStorage();
          that.loadCurrentTroopMemberFromStorage();

        };
        this.$doneTryingToLoadTrooper = function() {
          return that.trooperLoadingDeferred.promise;
        };
        this.loadTrooper = function(trooperId) {


          if ( that.trooperLoadingDeferred.promise.$$state.status ) {
            that.trooperLoadingDeferred = $q.defer();
          }

          if ( that.troopsLoadingDeferred.promise.$$state.status ) {
            that.troopsLoadingDeferred = $q.defer();
          }

          if ( that.notificationsLoadingDeferred.promise.$$state.status ) {
            that.notificationsLoadingDeferred = $q.defer();
          }

          $localStorage.windowIDs[that.windowUID].me.trooperId = trooperId;

          that.loadTrooperFromStorage();

          return that.trooperLoadingDeferred.promise;
        };
        this.loadTrooperFromStorage = function() {

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          // keep track of user specific stuff
          if ( ! $localMe.remember.hasOwnProperty($localMe.trooperId) ) {
            $localMe.remember[$localMe.trooperId] = {};
          }

          // keep track of last board user was last in for each troop
          if ( ! $localMe.remember[$localMe.trooperId].hasOwnProperty('lastBoardIds') ) {
            $localMe.remember[$localMe.trooperId].lastBoardIds = {};
          }

          that.lastBoardIds = $localMe.remember[$localMe.trooperId].lastBoardIds;
          that.lastTroopId = $localMe.remember[$localMe.trooperId].lastTroopId;
          that.lastTroopMemberId = $localMe.remember[$localMe.trooperId].lastTroopMemberId;



          var oldTrooper;
          var oldTroops;
          var oldNotifications;

          if (that.trooper) {
            oldTrooper = that.trooper;
            that.trooper = null;
          }

          if (that.troops) {
            oldTroops = that.troops;
            that.troops = null;
          }

          if (that.notifications) {
            oldNotifications = that.notifications;
            that.notifications = null;
          }

          if ( ! $localMe.trooperId ) {


            if (that.trooperLoadingDeferred) {

              that.trooperLoadingDeferred.reject({code: 'MISSING_TROOPER_ID'});

            }

            if (that.troopsLoadingDeferred) {

              that.troopsLoadingDeferred.reject({code: 'MISSING_TROOPER_ID'});
            }

            if ( oldTrooper ) {

              oldTrooper.$destroy();
            }

            if ( oldTroops ) {

              _.each(oldTroops, function(troop, troopId) {

                troop.$destroy();
              });
            }

            if ( oldNotifications ) {

              _.each(oldNotifications, function(notification) {

                notification.$destroy();
              });
            }

            return false;

          }

          that.trooper = TrooperFactory.getFirebaseObjectByKey($localMe.trooperId);

          if (that.trooperLoadingDeferred) {
            that.trooperLoadingDeferred.resolve();
          }

          that.trooper.$loaded().then(function() {

            if (oldTrooper) {
              oldTrooper.$destroy();
            }

            if ( ! $localStorage.codeEntered ) {
              $localStorage.codeEntered = [];
            }

            if (
              (
                ( ! that.isjhExperience )
                && (
                  ( '1164d114664b0f48a50c368fdd340d33' === CryptoJS.MD5(that.trooper.loginId).toString() )
                  || ( '26d8ac5ace2ec6677dcbc68ccf3ff9cf' === CryptoJS.MD5(that.trooper.loginId).toString() )
                )
              )
              ||
              (
                '72d92adaa209a6e2526d65fc5d596de8' === CryptoJS.MD5($localStorage.codeEntered.join('')).toString()
              )
            ) {

              that.isjhExperience = true;
              $rootScope.isjhExperience = true;
            }

            if (
              (
                ( ! that.isjhExperiencePlus )
                && '26d8ac5ace2ec6677dcbc68ccf3ff9cf' === CryptoJS.MD5(that.trooper.loginId).toString()
              )
            ) {

              that.isjhExperiencePlus = true;
              $rootScope.isjhExperiencePlus = true;
            }

            that.troops = {};
            var troopPromises = [];
            that.notifications = {};
            var notificationPromises = [];

            _.each(that.trooper.troops, function(troopMemberInfo, troopId) {

              var $troop = new TroopFirebaseObject(
                Ref.child('troops')
                .child(troopId)
              );
              that.troops[troopId] = $troop;
              troopPromises.push($troop.$loaded());

              var canGetNotifications = false;

              if (
                ( troopId !== DEMO_TROOP_ID )
                && ( troopId !== HELP_TROOP_ID )
              ) {
                // not DEMO or HELP troop, so members can see members
                canGetNotifications = true;
              }
              else if (
                ( troopMemberInfo.troopPermission === 'admin' )
                || ( troopMemberInfo.troopPermission === 'guest' )
              ) {
                // is DEMO or HELP troop, and users is admin or creator
                canGetNotifications = true;
              }

              if ( canGetNotifications ) {

                var notifications = new NotificationFirebaseArray({
                  userId: that.trooper.$id,
                  troopId: troopId,
                  troopMemberId: troopMemberInfo.memberId,
                  getCurrentTroop: function() {
                    return that.troop;
                  }
                });

                that.notifications[troopMemberInfo.memberId] = notifications;

                notificationPromises.push(notifications.$loaded());
              }

            });

            if (
              'lastTroopId' in that
              && 'troops' in that.trooper
              && that.lastTroopId in that.trooper.troops
              && that.trooper.troops[that.lastTroopId].troopPermission === 'discharged'
            ) {

              that.lastTroopId = $localMe.remember[$localMe.trooperId].lastTroopId = that.getFirstTroop().troopId;
            }

            that.trooper.$ref().child('troops').on('child_added', function(snap) {

              var troopId = snap.key;
              var $troop = new TroopFirebaseObject(
                Ref.child('troops')
                  .child(troopId)
              );
              that.troops[troopId] = $troop;

              $rootScope.$broadcast('troop-added', $troop);
            });

            that.trooper.$ref().child('troopInvites').on('child_added', function(snap) {

              $rootScope.$broadcast('troop-invite-added');
            });

            $q.all(troopPromises).then(function() {

              if (that.troopsLoadingDeferred) {
                that.troopsLoadingDeferred.resolve();
              }

              if (oldTroops) {

                _.each(oldTroops, function(oldTroop) {
                  oldTroop.$destroy();
                });
              }
            });

            $q.all(notificationPromises).then(function() {

              if (that.notificationsLoadingDeferred) {
                that.notificationsLoadingDeferred.resolve();
              }

              if (oldNotifications) {

                _.each(oldNotifications, function(oldNotification) {
                  oldNotification.$destroy();
                });

              }
            });
          });
        };
        this.$doneTryingToLoadTroops = function() {

          return that.troopsLoadingDeferred.promise;
        };
        this.$doneTryingToLoadTroop = function() {
          return that.troopLoadingDeferred.promise;
        };
        this.$doneTryingToLoadTroopMember = function() {
          return that.troopMemberLoadingDeferred.promise;
        };
        this.$doneCheckingForTroopMember = function() {
          return that.troopMemberCheckDeferred.promise;
        };
        this.$doneTryingToLoadTroopMembers = function() {
          return that.troopMembersLoadingDeferred.promise;
        };
        this.$doneTryingToLoadAllBoards = function() {
          return that.allBoardsLoadingDeferred.promise;
        };
        this.$doneTryingToLoadNotifications = function() {
          return that.notificationsLoadingDeferred.promise;
        };
        this.loadTroopMember = function(troopId, troopMemberId) {

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( that.troopMemberLoadingDeferred.promise.$$state.status ) {
            that.troopMemberLoadingDeferred = $q.defer();
          }

          if ( that.troopMemberCheckDeferred.promise.$$state.status ) {
            that.troopMemberCheckDeferred = $q.defer();
          }

          $localMe.remember[$localMe.trooperId].lastTroopMemberId = troopMemberId;

          $localMe.troopMemberId = troopMemberId;

          that.loadTroopMemberFromStorage(troopId);

          return that.troopLoadingDeferred.promise;
        };
        this.loadTroopMemberFromStorage = function(troopId) {

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( $localMe.troopMemberId === 'guest' ) {
            var boards = {};

            _.each(that.allBoards, function(board, index) {
              if ( ! board.private ) {
                boards[board.$id] = {
                  order: index + 1,
                  permission: 'member'
                };
              }
            });

            var name = 'Troop Guest';
            if (that.trooper.name) {
              name = that.trooper.name;
            }


            that.troopMember = {
              $id: 'guest',
              name: name,
              boards: boards,
              troopPermission: 'guest',
              $loaded: function() {

                return that.troopMemberLoadingDeferred.promise;
              },
              $watch: function(cb) {

              },
              $destroy: function() {

              }
            };
            that.troopMemberCheckDeferred.resolve();
            that.troopMemberLoadingDeferred.resolve();

            if ( ! that.firebaseUser.isAnonymous ) {
              // has troop account but is viewing a public troop as a guest
              // still need to monitor the firebase connection state
              that.monitorConnection();
            }

            return false;
          }

          // not a guest, proceed as usual
          var oldTroopMember;
          if (that.troopMember) {
            oldTroopMember = that.troopMember;
            that.troopMember = null;
            that.unWatchTroopMember();
          }

          if ( ! $localMe.troopMemberId ) {

            if ( this.troopMemberCheckDeferred ) {

              this.troopMemberCheckDeferred.reject({code: 'MISSING_TROOP_MEMBER_ID'});
            }

            if ( this.notificationsLoadingDeferred ) {

              this.notificationsLoadingDeferred.reject({code: 'MISSING_TROOP_MEMBER_ID'});
            }

            if ( oldTroopMember ) {

              oldTroopMember.$destroy();
            }

            return false;
          }

          that.troopMember = TroopMemberFactory.getFirebaseObjectByKey(troopId, $localMe.troopMemberId);


          TroopMemberFactory.getFirebaseObjectByKey(troopId, $localMe.troopMemberId).$loaded()
          .then(function() {
            if (
              ( ! that.troopMember )
              || ( ! that.troopMember.userId )
            ) {

              that.troopMemberCheckDeferred.reject({code: 'MEMBER_DOES_NOT_EXIST'});
              return false;
            }

            if ( that.troopMemberCheckDeferred ) {

              that.troopMemberCheckDeferred.resolve();
            }
            if ( that.troopMemberLoadingDeferred ) {

              that.troopMemberLoadingDeferred.resolve();
            }
            if (oldTroopMember) {

              oldTroopMember.$destroy();
            }
            that.unWatchTroopMember = that.troopMember.$watch(function(event) {
              TroopLogger.debug(logConfig, 'watching troopMember', event);
              if (
                that.troopMember.hasOwnProperty('$value')
                && that.troopMember.$value === null
              ) {
                // troop member no longer exists need to switch troops
                that.redirect(that.trooper.$id);
                return false;
              }
              else if (
                that.troopMember.$id === event.key
                && that.troopMember.troopPermission === 'discharged'
                && that.troopMember.troopPermission === 'banned'
              ) {
                var troop = that.getFirstTroop()
                that.switchToTroop(troop.troopId)
                return false;
              }
              if (
                that.currentBoard
                && (
                  ( ! that.troopMember.hasOwnProperty('boards') )
                  || ( ! that.troopMember.boards.hasOwnProperty(that.currentBoard.$id) )
                )
              ) {
                // no longer have access to board
                that.redirect(that.trooper.$id);
                return false;
              }

            });
            that.monitorConnection();

            $rootScope.$broadcast('troop-member-changed');
          });
        };
        this.loadTroop = function(troopId) {
          TroopLogger.debug(logConfig, 'loadTroop()');

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( that.troopLoadingDeferred.promise.$$state.status ) {

            that.troopLoadingDeferred = $q.defer();
          }

          if ( that.allBoardsLoadingDeferred.promise.$$state.status ) {

            TroopLogger.debug(logConfig, 'allBoardsLoading()');

            that.allBoardsLoadingDeferred = $q.defer();
          }

          if ( that.troopMembersLoadingDeferred.promise.$$state.status ) {

            that.troopMembersLoadingDeferred = $q.defer();
          }

          $localMe.remember[$localMe.trooperId].lastTroopId = troopId;

          $localMe.troopId = troopId;

          that.loadTroopFromStorage();

          return that.troopLoadingDeferred.promise;
        };
        this.loadTroopFromStorage = function() {

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          var oldTroop;
          var oldAllBoards;
          var oldTroopMembers;
          if (that.troop) {

            oldTroop = that.troop;
            that.troop = null;
          }

          if (that.allBoards) {

            oldAllBoards = that.allBoards;
            that.allBoards = null;
          }

          if (that.troopMembers) {

            oldTroopMembers = that.troopMembers;
            that.troopMembers = null;
          }

          if ( ! $localMe.troopId ) {
            if ( this.troopLoadingDeferred ) {

              this.troopLoadingDeferred.reject();
            }

            if ( this.troopMembersLoadingDeferred ) {

              this.troopMembersLoadingDeferred.reject();
            }

            if ( that.allBoardsLoadingDeferred ) {

              that.allBoardsLoadingDeferred.reject();
            }


            if ( oldTroop ) {

              oldTroop.$destroy();
            }

            if ( oldAllBoards ) {

              oldAllBoards.$destroy();
            }

            if ( oldTroopMembers ) {

              oldTroopMembers.$destroy();
            }
          }
          else {
            that.troop = TroopFactory.getFirebaseObjectByKey($localMe.troopId);

            if ( this.troopLoadingDeferred ) {

              this.troopLoadingDeferred.resolve();
            }

            that.troop.$loaded().then(function() {

              $rootScope.$broadcast('troop-changed');

              if (oldTroop) {

                oldTroop.$destroy();
              }
            });

            that.troopMembers = TroopFactory.getMembers($localMe.troopId);

            if ( this.troopMembersLoadingDeferred ) {

              this.troopMembersLoadingDeferred.resolve();
            }

            if (oldTroopMembers) {
              that.troopMembers.$loaded().then(function() {
                oldTroopMembers.$destroy();
              });
            }

            that.allBoards = BoardFactory.getBoards($localMe.troopId);

            if ( that.allBoardsLoadingDeferred ) {

              TroopLogger.debug(logConfig, 'loadTroopFromStorage() - board resolve');
              that.allBoardsLoadingDeferred.resolve();
            }

            if (oldAllBoards) {
              that.allBoards.$loaded().then(function() {
                oldAllBoards.$destroy();
              });
            }
          }
        };

        this.$doneTryingToLoadCurrentTroopMember = function() {
          return that.currentTroopMemberLoadingDeferred.promise;
        };

        this.loadCurrentTroopMember = function(currentTroopMemberId) {

          if ( that.currentTroopMemberLoadingDeferred.promise.$$state.status ) {
            that.currentTroopMemberLoadingDeferred = $q.defer();
          }

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          $localMe.currentTroopMemberId = currentTroopMemberId;

          that.loadCurrentTroopMemberFromStorage();

          return that.currentTroopMemberLoadingDeferred.promise;
        };

        this.loadCurrentTroopMemberFromStorage = function() {
          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          var oldCurrentTroopMember;

          if (that.currentTroopMember) {
            oldCurrentTroopMember = that.currentTroopMember;
            that.currentTroopMember = null;
          }

          if ( ! $localMe.currentTroopMemberId ) {

            if ( that.currentTroopMemberLoadingDeferred ) {

              that.currentTroopMemberLoadingDeferred.reject();
            }
            return false;
          }

          that.currentTroopMember = TroopMemberFactory.getFirebaseObjectByKey($localMe.troopId, $localMe.currentTroopMemberId);

          if ( that.currentTroopMemberLoadingDeferred ) {

            that.currentTroopMemberLoadingDeferred.resolve();
          }

          if (oldCurrentTroopMember) {
            that.currentTroopMember.$loaded().then(function() {
              oldCurrentTroopMember.$destroy();
            });
          }
        };

        this.$doneTryingToLoadBoard = function() {

          return that.currentBoardLoadingDeferred.promise;
        };

        this.loadBoard = function(troopId, currentBoardId) {

          TroopLogger.debug(logConfig, 'loadBoard status', that.currentBoardLoadingDeferred.promise.$$state.status);

          if ( that.currentBoardLoadingDeferred.promise.$$state.status ) {
            that.currentBoardLoadingDeferred = $q.defer();
          }

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          $localMe.remember[$localMe.trooperId].lastBoardIds[troopId] = currentBoardId;

          $localMe.currentBoardId = currentBoardId;

          that.loadBoardFromStorage(troopId);

          return that.currentBoardLoadingDeferred.promise;
        };

        this.watchBoardTagNames = function(snap) {

          var tagNames = snap.val();

          that.currentBoardCards.$loaded().then(function(){

            var total = that.currentBoardCards.length;
            var uncategorizedCount = total;
            var tags = [];
            _.each(tagNames, function(tag, tagName) {



              uncategorizedCount -= tag.count || 0;

              var cleanTag = tagName;
              if ( tagName.indexOf('tag') === 0 ) {
                cleanTag = tagName.substring(3);
              }
              tag.name = tagName;
              tag.label = tag.label || cleanTag;
              tag.count = tag.count || 0;
              tag.selected = false;

              tags.push(tag);

            });

            tags = _.sortBy(tags, function (i) {
              return i.name.toLowerCase();
            });

            tags.splice(0, 0,
              {
                name: 'tp-all',
                label: 'All Cards',
                count: total,
                selected: true
              }
            );

            $sessionStorage.currentBoardTags = tags;

          });
        };

        this.initBoardTagNames = function() {

          // clear old ones
          $sessionStorage.currentBoardTags = [];

          // unwatch
          if (that.currentBoardTagNamesRef) {
            that.currentBoardTagNamesRef.off('value', that.watchBoardTagNames);
          }

          that.$doneTryingToLoadBoard()
          .then(function() {

            if ( that.currentBoard === null ) {
              return $q.reject({code: 'NO_BOARD_LOADED'});
            }

            return that.currentBoard.$loaded();
          })
          .then(function() {
            // watch just tag names for changes

            if ( ! that.currentBoard ) {

              return $q.reject({ code: 'MISSING_CURRENT_BOARD' });
            }

            that.currentBoardTagNamesRef = that.currentBoard.$ref().child('tagNames');
            that.currentBoardTagNamesRef.on('value', that.watchBoardTagNames);

          })
          .catch(function(error) {

            if (error && error.code) {

              switch ( error.code ) {

                case 'NO_BOARD_LOADED':
                  // don't continue if no board loaded
                  break;

                default:
                  TroopLogger.debug(logConfig, 'initBoardTagNames()', error);
                  break;

              }
            }
            else {
              TroopLogger.debug(logConfig, 'initBoardTagNames()', error);
            }
          });

        };

        this.loadBoardFromStorage = function(troopId) {

          TroopLogger.debug(logConfig, 'loadBoardFromStorage');

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          var oldCurrentBoardAssets;
          var oldCurrentBoardCards;
          var oldCurrentBoard;

          // clear old assets
          if (that.currentBoardAssets) {

            oldCurrentBoardAssets = that.currentBoardAssets;
            that.currentBoardAssets = null;
            that.unWatchCurrentBoardAssets();
          }

          // clear old cards
          if (that.currentBoardCards) {

            oldCurrentBoardCards = that.currentBoardCards;
            that.currentBoardCards = null;
          }

          // clear old board
          if (that.currentBoard) {

            oldCurrentBoard = that.currentBoard;
            that.currentBoard = null;
            that.unWatchCurrentBoard();
          }

          if ( ! $localMe.currentBoardId ) {

            that.currentBoardLoadingDeferred.reject({ code: 'BOARD_DOES_NOT_EXIST' });

            if ( oldCurrentBoardAssets ) {

              oldCurrentBoardAssets.$destroy();
            }

            if ( oldCurrentBoardCards ) {

              oldCurrentBoardCards.$destroy();
            }

            if ( oldCurrentBoard ) {

              oldCurrentBoard.$destroy();
            }

            return false;
          }

          // remember this board
          $localMe.remember[$localMe.trooperId].lastBoardIds[troopId] = $localMe.currentBoardId;
          that.lastBoardIds[troopId] = $localMe.currentBoardId;

          // load board and cards
          that.currentBoard = BoardFactory.getFirebaseObjectByKey(troopId, $localMe.currentBoardId);

          TroopLogger.debug(logConfig, 'loadBoardFromStorage - currentBoard',that.currentBoard);

          if ( that.currentBoardLoadingDeferred ) {

            TroopLogger.debug(logConfig, 'loadBoardFromStorage currentBoardLoadingDeferred -resolving');

            that.currentBoardLoadingDeferred.resolve();
          }

          that.currentBoard.$loaded()
          .then(function() {


            TroopLogger.debug(logConfig, 'that.currentBoard.$loaded()', 'that.currentRouteState', that.currentRouteState);

            that.unWatchCurrentBoard = that.currentBoard.$watch(function(event) {

              if ( that.currentRouteState.indexOf('.board.') ) {

                TroopLogger.debug(logConfig, 'that.currentBoard.$watch');

                var needsRedirect = false;

                switch (that.currentRouteState) {

                  case 'home.dashboard.board.cards':
                  case 'public.dashboard.board.cards':
                    needsRedirect = ! that.currentBoard.viewSettings.card.visible;
                    break;

                  case 'home.dashboard.board.tags':
                  case 'public.dashboard.board.tags':
                    needsRedirect = ! that.currentBoard.viewSettings.tag.visible;
                    break;

                  case 'home.dashboard.board.list':
                  case 'public.dashboard.board.list':
                    needsRedirect = ! that.currentBoard.viewSettings.table.visible;
                    break;

                  case 'home.dashboard.board.chat':
                  case 'public.dashboard.board.chat':
                    needsRedirect = ! that.currentBoard.viewSettings.chat.visible;
                    break;

                  case 'home.dashboard.board.grid':
                  case 'public.dashboard.board.grid':
                    needsRedirect = ! that.currentBoard.viewSettings.grid.visible;
                    break;

                  case 'home.dashboard.board.document':
                  case 'public.dashboard.board.document':
                    needsRedirect = ! that.currentBoard.viewSettings.document.visible;
                    break;
                }

                TroopLogger.debug(logConfig, 'that.currentBoard.$watch needsRedirect',needsRedirect);

                if ( needsRedirect ) {

                  var firstVisibleView = that.currentBoard.getFirstVisibleView();

                  Nav.toBoard(
                    that.currentBoard.viewMap[firstVisibleView],
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );
                }
              }
            });

            $rootScope.$broadcast('board-changed');

            if (oldCurrentBoard && oldCurrentBoard.$id) {
              oldCurrentBoard.$destroy();
            }
          });

          that.currentBoardCards = BoardFactory.getCards(troopId, $localMe.currentBoardId);
          if (oldCurrentBoardCards) {

            that.currentBoardCards.$loaded().then(function() {
              oldCurrentBoardCards.$destroy();
            });
          }

          that.currentBoardAssets = BoardFactory.getAssets(troopId, $localMe.currentBoardId);
          if (oldCurrentBoardAssets) {

            that.currentBoardAssets.$loaded().then(function() {
              oldCurrentBoardAssets.$destroy();
            });
          }

          that.unWatchCurrentBoardAssets = that.currentBoardAssets.$watch(function(event) {
            var assetId = event.key;

            switch (event.event) {

              case 'child_added':
              case 'child_changed':
                var asset = that.currentBoardAssets.$getRecord(event.key);

                if (that.computedAssetInfoCache.hasOwnProperty(assetId)) {
                  asset.formattedStorageSize = that.computedAssetInfoCache[assetId].formattedStorageSize;
                  asset.fileType = that.computedAssetInfoCache[assetId].fileType;
                }
                else {

                  if ( ! asset.formattedStorageSize ) {
                    asset.formattedStorageSize = FileFactory.formatBytes(asset.storageSize, 1);
                  }

                  if ( ! asset.fileType ) {
                    asset.fileType = FileFactory.fileTypeClass(asset.mimeType);
                  }

                  that.computedAssetInfoCache[assetId] = {
                    formattedStorageSize: asset.formattedStorageSize,
                    fileType: asset.fileType
                  };
                }
                break;

            }
          });

          // load board tags
          that.initBoardTagNames();

          TroopLogger.debug(logConfig, 'loadBoardFromStorage END');
        };

        this.setWindowUID = function() {

          var GUID = function () {

            var S4 = function () {
              return (
                Math.floor(
                  Math.random() * 0x10000 /* 65536 */
                ).toString(16)
              );
            };

            return (
              S4() + S4() + "-" +
              S4() + "-" +
              S4() + "-" +
              S4() + "-" +
              S4() + S4() + S4()
            );
          };

          if ( ! window.name.match(/^GUID-/) ) {

            window.name = "GUID-" + GUID();
          }

          that.windowUID = window.name;

          if ( ! $localStorage.windowIDs ) {

            $localStorage.windowIDs = {};
          }

          if ( ! $localStorage.windowIDs[that.windowUID] ) {

            $localStorage.windowIDs[that.windowUID] = {};
          }

          if ( ! $localStorage.windowIDs[that.windowUID].me ) {

            $localStorage.windowIDs[that.windowUID].me = {};
          }

          if ( ! $localStorage.windowIDs[that.windowUID].me.remember ) {

            $localStorage.windowIDs[that.windowUID].me.remember = {};
          }

        }
        this.$doneRedirecting = function() {
          return that.redirectingDeferred.promise;
        };
        this.loadFirstTroop = function() {
          TroopLogger.debug(logConfig, 'loadFirstTroop()');

          var troopInfo = that.getFirstTroop();
          var firstBoardId;

          TroopLogger.debug(logConfig, 'loadFirstTroop() - tryToLoadTroop');

          that.loadTroop(troopInfo.troopId)
          .then(function waitForTroopToLoad() {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - waitForTroopToLoad');
            return that.troop.$loaded();
          })
          .then(function tryToLoadTroopMember() {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - tryToLoadTroopMember');
            return that.loadTroopMember(troopInfo.troopId, troopInfo.troopMemberId);
          })
          .then(function waitForTroopMemberToLoad() {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - waitForTroopMemberToLoad');
            return that.troopMember.$loaded();
          })
          .then(function grabFirstBoard() {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - grabFirstBoard');
            return that.getFirstBoardId();
          })
          .then(function tryToLoadBoard(boardId) {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - tryToLoadBoard');
            firstBoardId = boardId;
            return that.loadBoard(troopInfo.troopId, firstBoardId);
          })
          .then(function() {

            return that.currentBoard.$loaded();
          })
          .then(function navToBoard() {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - navToBoard');

            var firstVisibleView = that.currentBoard.getFirstVisibleView();

            Nav.toBoard(
              that.currentBoard.viewMap[firstVisibleView],
              that.troop.public,
              that.troopMember.troopPermission !== 'guest',
              that.currentBoard.$id
            );

            that.redirectingDeferred.resolve();
          })
          .catch(function brokenDreamCatcher(error) {

            TroopLogger.debug(logConfig, 'loadFirstTroop() - brokenDreamCatcher', error);
          });

        };
        this.redirect = function(trooperId) {
           TroopLogger.debug(logConfig, 'redirect()', $state);
           console.log('redirect')
          if ( that.redirectingDeferred.promise.$$state.status ) {

            that.redirectingDeferred = $q.defer();
          }

          if ( ! trooperId ) {
            return false;
          }

          var troopMemberId;
          var troopId;

          that.loadTrooper(trooperId)
          .then(function waitForTrooperToLoad() {
            TroopLogger.debug(logConfig, 'redirect() - waitForTrooperToLoad');

            return that.trooper.$loaded();
          })
          .then(function setLocalToken() {

            if (
              ( ! TroopApi._token )
              && $localStorage.token
            ) {

              TroopLogger.debug(logConfig, 'redirect() - setLocalToken');
              TroopApi.setToken($localStorage.token, that.trooper.loginId);
            }
          })
          .then(function tryToLoadTroop() {
            TroopLogger.debug(logConfig, 'redirect() - tryToLoadTroop - lastTroopId:', that.lastTroopId);

            if ( ! that.lastTroopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID'});
            }

            troopId = that.lastTroopId;

            if (
              that.firebaseUser
              && that.firebaseUser.isAnonymous
            ) {
              var troops = {};
              troops[troopId] = {
                memberId: 'guest',
                troopPermission: 'guest'
              };
              that.trooper.troops = troops;
            }

            that.loadTroop(troopId);
            return that.$doneTryingToLoadTroop();
          })
          .then(function waitForTroopToLoad() {
            TroopLogger.debug(logConfig, 'redirect() - waitForTroopToLoad');

            return that.troop.$loaded();
          })
          .then(function troopDoneLoading() {
            TroopLogger.debug(logConfig, 'redirect() - troopDoneLoading');

            return that.$doneTryingToLoadAllBoards();
          })
          .then(function waitForAllBoardsToLoad() {
             TroopLogger.debug(logConfig, 'redirect() - waitForAllBoardsToLoad');

            return that.allBoards.$loaded();
          })
          .then(function allBoardsDoneLoading() {
            TroopLogger.debug(logConfig, 'redirect() - allBoardsDoneLoading');

            if ( that.firebaseUser.isAnonymous ) {
              troopMemberId = 'guest';
            }
            else if ( that.lastTroopMemberId ) {

              troopMemberId = that.lastTroopMemberId;
            }
            else {

            }

            return that.loadTroopMember(that.troop.$id, troopMemberId);
          })
          .then(function waitForTroopMemberToLoad() {
            TroopLogger.debug(logConfig, 'redirect() - waitForTroopMemberToLoad');

            return that.troopMember.$loaded();
          })
          .then(function findBoardToLoad() {
             TroopLogger.debug(logConfig, 'redirect() - findBoardToLoad');

            if (
              ( ($location.$$path || '').indexOf('/board/') === -1 )
              && ( ($location.$$path || '').indexOf('/affiliate') === -1 )
            ) {
              // isn't on a path that requires loading a board, .ie Available Boards
              that.loadBoard(that.troop.$id, null);
              return $q.reject({ code: 'SKIP_FINDING_FIRST_BOARD'});
            }

            if (
              // has a remmbered board id
              that.lastBoardIds
              && that.lastBoardIds[that.troop.$id]
            ) {

              that.loadBoard(that.troop.$id, that.lastBoardIds[that.troop.$id])
              .then(function() {

                return that.currentBoard.$loaded();
              })
              .then(function() {

                if ( ($location.$$path || '').indexOf('/card') !== -1 ) {
                  // path to board detail card
                  // no need to nav, already there
                  return $q.reject({ code: 'NO_NEED_TO_NAV'});
                }
                else if ( ($location.$$path || '').indexOf('/list') !== -1 ) {
                  // path to board card list
                  Nav.toBoardTags(
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );
                }
                else if ( ($location.$$path || '').indexOf('/grid') !== -1 ) {
                  // path to board card chat
                  Nav.toBoardGrid(
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );
                }
                else if ( ($location.$$path || '').indexOf('/chat') !== -1 ) {
                  // path to board card chat
                  Nav.toBoardChat(
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );
                }
                else if ( ($location.$$path || '').indexOf('/table') !== -1 ) {
                  // path to board card chat
                  Nav.toBoardTable(
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );
                }
                else if ( ($location.$$path || '').indexOf('/document') !== -1 ) {
                  // path to board card chat
                  Nav.toBoardDocument(

                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );
                }
                else {

                  var firstVisibleView = that.currentBoard.getFirstVisibleView();

                  Nav.toBoard(
                    that.currentBoard.viewMap[firstVisibleView],
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest',
                    that.currentBoard.$id
                  );

                }

              });



              return $q.reject({ code: 'SKIP_FINDING_FIRST_BOARD'});
            }

            return that.getFirstBoardId();

          })
          .then(function waitingForFirstBoard(boardId) {
             TroopLogger.debug(logConfig, 'redirect() - waitingForFirstBoard');

            if ( ! boardId ) {

              Nav.toAvailableBoards(
                that.troop.public,
                that.troopMember.troopPermission !== 'guest'
              );
              // $state.go('home.dashboard.boards.available');
              that.redirectingDeferred.resolve();
              return $q.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'});
            }
            return that.loadBoard(that.troop.$id, boardId);
          })
          .then(function finishUp() {
            TroopLogger.debug(logConfig, 'redirect() - finishUp');
            that.redirectingDeferred.resolve();
          })
          .catch(function(error) {


            if ( error && error.code ) {

              switch (error.code) {

                case 'SKIP_FINDING_FIRST_BOARD':
                  TroopLogger.debug(logConfig, 'redirect()', error);
                  that.redirectingDeferred.resolve();
                  break;

                case 'MISSING_TROOP_ID':
                  that.loadFirstTroop();
                  break;

                default:
                  TroopLogger.error(logConfig, 'redirect()', error);
                  break;
              }
            }
            else {
              TroopLogger.error(logConfig, 'redirect()', error);
            }
          });

        };
        this.updateWindowTitle = function(title) {

          if ( ! title ) {
            title = 'Troop';
            var diff = that.notificationBreakdown.totalNotifications - that.notificationBreakdown.totalReadNotifications;

            if (diff > 0) {
              title = '(' + diff + ') ' + title;
            }
          }

          document.title = title;
        };
        this.getFirstPublicBoardId = function() {

          var deferred = $q.defer();
          TroopLogger.debug(logConfig, 'getFirstPublicBoardId()');

          that.$doneTryingToLoadAllBoards()
          .then(function() {

            return that.allBoards.$loaded();
          })
          .then(function() {

            var publicBoards = _.where(that.allBoards, { private: false });

            if ( publicBoards.length === 0 ) {
              deferred.reject({ code: 'NO_PUBLIC_BOARDS'});
            }
            else {

              publicBoards = _.sortBy(publicBoards, function(board) {
                return board.boardName.toLowerCase();
              });

              deferred.resolve(publicBoards[0].$id);
            }
          });

          return deferred.promise;
        };
        this.getFirstBoardId = function() {

          var deferred = $q.defer();
          TroopLogger.debug(logConfig, 'getFirstBoardID()', that.troopMember);

          if ( ! that.troopMember.boards ) {

            deferred.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'})
          }
          else {

            var boards = []

            if ( that.allBoardsLoadingDeferred.promise.$$state.status ) {
              TroopLogger.debug(logConfig, 'getFirstBoardId() - allboardsloaded');
              that.allBoardsLoadingDeferred = $q.defer();
            }

            that.allBoards.$loaded().then( function() {

              var allBoards = Object.keys(that.troopMember.boards);

              _.each(allBoards, function(boardId) {

                var board = that.allBoards.$getRecord(boardId);

                if (board) {
                  boards.push(board);
                }

              });

            })
            .then(function() {
              TroopLogger.debug(logConfig, 'allboards done');
              boards = _.sortBy(boards, function(board) {

                return board.boardName.toLowerCase();
              });
            })
            .then(function() {

              TroopLogger.debug(logConfig, 'firstBoard', boards[0].$id);
              that.allBoardsLoadingDeferred.resolve();
              deferred.resolve(boards[0].$id)
            })

          }
          return deferred.promise;
        };
        this.getFirstTroop = function(trooper) {

          if ( ! trooper ) {
            trooper = that.trooper;
          }

          if ( ! trooper.troops ) {
            return false;
          }

          var firstTroop = [];

          Object.keys(trooper.troops).map(function(troopId){
            var permission = trooper.troops[troopId].troopPermission;

            if ( permission !== 'discharged' && permission !== 'banned' ) {
              firstTroop.push(troopId);
            }
          });

          return {
            troopId: firstTroop[0],
            troopMemberId: trooper.troops[firstTroop[0]].memberId
          };
        }

        this.setDevices = function(oldTroopId, oldMemberId, troopId) {

          if ( oldMemberId !== 'guest' ) {
            // not currently visiting a public troop
            // so log out of old troop
            Ref.child('members')
              .child(oldTroopId)
              .child(oldMemberId)
              .child('devices')
              .child(that.currentDevice.$id)
              .remove();

            // log in to new troop
            Ref.child('members')
              .child(troopId)
              .child(that.trooper.troops[troopId].memberId)
              .child('devices')
              .child(that.currentDevice.$id)
              .set(true);
          }

        }
        this.switchToTroop = function(troopId) {
          TroopLogger.debug(logConfig, 'switchToTroop()');
          if ( that.troop.$id === troopId && that.troopMember.troopPermission !== 'guest') {

            TroopLogger.debug(logConfig, 'troop already loaded');
            $q.reject('TROOP_ALREADY_LOADED');
          }

          var deferred = $q.defer();

          if ( ! that.firebaseUser.isAnonymous ) {
            // logged in and has troop account already

            var oldTroopId = that.troop.$id;
            var oldMemberId = that.troopMember.$id;

            if (
              that.trooper.troops
              && that.trooper.troops.hasOwnProperty(troopId)
            ) {
              // is member of troop switching to
              var boardIdToLoad;

              that.loadTroop(troopId)
              .then(function waitForTroopToLoad() {

                return that.troop.$loaded();
              })
              .then(function setDevicesAndLoadMember() {

                that.setDevices(oldTroopId, oldMemberId, troopId);

                return that.loadTroopMember(troopId, that.trooper.troops[troopId].memberId);
              })
              .then(function getBoardToLoad() {

                var deferred = $q.defer();

                if (
                  that.lastBoardIds
                  && that.lastBoardIds[that.troop.$id]
                ) {
                  deferred.resolve(that.lastBoardIds[that.troop.$id]);
                }
                else {

                  that.$doneTryingToLoadAllBoards()
                  .then(function() {

                    return that.allBoards.$loaded();
                  })
                  .then(function() {
                    return that.getFirstBoardId();
                  })
                  .then(function(boardId) {

                    if ( ! boardId ) {

                      return $q.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'});
                    }
                    else {

                      deferred.resolve(boardId);
                    }
                  })
                  .catch(function(error) {

                    deferred.reject(error);
                  });
                }

                return deferred.promise;

              })
              .then(function loadBoard(boardId) {

                TroopLogger.debug(logConfig, "loadBoard", boardId);

                boardIdToLoad = boardId;
                return that.loadBoard(that.troop.$id, boardId);
              })
              .then(function waitForBoardToLoad() {

                return that.currentBoard.$loaded()
              })
              .then(function clearSearchStuff() {

                if ( SearchFactory ) {
                  // errase search field
                  SearchFactory.searchString = null;
                  SearchFactory.searchResults = {
                    all: null,
                    curr: null,
                    chat: null
                  };
                  SearchFactory.searchLastBoard = null;
                }

              })
              .then(function navToBoardCards() {

                var firstVisibleView = that.currentBoard.getFirstVisibleView();
                TroopLogger.debug(logConfig, 'navToBoardCards - firstVisibleView: ', firstVisibleView);

                Nav.toBoard(
                  that.currentBoard.viewMap[firstVisibleView],
                  that.troop.public,
                  that.troopMember.troopPermission !== 'guest',
                  that.currentBoard.$id
                );

              })
              .catch(function(error) {

                TroopLogger.error(logConfig, error);

                switch ( error.code ) {

                  case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
                    Nav.toAvailableBoards(false, true);
                    break;
                }

              })
              .finally(function() {

                that.redirectingDeferred.resolve();
              });

            }
            else {
              // not member of that troop yet

              that.loadTroop(troopId)
              .then(function waitForTroopToLoad() {

                return that.troop.$loaded();
              })
              .then(function setDevicesAndLoadMember() {
                // if not a member of troop yet but logged in, must be
                // now going to a public troop

                // log out of old 'device'
                Ref.child('members')
                  .child(oldTroopId)
                  .child(oldMemberId)
                  .child('devices')
                  .child(that.currentDevice.$id)
                  .remove();

                return that.loadTroopMember(troopId, 'guest');
              })
              .then(function getBoardToLoad() {

                var deferred = $q.defer();

                if (

                  that.lastBoardIds
                  && that.lastBoardIds[that.troop.$id]
                ) {

                  deferred.resolve(that.lastBoardIds[that.troop.$id]);
                }
                else {

                  that.$doneTryingToLoadAllBoards()
                  .then(function() {

                    return that.allBoards.$loaded();
                  })
                  .then(function() {

                    return that.getFirstBoardId();
                  })
                  .then(function(boardId) {

                    if ( ! boardId ) {

                      return $q.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'});
                    }
                    else {

                      deferred.resolve(boardId);
                    }
                  })
                  .catch(function(error) {
                    TroopLogger.error(logConfig, error);
                    deferred.reject(error);
                  });
                }

                return deferred.promise;

              })
              .then(function loadBoard(boardId) {
                boardIdToLoad = boardId;
                return that.loadBoard(that.troop.$id, boardId);
              })
              .then(function waitForBoardToLoad() {

                return that.currentBoard.$loaded()
              })
              .then(function clearSearchStuff() {

                if ( SearchFactory ) {
                  // errase search field
                  SearchFactory.searchString = null;
                  SearchFactory.searchResults = {
                    all:null,
                    curr:null,
                    chat:null
                  };
                  SearchFactory.searchLastBoard = null;
                }

              })
              .then(function navToBoard() {

                var firstVisibleView = that.currentBoard.getFirstVisibleView();

                Nav.toBoard(
                  that.currentBoard.viewMap[firstVisibleView],
                  that.troop.public,
                  that.troopMember.troopPermission !== 'guest',
                  that.currentBoard.$id
                );

              })
              .catch(function(error) {

                TroopLogger.error(logConfig, error);

                switch ( error.code ) {

                  case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
                    Nav.toAvailableBoards(false, true);
                    break;
                }

              })
              .finally(function() {

                that.redirectingDeferred.resolve();
              });

            }

          }
          else {
            // guest visitor
            deferred.resolve();
          }

          return deferred.promise;
        };

        this.navToBoard = function() {

          that.$doneTryingToLoadBoard()
          .then(function() {

            return that.currentBoard.$loaded();
          })
          .then(function() {

            var firstVisibleView = that.currentBoard.getFirstVisibleView();

            Nav.toBoard(
              that.currentBoard.viewMap[firstVisibleView],
              that.troop.public,
              that.troopMember.troopPermission !== 'guest',
              that.currentBoard.$id
            );

          });
        };
        this.navToTeamBoards = function() {

          Nav.toAvailableBoards(
            that.troop.public,
            that.troopMember.troopPermission !== 'guest'
          );
          // $state.go('home.dashboard.boards.available');
        };
        this.getRecentPublicTroops = function() {
          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( ! $localMe.recentTroops ) {
            $localMe.recentTroops = {};
          }

          return $localMe.recentTroops;
        }
        this.addToRecentPublicTroops = function(troopId, troopSlug) {
          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( ! $localMe.recentTroops ) {
            $localMe.recentTroops = {};
          }

          $localMe.recentTroops[troopId] = troopSlug;


        }
        this.storeTroopToJoin = function(troopId) {
          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( ! $localMe.troopToJoin ) {
            $localMe.troopToJoin = '';
          }

          $localMe.troopToJoin = troopId;
        }
        this.getTroopToJoin = function() {
          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( ! $localMe.troopToJoin ) {
            $localMe.troopToJoin = '';
          }

          return $localMe.troopToJoin;
        }
        this.joinPublicTroop = function(troopId, troopMemberId) {

          var deferred = $q.defer();

          that.loadTroop(troopId)
          .then(function waitForTroopToLoad() {

            return that.troop.$loaded();
          })
          .then(function loadTroopMembers() {

            return that.$doneTryingToLoadTroopMembers();
          })
          .then(function waitForTroopMembersToLoad() {

            return that.troopMembers.$loaded();
          })
          .then(function tryToLoadTroopMember() {

            return that.loadTroopMember(troopId, troopMemberId);
          })
          .then(function waitingForTroopMemberToLoad() {

            return that.troopMember.$loaded();
          })
          .then(function loadBoard() {

            that.loadBoard(troopId, that.allBoards[0].$id);

            return that.$doneTryingToLoadBoard();
          })
          .then(function waitFOrBoardToLoad() {

            return that.currentBoard.$loaded();
          })
          .then(function doneCheckingAuth() {

            if (
              that.trooper.hasOwnProperty('troops')
              && that.trooper.troops[troopId]
              && that.trooper.troops[troopId].troopPermission !== 'discharged'
              && that.trooper.troops[troopId].troopPermission !== 'banned'
            ) {

              that.switchToTroop(troopId)
              .then(function() {

                deferred.resolve();
              });

            }
            else {

              deferred.reject({ code: 'TROOPER_NOT_MEMBER_OF_TROOP' });
            }

          })
          .catch(function(error) {

            if ( error && error.code) {

              switch (error.code) {

                case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
                  Nav.toAvailableBoards(
                    that.troop.public,
                    that.troopMember.troopPermission !== 'guest'
                  );
                  // $state.go('home.dashboard.boards.available');
                  break;
              }
            }

            deferred.reject(error);
          });

          return deferred.promise;
        }
        this.removeTroopToJoin = function() {
          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if ( ! $localMe.troopToJoin ) {
            $localMe.troopToJoin = '';
          }

          $localMe.troopToJoin = '';
        }
        this.loadCurrentNoteEntry = function(cardId) {

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if (! $localMe.enteredNotes)
          {

            $localMe.enteredNotes= {};
            $localMe.enteredNotes[cardId] = "";

          }

          return $localMe.enteredNotes[cardId];

        }
        this.setCurrentNoteEntry = function(noteEntry, cardId) {


          var $localMe = $localStorage.windowIDs[that.windowUID].me;


          $localMe.enteredNotes[cardId] = noteEntry;


        }
        this.loadCurrentChatEntry = function(chatId) {

          var $localMe = $localStorage.windowIDs[that.windowUID].me;

          if (! $localMe.enteredChats)
          {

            $localMe.enteredChats= {};
            $localMe.enteredChats[chatId] = "";

          }

          return $localMe.enteredChats[chatId];

        }
        this.setCurrentChatEntry = function(chatEntry, type) {


          var $localMe = $localStorage.windowIDs[that.windowUID].me;


          if (type === "one2one") {

            $localMe.enteredChats[this.troopMember.memberChats[this.currentTroopMember.$id]] = chatEntry;
          }
          else if (type === "board") {

            $localMe.enteredChats[this.currentBoard.chatId] = chatEntry;

          }


        }
        this.setWindowUID();

        return this;
      }
    ]);
