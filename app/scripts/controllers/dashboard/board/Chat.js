(function() {

/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */



'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:BoardChatCtrl
 * @description
 * # BoardChatCtrl
 * Controller of the webClientApp
 */
angular
.module('webClientApp')
.controller('BoardChatCtrl', BoardChatCtrl);

BoardChatCtrl.$inject = [
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
  'agLogger',
  'TroopLogger'
];

return;

function BoardChatCtrl(
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
  agLogger,
  TroopLogger
) {

  var logConfig = {
    slug: 'controller: Board Chat - ',
    path: [ 'controllers', 'dashboard', 'board', 'Chat.js' ]
  };

  var that = this;
  this.chatEntries = null;
  this.masterIndex = null;
  this.processing = false;
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
      boardId: Me.currentBoard.$id,
      chatId: Me.currentBoard.chatId,
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
      TroopLogger.error(logConfig, 'this.uploadFile()',error);
      //TroopLogger.debug(logConfig, error);
    });


  };

  this.init = function(chatId) {

    $scope.chatEntry = Me.loadCurrentChatEntry(chatId);

    Me.currentBoardAssets.$loaded().then(function() {

      $scope.data.chatEntries = ChatEntryFactory.getEntries(Me.troop.$id, chatId);

      TroopLogger.debug(logConfig,'got entries', $.extend({}, $scope.data.chatEntries));

      $scope.data.chatEntries.$watch(function(event) {
        switch (event.event) {

          case 'child_added':

            var entry = $scope.data.chatEntries.$getRecord(event.key);
            var prev = _.last($scope.data.chatEntries, 2)[0];

            entry.prevEntry = prev;

            if (entry.assetId) {
              $scope.data.chatAssets[entry.assetId] = Me.currentBoardAssets.$getRecord(entry.assetId);
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
              if ($scope.tpDataPumpItems) {
                $scope.tpDataPumpItems.push(
                  $scope.data.chatEntries.$getRecord(event.key)
                );
              }
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

    Me.currentBoardAssets.$watch(function(event) {
      var assetId = event.key;

      switch (event.event) {

        case 'child_added':
        case 'child_changed':
          var asset = Me.currentBoardAssets.$getRecord(event.key);

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

  $scope.showPublicTroopJoinModal = function() {

    if ( Me.modalIsOn ) {

      return;
    }

    if ( ! that.processing ) {
        that.processing = true;
        ModalService.showModal({
          templateUrl: '/views/modal/public-troop-join.html',
          controller: 'PublicTroopJoinModalCtrl as vm'
        }).then(function(modal) {

          modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

          modal.close.then(function(result) {
            that.processing = false;
          });
      });
    }
  }
  $scope.newChatFocus = function() {

    if ( Me.troopMember.troopPermission === 'guest' ) {
      $scope.showPublicTroopJoinModal();
    }
  }
  $scope.chatEntryTyping = function() {

    if ( Me.troopMember.troopPermission === 'guest' ) {
      $scope.showPublicTroopJoinModal();
      $scope.chatEntry = '';
    }
    else {

      if ( that.chatEntryTypingDebounce ) {
        $timeout.cancel(that.chatEntryTypingDebounce);
      }

      that.chatEntryTypingDebounce = $timeout(function(){

        Me.setCurrentChatEntry($scope.chatEntry, 'board');
        that.chatEntryTypingDebounce = null;

      }, 1000);

    }
  }
  $scope.chatEntrySubmit = function($event) {

    if ( Me.troopMember.troopPermission !== 'guest' ){
      if ( $.trim($scope.chatEntry) ) {

        ChatEntryFactory.create({
          chatId: Me.currentBoard.chatId,
          memberId: Me.troopMember.$id,
          troopId: Me.troopMember.troopId,
          text: $scope.chatEntry
        })
        .then(function(chatEntryRef) {

        })
        .catch(function(error) {
          TroopLogger.error(logConfig, '$scope.chatEntrySubmit()',error);
          //TroopLogger.debug(logConfig, error);
        });
      }
      $scope.chatEntry = '';
      Me.setCurrentChatEntry($scope.chatEntry, "board")
    }
  };

  $scope.filesAdded = function($files, $file, $event) {

    _.each($files, function(file) {

      that.uploadFile(file);

    });

  };
  $scope.customTracking = function(index,id) {
    return index+'-'+id;
  }


  $scope.$on('$destroy', function() {

    if ( $scope.data.chatEntries.hasOwnProperty('$destroy') ) {

      $scope.data.chatEntries.$destroy();
    }

  });

  Auth.$loaded()
  .then(function() {
    TroopLogger.debug(logConfig, 'Auth.$loaded()');
    return Me.$doneRedirecting();
  })
  .catch(function(error) {
    TroopLogger.error(logConfig, 'Auth.$loaded ERROR',error);

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
  .then(function doneLoadingTroop() {

    return Me.$doneTryingToLoadTroop();
  })
  .then(function TrooperLoaded() {

    TroopLogger.debug(logConfig, 'doneLoadingTroop',Me);

    TroopLogger.debug(logConfig, 'Me.$doneTryingToLoadTroop()');
    return Me.trooper.$loaded();
  })
  .then(function doneLoadingTroopMember() {

    TroopLogger.debug(logConfig, 'Me.trooper.$loaded()', Me.trooper);
    return Me.$doneTryingToLoadTroopMember();
  })
  .then(function troopMemberLoaded() {

    TroopLogger.debug(logConfig, 'TrooperLoaded',Me.trooper);

    TroopLogger.debug(logConfig, 'Me.$doneTryingToLoadTroopMember()');
    return Me.troopMember.$loaded();
  })
  .then(function doneLoadingTroop() {

    TroopLogger.debug(logConfig, 'Me.troopMember.$loaded()', Me.troopMember);
    return Me.$doneTryingToLoadTroop();
  })
  .then(function troopLoaded() {

    TroopLogger.debug(logConfig, 'Me.$doneTryingToLoadTroop()');
    return Me.troop.$loaded();
  })
  .then(function startToLoadCurrentBoard() {

    TroopLogger.debug(logConfig, 'TroopLoaded',Me.troop);

    TroopLogger.debug(logConfig, 'Me.troop.$loaded()', Me.troop);
    if ( ( ! Me.currentBoard ) || Me.currentBoard.$id !==  $stateParams.boardId ) {

      Me.loadBoard(Me.troop.$id, $stateParams.boardId);
    }

    return Me.$doneTryingToLoadBoard();
  })
  .then(function currentBoardLoaded() {

    TroopLogger.debug(logConfig, 'Me.$doneTryingToLoadBoard()');
    return Me.currentBoard.$loaded();
  })
  .then(function currentBoardAssetsLoaded() {

    TroopLogger.debug(logConfig, 'currentBoardLoaded',Me.currentBoard);

    TroopLogger.debug(logConfig, 'Me.currentBoard.$loaded()', $.extend({},Me.currentBoard));

    $scope.emptyInfo.title = Me.currentBoard.boardName;
    $scope.emptyInfo.description = Me.currentBoard.description;

    $rootScope.$broadcast('current-tag-filter-changed');

    $rootScope.$broadcast('board-chat-view-loaded');

    return Me.currentBoardAssets.$loaded();
  })
  .then(function finishingCurrentBoardChat() {
    TroopLogger.debug(logConfig,'we should have this ID at this point',Me.currentBoard.chatId);
    // timeout should help to fix missing chats due to
    // Me.currentBoard.chatId no loading fast enaugh
    //
    TroopLogger.debug(logConfig, 'Me.currentBoardAssets.$loaded()', Me.currentBoardAssets);

    if ( ! Me.currentBoard.chatId ) {

      TroopLogger.warn(logConfig, 'NO "board chatId" Creating new boardChat',$.extend({},Me.currentBoard));

      ChatFactory.create({
        troopId: Me.troop.$id,
        boardId: $stateParams.boardId,
      })
      .then(function(chatRef) {

        that.init(chatRef.key);

      })
      .catch(function(error) {
        TroopLogger.error(logConfig, 'ChatFactory.create()',error);
        //TroopLogger.debug(logConfig, error);
      });
    }
    else {

      TroopLogger.debug(logConfig, 'Me.currentBoard.chatId', Me.currentBoard.chatId);
      that.init(Me.currentBoard.chatId);
    }
    //  return Me.$doneTryingToLoadNotifications();
  });

}


})();
