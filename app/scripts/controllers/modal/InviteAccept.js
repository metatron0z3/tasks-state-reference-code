'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:InviteAcceptModalCtrl
 * @description
 * # InviteAcceptModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('InviteAcceptModalCtrl',InviteAcceptModalCtrl);

  InviteAcceptModalCtrl.$inject = [
      '$scope',
      '$state',
      '$timeout',
      '$q',
      'Me',
      'Nav',
      'TroopApi',
      'close',
      'TroopLogger'
    ];

    function InviteAcceptModalCtrl (
      $scope,
      $state,
      $timeout,
      $q,
      Me,
      Nav,
      TroopApi,
      close,
      TroopLogger
    ) {

      var logConfig = {
        slug: 'controllers: InviteAcceptModalCtrl - ',
        path: [ 'controllers', 'modal',  'InviteAccept.js']
      };

      var that = this;

      $scope.Me = Me;
      $scope.showModal = true;
      $scope.accepting = false;

      this.setInvite = function(invite) {
        // create copy of board data instead of using reference, update of reference happens on submit
        $scope.invite = invite;
      };

      $scope.$on('onEscapeKey', function(event) {
        $scope.close();
      })

      $scope.acceptInvite = function() {

        $scope.accepting = true;

        TroopApi.acceptInvite({
          //userId: Me.trooper.$id,
          troopId: $scope.invite.troopId,
          inviteId: $scope.invite.inviteId,
          reject: false
        })
        .then(function(resp) {

          TroopLogger.debug(logConfig, 'TroopApi.acceptInvite resp', resp);

          if ( resp && resp.data) {

            if ( ! resp.data.memberId ) {
              return $q.reject({ code: 'MISSING_TROOP_MEMBER_ID'});
            }

            if ( ! resp.data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID'});
            }

            that.troopId = resp.data.troopId;
            that.troopMemberId = resp.data.memberId;

            return;

          }
          else {

            return $q.reject({ code: 'SERVER_ERROR'});
          }

        })
        .then(function() {

          Me.loadTroop(that.troopId);
          return Me.$doneTryingToLoadTroop();
        })
        .then(function() {

          return Me.troop.$loaded();
        })
        .then(function() {

          Me.loadTroopMember(that.troopId, that.troopMemberId);
          return Me.$doneTryingToLoadTroopMember();
        })
        .then(function() {

          return Me.troopMember.$loaded();
        })
        .then(function() {

          return Me.getFirstBoardId()

          // var firstBoardId = Me.getFirstBoardId();
          //
          // if ( ! firstBoardId ) {
          //
          //   $state.go('home.dashboard.boards.available');
          //   Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
          //   return $q.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'});
          // }
          //
          // Me.loadBoard(Me.troop.$id, firstBoardId);
          // that.navToBoard();

        })
        .then(function(firstBoardId) {

          TroopLogger.debug(logConfig, 'TroopApi.acceptInvite firstBoardId', firstBoardId);

          if ( ! firstBoardId ) {

            Nav.toAvailableBoards(
              Me.troop.public,
              Me.troopMember.troopPermission !== 'guest'
            );
            // $state.go('home.dashboard.boards.available');
            Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
            return $q.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'});
          }

          return Me.loadBoard(Me.troop.$id, firstBoardId);
        })
        .then(function() {

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

          $scope.close();

        })
        .catch(function(error) {

          console.log(error);

          if ( error ) {

            switch (error.code) {

              case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
                $scope.close();
                Nav.toAvailableBoards(
                  Me.troop.public,
                  Me.troopMember.troopPermission !== 'guest'
                );
                // $state.go('home.dashboard.boards.available');
                break;
            }
          }
        })
      };

      $scope.declineInvite = function() {

        TroopApi.acceptInvite({
          //userId: Me.trooper.$id,
          troopId: $scope.invite.troopId,
          inviteId: $scope.invite.inviteId,
          reject: true
        })
        .then(function() {

          $scope.close();
        })
        .catch(function(error) {

          console.log(error);

          if ( error ) {

            switch (error.code) {

              case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
                $scope.close();
                Nav.toAvailableBoards(
                  Me.troop.public,
                  Me.troopMember.troopPermission !== 'guest'
                );
                // $state.go('home.dashboard.boards.available');
                break;
            }
          }
        })
      };

      $scope.close = function() {
        $scope.showModal = false;

        $timeout(function() {
          close();
        }, 800);
      };
    }
