/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:MyBoardsCtrl
 * @description
 * # MyBoardsCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'MyBoardsCtrl',
    [
      '$scope',
      '$state',
      '$rootScope',
      '$stateParams',
      '$timeout',
      '$filter',
      '$q',
      'Auth',
      'Me',
      'Nav',
      'BoardFactory',
      'ModalService',
      'SecurityFactory',
      'TroopLogger',
      function MyBoardsCtrl(
        $scope,
        $state,
        $rootScope,
        $stateParams,
        $timeout,
        $filter,
        $q,
        Auth,
        Me,
        Nav,
        BoardFactory,
        ModalService,
        SecurityFactory,
        TroopLogger
      ) {
        var logConfig = {
          slug: 'controllers: MyBoards - ',
          path: [ 'controllers', 'dashboard',  'boards', 'MyBoards.js']
        };

        var that = this;

        $scope.boardMenus = {};
        $scope.boards = [];
        $scope.Me = Me;
        $scope.canDisplayMembers = false;
        $scope.memberLength = {};

        this.refreshBoardMenus = function(event) {

          _.each($scope.boards, function(board) {
            $scope.boardMenus[board.$id] = false;
          });

        };
        this.orderBoards = function() {
          var boards = [];

          _.each(Me.troopMember.boards, function(permission, boardId) {

            var board = Me.allBoards.$getRecord(boardId);
            if (board) {
              boards.push(board);
            }

          });

          $scope.boards = _.sortBy(boards, function (i) {
            return i.boardName.toLowerCase();
          });

        };

        this.showMessageModal = function(message) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/message.html',
            controller: 'MessageModalCtrl'
          })
          .then(function(modal) {

            modal.scope.message = message;

            modal.scope.accept = function() {

              modal.scope.close();
            };

          });
        };
        this.showLeaveBoardModal = function(board) {

          ModalService.showModal({
            templateUrl: '/views/modal/delete.html',
            controller: 'DeleteModalCtrl as vm'
          })
          .then(function(modal) {

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
              })
              .then(function(){

                if (Me.currentBoard) {

                  Me.currentBoard.$destroy();
                  Me.currentBoard = null;
                }
                return Me.getFirstBoardId();
              })
              .then(function(resp) {

                // better to close modal before navigating away.
                modal.controller.closeModal();

                Nav.toMyBoards(
                  Me.troop.public,
                  Me.troopMember.troopPermission !== 'guest'
                );
              })



            };

          });
        };

        $scope.getBoardMemberLength = function(board) {

          var boardMembers = 0;
          _.each(Me.troopMembers, function(troopMember) {

            if ($scope.membersDisplayCheck(board, troopMember)) {

              boardMembers++;
            }
          });
          return boardMembers;
        };
        $scope.membersDisplayCheck = function(board, troopMember) {

          var can = false;

          if (
            troopMember.hasOwnProperty('boards')
            && troopMember.boards.hasOwnProperty(board.$id)
          ) {

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
        $scope.showBoardModal = function(action, board) {
          // edit card

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/board.html',
            controller: 'BoardModalCtrl'
          })
          .then(function(modal) {

            TroopLogger.debug(logConfig, 'showBoardModal() - first promise resolved',modal);

            modal.controller.setBoard(board);
            modal.scope.action = action;

            modal.close.then(function(result) {

            });

          });
        };
        $scope.showDeleteBoardModal = function(board) {

          if ( Me.modalIsOn ) {

            return;
          }

          if (Me.allBoards.length > 1) {

            ModalService.showModal({
              templateUrl: '/views/modal/delete.html',
              controller: 'DeleteModalCtrl as vm'
            })
            .then(function(modal) {

              modal.controller.extraClasses = 'archive-board-modal'
              modal.controller.header = 'Delete Board';
              modal.controller.message =
                'Are you sure you want to delete the "<b>'
                + board.boardName
                + '</b>" board?';
              modal.controller.actionTaken = ' Delete ';
              modal.controller.element = ' Board';


              modal.controller.cancel = function() {
                modal.controller.closeModal();
              };

              modal.controller.remove = function() {

                BoardFactory.archive(board)
                .then(function() {
                  // Tjis is not a function for some reason
                  modal.controller.closeModal();
                });

              };

            });
          }
          else {
            ModalService.showModal({
              templateUrl: '/views/modal/message.html',
              controller: 'MessageModalCtrl'
            })
            .then(function(modal) {

              modal.controller.header = 'Cannot Delete Board';
              modal.controller.message ='Every troop needs at least one board.';


              modal.controller.cancel = function() {
                modal.controller.close();
              };

              modal.scope.accept = function() {

                modal.scope.close();

              };

            });
          }

        };
        $scope.navToBoard = function(board) {

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

          })
          .catch(function brokenDreamCatcher(error) {

            TroopLogger.error(logConfig, 'navToBoard - loadBoard', error);
          });



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

              that.showMessageModal('Please promote another member to moderator before you leave this board.');
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

          Me.loadCurrentTroopMember(Me.troop.$id, troopMemberId);
          Nav.toMemberChat(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            troopMemberId
          );

          // $state.go('home.dashboard.troopMember.chat', { troopMemberId: troopMemberId });
        };
        $scope.customTracking = function(index,id) {
          return index+'-'+id;
        }

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
          that.orderBoards();
          that.refreshBoardMenus();

          Me.allBoards.$watch(function() {
            that.orderBoards();
          });

          Me.troopMember.$watch(function() {
            that.orderBoards();
          });
        });
      }
    ]
  );
