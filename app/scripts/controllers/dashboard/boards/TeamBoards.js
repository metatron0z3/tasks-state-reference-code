'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TeamBoardsCtrl
 * @description
 * # TeamBoardsCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'TeamBoardsCtrl',
    [
      '$scope',
      '$rootScope',
      '$state',
      '$stateParams',
      '$timeout',
      '$filter',
      'Me',
      'Nav',
      'Auth',
      'BoardFactory',
      'ModalService',
      'SecurityFactory',
      function TeamBoardsCtrl(
        $scope,
        $rootScope,
        $state,
        $stateParams,
        $timeout,
        $filter,
        Me,
        Nav,
        Auth,
        BoardFactory,
        ModalService,
        SecurityFactory
      ) {

        var that = this;

        Me.currentTagFilter = null;

        $scope.Me = Me;
        $scope.canDisplayMembers = false;

        this.showMessageModal = function(message) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/message.html',
            controller: 'MessageModalCtrl'
          }).then(function(modal) {

            modal.scope.message = message;

            modal.scope.accept = function() {

              modal.scope.close();
            };

            modal.close.then(function(result) {

            });

          });
        };
        this.showLeaveBoardModal = function(board) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/delete.html',
            controller: 'DeleteModalCtrl as vm'
          }).then(function(modal) {

            modal.controller.extraClasses = 'leave-board-modal';
            modal.controller.header = 'Leave Board';
            modal.controller.message =
                'Are you sure you want to leave the "<b>'
                + board.boardName
                + '</b>" board?';
            modal.controller.actionTaken = ' Leave ';
            modal.controller.element = ' Board';


            modal.controller.cancel = function() {
              modal.controller.closeModal();
            };

            modal.controller.remove = function() {

              BoardFactory.leaveBoard({
                board: board,
                troopMember: Me.troopMember,
                boardId: board.$id
              });

              modal.controller.closeModal();

            };

            modal.close.then(function(result) {

            });

          });
        };

        $scope.membersDisplayCheck = function(board, troopMember) {

          var can = false;

          if ( troopMember.hasOwnProperty('boards')
          && troopMember.boards.hasOwnProperty(board.$id) ) {


            if ( $scope.canDisplayMembers ) {

              can = true;
            }
            else if (
              ( troopMember.troopPermission === 'admin' )
              || ( troopMember.userId === Me.troop.createdByUserId )
            ) {

              can = true;
            }

          }

          return can;
        };
        $scope.joinBoard = function(board) {
          var permission = 'member';
          $rootScope.$broadcast('board-changed');

          if (Me.troopMember.troopPermission === 'admin')
          {
            permission = 'admin'
          }
          BoardFactory.joinBoard({
            troopMember: Me.troopMember,
            boardId: board.$id,
            permission: permission
          });

        };
        $scope.navToBoard = function(board) {

          if (Me.troopMember.boards[board.$id]) {

            Me.loadBoard(Me.troop.$id, board.$id)
            .then(function waitForBoardToLoad() {

              return Me.currentBoard.$loaded();
            })
            .then(function() {

              var firstVisibleView = Me.currentBoard.getFirstVisibleView();

              Nav.toBoard(
                Me.currentBoard.viewMap[firstVisibleView],
                Me.troop.public,
                Me.troopMember.troopPermission !== 'guest',
                Me.currentBoard.$id
              );
              $rootScope.$broadcast('board-changed');
            });

          }

        };
        $scope.tryToLeaveBoard = function(board) {
          if (
            Me.troopMember.boards
            && Me.troopMember.boards.hasOwnProperty(board.$id)
            && Me.troopMember.boards[board.$id].permission === 'admin'
          ) {

            var adminCount = 0;

            _.each(Me.troopMembers, function(troopMember) {

              if (
                troopMember.boards
                && troopMember.boards.hasOwnProperty(board.$id)
                && troopMember.boards[board.$id].permission === 'admin'
              ) {
                adminCount++;
              }

            });

            if ( adminCount > 1 ) {
              that.showLeaveBoardModal(board);
            }
            else {
              that.showMessageModal("Please promote another member to moderator before you leave this board.");
            }

          }
          else {
            that.showLeaveBoardModal(board);
          }
        };
        $scope.navToTroopMember = function(troopMemberId) {

          if (Me.troopMember.$id === troopMemberId) {
            return false;
          }

          Me.loadCurrentTroopMember(troopMemberId);
          Nav.toMemberChat(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            troopMemberId
          );
          // $state.go('home.dashboard.troopMember.chat', { troopMemberId: troopMemberId });
        };
        $scope.showBoardModal = function(action) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/board.html',
            controller: 'BoardModalCtrl'
          }).then(function(modal) {

            modal.scope.action = action;

            modal.close.then(function(result) {

            });

          });
        };

        Auth.$loaded().then(function() {

          return Me.$doneRedirecting();
        })
        .catch(function(error) {

          console.log(error)

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

          return Me.$doneTryingToLoadAllBoards();
        })
        .then(function() {

          return Me.allBoards.$loaded();
        })
        .then(function() {

          $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
        });
      }
    ]
  );
