/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:BoardModalCtrl
 * @description
 * # BoardModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('BoardModalCtrl', BoardModalCtrl)

  BoardModalCtrl.$inject = [
    '$scope',
    '$state',
    '$localStorage',
    '$timeout',
    'Me',
    'Nav',
    'BoardFactory',
    'Ref',
    'CardFactory',
    'CardListFactory',
    'AssetFactory',
    'DEFAULT_VIEW_SETTINGS',
    'close',
    'TroopLogger'
  ];

  function BoardModalCtrl (
    $scope,
    $state,
    $localStorage,
    $timeout,
    Me,
    Nav,
    BoardFactory,
    Ref,
    CardFactory,
    CardListFactory,
    AssetFactory,
    DEFAULT_VIEW_SETTINGS,
    close,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'controllers: BoardModalCtrl - ',
      path: [ 'controllers', 'modal',  'Board.js']
    };

    var that = this;

    $scope.err = null;
    $scope.storage = $localStorage;
    $scope.showModal = true;
    $scope.currentStep = 'board-options';
    $scope.board = {
      $id: null,
      troopId: null,
      boardName: null,
      description: null,
      private: false,
      readOnly: false,
      allowNotes: true,
      viewSettings: DEFAULT_VIEW_SETTINGS
    };
    $scope.board.viewSettings.card.visible = true;
    $scope.board.viewSettings.tag.visible = false;
    $scope.board.viewSettings.chat.visible = false;
    $scope.board.viewSettings.grid.visible = false;
    $scope.board.viewSettings.list.visible = false;
    $scope.board.viewSettings.document.visible = false;
    $scope.viewChoices = ['card', 'tag', 'chat', 'grid', 'list', 'document'];

    $scope.boardName = $scope.board.boardName;
    $scope.boardDescription = $scope.board.Description;
    $scope.boardIsPrivate = $scope.board.private;

    this.processing = false;

    this.onError = function(error) {

      $scope.err = error;
    };
    // this.navToBoard = function(boardId) {
    //
    //   if ( Me.currentBoard.$id !== boardId ) {
    //
    //     Me.loadBoard(Me.troop.$id, boardId);
    //   }
    //
    //   Me.$doneTryingToLoadBoard().then(function() {
    //
    //     return Me.currentBoard.$loaded();
    //   })
    //   .then(function() {
    //
    //     if ( Me.currentRouteState.indexOf('.board.') === -1 ) {
    //
    //     }
    //
    //     var view = Me.currentBoard.getFirstVisibleView();
    //
    //
    //
    //     var viewMap = {
    //       card: 'cards',
    //       tag: 'tags',
    //       chat: 'chat'
    //     };
    //
    //     $.each($scope.viewChoices, function(index, choice) {
    //
    //       if ( Me.currentBoard.viewSettings[choice].visible ) {
    //
    //         Nav.toBoard(
    //           viewMap[choice],
    //           Me.troop.public,
    //           Me.troopMember.troopPermission !== 'guest',
    //           boardId
    //         );
    //
    //         return false;
    //       }
    //     });
    //
    //     $scope.close();
    //   });
    //
    //
    // };
    this.createBoard = function() {
      if ( ! that.processing ) {

        that.processing = true;

        var members = {};
        members[Me.troopMember.$id] = true;
        BoardFactory.create({
          boardName: $scope.board.boardName,
          description: $scope.board.description || null,
          troopId: Me.troop.$id,
          createdByMemberId: Me.troopMember.$id,
          private: !! $scope.board.private,
          readOnly: !! $scope.board.readOnly,
          allowNotes: !! $scope.board.allowNotes,
          viewSettings: $scope.board.viewSettings,
          createdAt: firebase.database.ServerValue.TIMESTAMP,
          updatedAt: firebase.database.ServerValue.TIMESTAMP,
          members: members
        })
        .then(function tryToLoadBoard(boardRef) {

          return Me.loadBoard(Me.troop.$id, boardRef.key);
        })
        .then(function waitForBoardToLoad() {

          return Me.currentBoard.$loaded();
        })
        .then(function navToBoard() {

          var firstVisibleView = Me.currentBoard.getFirstVisibleView();

          Nav.toBoard(
            Me.currentBoard.viewMap[firstVisibleView],
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            Me.currentBoard.$id
          );
        })
        .then(function closeModal() {

          $scope.close();
        })
        .catch(function(error) {

          TroopLogger.error(logConfig, 'createBoard', error);
        });
      }
      else {
        //do nothing already making a board

      }

    };
    this.updateBoard = function() {

      if (
        Me.currentBoard
        && Me.currentBoard.$id === $scope.board.$id
      ) {

        Me.currentBoard.boardName = $scope.board.boardName;
        Me.currentBoard.description = $scope.board.description;
        Me.currentBoard.allowNotes = $scope.board.allowNotes;
        Me.currentBoard.private = $scope.board.private;
        Me.currentBoard.readOnly = $scope.board.readOnly;
        Me.currentBoard.viewSettings = $scope.board.viewSettings;

        Me.currentBoard.$save()
        .then(function () {

          $scope.close();
        })
        .catch(function brokenDreamCatcher(error) {

          TroopLogger.error(logConfig, 'Me.currentBoard.$save()', error);
        });
      }
      else {

        BoardFactory.update({
          board: $scope.board
        })
        .then(function() {

          $scope.close();
        });
      }

    };

    this.setBoard = function(board) {
      // create copy of board data instead of using reference, update of reference happens on submit
      TroopLogger.debug(logConfig, 'setBoard', board);

      if ( board ) {

        _.each($scope.board, function(value, key) {

          if ( board.hasOwnProperty(key) ) {

            if ( key !== 'viewSettings' ) {
              $scope.board[key] = board[key];
            }
            else {

              _.each(board[key],  function(settings, view) {

                $scope.board[key][view] = $.extend({}, settings);
              });
            }

          }

        });
      }

    };

    $scope.close = function() {
      $scope.showModal = false;

      $timeout(close, 800).then(function(){
        that.processing = false;
      })

    };

    $scope.selectView = function(choice) {

      $scope.board.viewSettings[choice].visible = ! $scope.board.viewSettings[choice].visible;
      $scope.viewChoiceError = null;
    };
    $scope.next = function(form) {

      form.$setSubmitted();

      if ( form.$invalid ) {

        _.each(form.$error, function( errors, errorType) {

          _.each(errors, function(field) {

            field.$setDirty();
            field.$setTouched();
          });
        });

        return false;
      }

      if ( $scope.currentStep === 'board-options' ) {

        $scope.currentStep = 'view-choices';
        return false;
      }

      if ( form.$valid ) {

        var hasViewSelected = false;
        $.each($scope.board.viewSettings, function(view, settings) {

          if ( settings.visible ) {
            hasViewSelected = true;
            return false;
          }
        });

        if ( ! hasViewSelected ) {
          $scope.viewChoiceError = {
            required: true
          };
          return false;
        }
        else {
          $scope.viewChoiceError = null;
        }

        if ('new' === $scope.action) {
          that.createBoard();
        }
        else {
          that.updateBoard();
        }

      }


    };
    $scope.back = function() {

      $scope.currentStep = 'board-options';
    };

    $scope.$on('onEnterKey', function(event) {

      $timeout(function() {

        $scope.next($scope.boardModalForm);

      }, 0 );
    });

    $scope.$on('onEscapeKey', function(event) {
      $scope.close();
    })
  }


})(); // end of file
