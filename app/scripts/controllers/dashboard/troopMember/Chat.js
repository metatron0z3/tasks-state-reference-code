(function() {

'use strict';

/**
* @ngdoc function
* @name webClientApp.controller:TroopMemberChatCtrl
* @description
* # TroopMemberChatCtrl
* Controller of the webClientApp
*/
angular.module('webClientApp')
.controller('TroopMemberChatCtrl', TroopMemberChatCtrl);

TroopMemberChatCtrl.$inject = [
  '$scope',
  '$rootScope',
  '$localStorage',
  '$state',
  '$stateParams',
  '$location',
  '$anchorScroll',
  '$timeout',
  '$q',
  'Auth',
  'Ref',
  'Me',
  'ModalService',
  'BoardFactory',
  'AssetFactory',
  'ChatFactory',
  'ChatEntryFactory',
  'FileFactory',
  'TroopLogger',
];

return;

function TroopMemberChatCtrl(
  $scope,
  $rootScope,
  $localStorage,
  $state,
  $stateParams,
  $location,
  $anchorScroll,
  $timeout,
  $q,
  Auth,
  Ref,
  Me,
  ModalService,
  BoardFactory,
  AssetFactory,
  ChatFactory,
  ChatEntryFactory,
  FileFactory,
  TroopLogger
) {

  var logConfig = {
    slug: 'controller: Troop Member Chat - ',
    path: [ 'controllers', 'dashboard', 'troopMember', 'Chat.js' ]
  };

  var that = this
  this.currentTroopMemberAssets = null;
  this.masterIndex = null;
  that.chatEntryTypingDebounce = null;

  $scope.Me = Me;
  $scope.loading = true;
  $scope.entries = [];
  $scope.data = {
    chatEntries: null,
    chatAssets: {}
  };
  $scope.chatMenus = {};
  $scope.emptyInfo = {
    title: '',
    description: ''
  };

  $scope.$storage = $localStorage;

  this.uploadFile = function($file) {

    ChatEntryFactory.uploadAsset({
      $file: $file,
      troopId: Me.troop.$id,
      chatId: that.chatId,
      memberId: Me.troopMember.$id,
      createdByUserId: Me.trooper.$id,
      order: 1
    })
    .then(function(chatEntryResp) {


      chatEntryResp.uploader.finally(
        function(resp) {
          // upload complete
          //asset.file.state = 'complete';
        },
        function(evt) {
          // upload notify
          //asset.progress = parseInt(100.0 * evt.loaded / evt.total);
        }
      );

    })
    .catch(function(error) {

    });
  };

  this.init = function(chatId) {

    $scope.chatEntry = Me.loadCurrentChatEntry(chatId)

    that.chatId = chatId;

    that.currentTroopMemberAssets = ChatFactory.getAssets(Me.troop.$id, chatId);

    that.currentTroopMemberAssets.$loaded().then(function() {

      $scope.data.chatEntries = ChatEntryFactory.getEntries(Me.troop.$id, chatId);

      $scope.data.chatEntries.$watch(function(event) {
        
        switch (event.event) {

          case 'child_added':

            var entry = $scope.data.chatEntries.$getRecord(event.key);
            var prev = _.last($scope.data.chatEntries, 2)[0];

            entry.prevEntry = prev;


            if ( entry.assetId ) {

              $scope.data.chatAssets[entry.assetId] = that.currentTroopMemberAssets.$getRecord(entry.assetId);
            }

            break;

          case 'child_changed':
            break;

        }

      });

      $scope.data.chatEntries.$loaded().then(function() {

        if ( $scope.data.chatEntries[0] ) {

          $scope.data.chatEntries[0].first = true;
        }

        var prev = null;
        _.each( $scope.data.chatEntries, function(entry,idx) {

          if ( prev !== null ) {

            $scope.data.chatEntries[idx].prevEntry = prev;
          }

          prev = entry;
        });

        $scope.loading = false;

        // after initiall entries loaded, keep watching for the new entries
        $scope.data.chatEntries.$watch(function(event) {

          switch (event.event) {

            case 'child_added':
              $scope.tpDataPumpItems.push(
                $scope.data.chatEntries.$getRecord(event.key)
              );
              break;

            case 'child_removed':
              $scope.tpDataPumpItems = _.filter($scope.tpDataPumpItems, function(item){
                return item.$id !== event.key;
              });
              break;
          }
        });

      });

    });

    that.currentTroopMemberAssets.$watch(function(event) {

      var assetId = event.key;

      switch (event.event) {

        case 'child_added':
        case 'child_changed':
          var asset = that.currentTroopMemberAssets.$getRecord(event.key);

          if (Me.computedAssetInfoCache.hasOwnProperty(assetId)) {
            asset.formattedStorageSize = Me.computedAssetInfoCache[assetId].formattedStorageSize;
            asset.fileType = Me.computedAssetInfoCache[assetId].fileType;
          }
          else {

            if ( ! asset.formattedStorageSize ) {
              asset.formattedStorageSize = FileFactory.formatBytes(asset.storageSize, 1);
            }

            if ( ! asset.fileType ) {
              asset.fileType = FileFactory.fileTypeClass(asset.mimeType);
            }

            Me.computedAssetInfoCache[assetId] = {
              formattedStorageSize: asset.formattedStorageSize,
              fileType: asset.fileType
            }
          }
          break;

      }

    });

  };

  $scope.chatEntryTyping = function() {

    if ( that.chatEntryTypingDebounce ) {
      $timeout.cancel(that.chatEntryTypingDebounce);
    }

    that.chatEntryTypingDebounce = $timeout(function(){

      Me.setCurrentChatEntry($scope.chatEntry, 'one2one');
      that.chatEntryTypingDebounce = null;

    }, 1000);
  };

  $scope.chatEntrySubmit = function($event) {

    TroopLogger.debug(logConfig, 'chatEntrySubmit()')

    if ( $.trim($scope.chatEntry) ) {

      var chatEntryRef = ChatEntryFactory.create(
        {
          chatId: Me.troopMember.memberChats[Me.currentTroopMember.$id],
          memberId: Me.troopMember.$id,
          troopId: Me.troop.$id,
          text: $scope.chatEntry
        },
        function() {

        }
      );
    }
    $scope.chatEntry = '';
    Me.setCurrentChatEntry($scope.chatEntry, "one2one")
  };
  $scope.filesAdded = function($files, $file, $event) {

    _.each($files, function(file) {

      that.uploadFile(file);

    });

  };
  $scope.customTracking = function(index,id) {
    return index+id;
  }

  Auth.$loaded().then(function() {

    return Me.$doneRedirecting();
  })
  .catch(function(error) {

    if ( error && error.code ) {

      switch (error.code) {

        case 'SIGNING_IN':
          // continue loading if signing in
          return this;
          break;
      }
    }

    // otherwise skip loading
    return $q.reject(error);
  })
  .then(function() {

    return Me.$doneTryingToLoadTrooper();
  })
  .then(function() {

    return Me.trooper.$loaded();
  })
  .then(function() {

    return Me.$doneTryingToLoadTroopMember();
  })
  .then(function() {

    return Me.troopMember.$loaded();
  })
  .then(function() {

    $scope.currentMemberId = Me.troopMember.$id;
    var boardChanged =  false;

    if ( ( ! Me.currentTroopMember ) || Me.currentTroopMember.$id !==  $stateParams.troopMemberId ) {

      boardChanged = true;

      Me.loadCurrentTroopMember($stateParams.troopMemberId);
    }

    return Me.$doneTryingToLoadCurrentTroopMember();
  })
  .then(function() {

    return Me.currentTroopMember.$loaded();
  })
  .then(function() {

    $scope.emptyInfo.title = Me.currentTroopMember.name;
    $scope.emptyInfo.description = Me.currentTroopMember.title;

    if ( ! Me.troopMember.memberChats ) {
      Me.troopMember.memberChats = {};
    }

    if ( ! Me.troopMember.memberChats.hasOwnProperty(Me.currentTroopMember.$id) ) {

      var chatRef = ChatFactory.create(
        {
          troopId: Me.troop.$id,
          memberId: Me.troopMember.$id,
          talkingToTroopMemberId: Me.currentTroopMember.$id
        })
        .then(function(chatRef) {

          that.init(chatRef.key);
        })
    }
    else {

      that.init(Me.troopMember.memberChats[Me.currentTroopMember.$id]);
    }

    return Me.$doneTryingToLoadNotifications();
  })
  .then(function() {
    //
    // TOMAS -- I'm getting error at this line - only first load
    // "Cannot read property '$firebaseArray' of undefined"
    //

    return Me.notifications[Me.troopMember.$id].$firebaseArray.$loaded();
  })
  .then(function() {

    _.each(Me.notifications[Me.troopMember.$id].$firebaseArray, function(notification) {
      if (
        ( ! notification.isRead )
        && notification.notificationType === 'directMessage'
        && notification.fromMemberId === Me.currentTroopMember.$id
      ) {

        Ref.child('notifications')
          .child(Me.trooper.$id)
          .child(Me.troop.$id)
          .child(notification.$id)
          .update({
            isRead: true,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
          });
      }
    });

    Me.notifications[Me.troopMember.$id].$firebaseArray.$watch(function(event) {

      var notification = Me.notifications[Me.troopMember.$id].$firebaseArray.$getRecord(event.key);

      if ( ! notification ) {
        return false;
      }

      if (event.event === 'child_changed') {

      }
      else if (
        event.event === 'child_added'
        && notification.notificationType === 'directMessage'
        && ( ! notification.isRead )
        && $state.current
        && $state.current.name
        && $state.current.name === 'home.dashboard.troopMember.chat'
        && Me.currentTroopMember
        && notification.fromMemberId === Me.currentTroopMember.$id
      ) {

        Ref.child('notifications')
          .child(Me.trooper.$id)
          .child(Me.troop.$id)
          .child(notification.$id)
          .update({
            isRead: true,
            updatedAt: firebase.database.ServerValue.TIMESTAMP
          });
      }
    });
  });


  $rootScope.$broadcast('current-tag-filter-changed');

  $rootScope.$broadcast('troop-member-chat-view-loaded');


}



})();
