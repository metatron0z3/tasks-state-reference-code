/* global Firebase */
/* jshint -W086 */

(function () {
  'use strict';

  /**
   * @ngdoc directive
   * @name webClientApp.directive:tpNotification
   * @description
   * # tpNotification
   */

  angular
    .module('webClientApp')
    .directive('tpNotification', tpNotification);

  function tpNotification() {
    var directive = {
      restrict: 'A',
      scope: {
        notification: '=tpNotification',
        list: '=tpNotificationList'
      },
      controller: tpNotificationController,
      controllerAs: 'vm',
      bindToController: true, // because the scope is isolated
      templateUrl: '/views/directives/troop/tp-notification.html'
    };

    return directive;
  }

  tpNotificationController.$inject = [
    '$rootScope',
    '$scope',
    '$element',
    '$timeout',
    '$firebaseObject',
    'Me',
    'Ref',
    'Nav',
    'NotificationFactory',
    'TroopMemberFactory',
    'TroopApi',
    'TroopLogger'
  ];

  function tpNotificationController(
    $rootScope,
    $scope,
    $element,
    $timeout,
    $firebaseObject,
    Me,
    Ref,
    Nav,
    NotificationFactory,
    TroopMemberFactory,
    TroopApi,
    TroopLogger
  ) {
    var logConfig = {
      slug: 'directive: Notification - ',
      path: [ 'directives', 'troop', 'tpNotification.js']
    };

    /* jshint validthis: true */
    var vm = this;
    vm.board = null;
    vm.card = null;
    vm.note = null;
    vm.chatEntry = null;
    vm.unWatchBoard = null;
    vm.unWatchCard = null;
    vm.unWatchNote = null;
    vm.unWatchChatEntry = null;
    vm.onClick = onClick;
    vm.onAcceptBoardInvitation = onAcceptBoardInvitation;
    vm.onDeclineBoardInvitation = onDeclineBoardInvitation;

    activate();

    return;

    function activate() {

      if ( vm.notification && vm.list ) {

        vm.fromMember = vm.list.fromMembers[vm.notification.fromMemberId];

        vm.type = {};
        vm.type[vm.notification.notificationType] = true;

        loadDependencies();
        if ( ! vm.notification.isRead ) {
          $element.one('mouseenter', markAsRead);
        }

        vm.loaded = true;
      }


      $scope.$on('$destroy', function() {

        if ( vm.unWatchBoard ) {

          vm.unWatchBoard();
          vm.unWatchBoard = null;
        }


        if ( vm.unWatchCard ) {

          vm.unWatchCard();
          vm.unWatchCard = null;
        }

        if ( vm.unWatchNote ) {

          vm.unWatchNote();
          vm.unWatchNote = null;
        }

        if ( vm.unWatchChatEntry ) {

          vm.unWatchChatEntry();
          vm.unWatchChatEntry = null;
        }

      });

    }

    function loadDependencies() {


      switch ( vm.notification.notificationType ) {

        case 'directMessage':
          vm.chatEntry = vm.list.chatEntries[vm.notification.chatEntryId];
          listenForChatEntryChanges();
          break;

        case 'boardMesage':
          vm.chatEntry = vm.list.chatEntries[vm.notification.chatEntryId];
          vm.board = vm.list.boards[vm.notification.boardId];
          listenForChatEntryChanges();
          listenForBoardChanges();
          break;

        case 'newNote':
          vm.note = vm.list.notes[vm.notification.noteId];
          listenForNoteChanges();
        case 'newCard':
          vm.card = vm.list.cards[vm.notification.cardId];
          listenForCardChanges();
        case 'newBoard':
        case 'inviteToBoard':
          vm.board = vm.list.boards[vm.notification.boardId];
          listenForBoardChanges();
          break;

        default:
          break;
      }

    }

    function listenForNoteChanges() {

      if ( vm.note ) {
        vm.unWatchNote = vm.note.$watch(function(event) {

          if ( vm.note.$value === null ) {
            // note deleted
            vm.list.$firebaseArray.$remove(vm.notification);
          }
        });
      }
      else {
        vm.list.$firebaseArray.$remove(vm.notification);
      }
    }

    function listenForCardChanges() {

      vm.unWatchCard = vm.card.$watch(function(event) {

        if ( vm.card.$value === null ) {
          // card deleted
          vm.list.$firebaseArray.$remove(vm.notification);
        }
        else if ( vm.card.archived ) {
          // card archived
          vm.list.$firebaseArray.$remove(vm.notification);
        }

      });
    }

    function listenForBoardChanges() {

      vm.unWatchBoard = vm.board.$watch(function(event) {

        if ( vm.board.$value === null ) {
          // board deleted
          vm.list.$firebaseArray.$remove(vm.notification);
        }
        else if ( vm.board.archived ) {
          // board archived
          vm.list.$firebaseArray.$remove(vm.notification);
        }

      });
    }

    function listenForChatEntryChanges() {
      // TODO: this one too
    }

    function markAsRead() {

      vm.notification.isRead = true;
      vm.list.$firebaseArray.$save(vm.notification);
    }

    function onClick($event) {

      switch ( vm.notification.notificationType ) {

        case 'directMessage':
          break;

        case 'boardMesage':
          break;

        case 'newNote':
          toBoardCard();
          break;

        case 'newCard':
          toBoardCard();
          break;

        case 'newBoard':
          toBoardCards();
          break;

        case 'inviteToBoard':
          break;

        default:
          break;
      }

      $rootScope.showNotifications = false;
    }

    function toBoardCards() {

      if (
        Me.currentBoard
        && Me.currentBoard.$id === vm.notification.boardId
      ) {

        Nav.toBoardCards(
          vm.list.$troop.public,
          vm.list.$troopMember.troopPermission !== 'guest',
          vm.notification.boardId
        );
      }
      else {

        Me.loadBoard(Me.troop.$id, vm.notification.boardId)
        .then(function() {

          return Me.currentBoardCards.$loaded();
        })
        .then(function() {

          Nav.toBoardCards(
            vm.list.$troop.public,
            vm.list.$troopMember.troopPermission !== 'guest',
            vm.notification.boardId
          );
        });
      }


    }

    function toBoardCard() {

      if (
        Me.currentBoard
        && Me.currentBoard.$id === vm.notification.boardId
      ) {

        Nav.toBoardCard(
          vm.list.$troop.public,
          vm.list.$troopMember.troopPermission !== 'guest',
          vm.notification.boardId,
          vm.notification.cardId
        );
      }
      else {

        Me.loadBoard(Me.troop.$id, vm.notification.boardId)
        .then(function() {

          return Me.currentBoardCards.$loaded();
        })
        .then(function() {

          Nav.toBoardCard(
            vm.list.$troop.public,
            vm.list.$troopMember.troopPermission !== 'guest',
            vm.notification.boardId,
            vm.notification.cardId
          );
        });
      }
    }

    function onAcceptBoardInvitation(){

      TroopApi.acceptBoardInvite({
        memberId: Me.troopMember.$id,
        boardId: vm.notification.boardId,
        troopId: vm.notification.troopId,
        inviteId: vm.notification.inviteId,
        reject: false
      })
      .then(function() {
        // remove notification from FB and the sidebar
        vm.list.$firebaseArray.$remove(vm.notification);

        Me.loadBoard(Me.troop.$id, vm.notification.boardId);
        return Me.$doneTryingToLoadBoard();

      })
      .then(function() {
        return Me.currentBoard.$loaded();
      })
      .then(function(){

        var firstVisibleView = Me.currentBoard.getFirstVisibleView();

        Nav.toBoard(
          Me.currentBoard.viewMap[firstVisibleView],
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          Me.currentBoard.$id
        );

        return;
      })
      .then(function(){
        //If you are an admin on the troop you should be a moderator on the board

        var permission = 'member';
        if (Me.troopMember.troopPermission === 'admin')
        {
          permission = 'admin'
        }
        TroopMemberFactory.setBoardPermission({
          troopId: Me.troop.$id,
          memberId: Me.troopMember.$id,
          boardId: Me.currentBoard.$id,
          permission: permission
        });
      })
      .catch(function(error) {
        TroopLogger.error(logConfig,error);

        if ( error ) {

          switch (error.code) {

            case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
              $scope.close();
              Nav.toAvailableBoards(
                Me.troop.public,
                Me.troopMember.troopPermission !== 'guest'
              );
              break;
          }
        }
      });
    }

    function onDeclineBoardInvitation() {

      TroopApi.acceptBoardInvite({
        memberId: Me.troopMember.$id,
        boardId: vm.notification.boardId,
        troopId: vm.notification.troopId,
        inviteId: vm.notification.inviteId,
        reject: true
      })
      .then(function() {
        // remove notification from FB and the sidebar
        vm.list.$firebaseArray.$remove(vm.notification);

        return;
      })
      .catch(function(error) {
        TroopLogger.error(logConfig,error);

      });
    }

  } // end of tpNotificationController

})(); // end of file
