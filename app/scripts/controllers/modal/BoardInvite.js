/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
    'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:BoardInviteModalCtrl
 * @description
 * # BoardInviteModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('BoardInviteModalCtrl', BoardInviteModalCtrl);



  BoardInviteModalCtrl.$inject = [
    '$rootScope',
    '$scope',
    '$q',
    '$timeout',
    '$firebaseObject',
    '$firebaseArray',
    '$firebaseUtils',
    'Ref',
    'Me',
    'close',
    'InviteFactory'
  ];

    function BoardInviteModalCtrl(
      $rootScope,
      $scope,
      $q,
      $timeout,
      $firebaseObject,
      $firebaseArray,
      $firebaseUtils,
      Ref,
      Me,
      close,
      InviteFactory
    ) {

      var that = this;

      $scope.showModal = true;
      $scope.Me = Me;
      $scope.isCreating = false;
      $scope.newMembers = [];
      $scope.selectedMembers = {};
      $scope.existingInvites = [];
      $scope.formVals = {
        email: '',
        emailHasFocus: false,
        memberFilter: ''
      };

      $scope.search = function (troopMember) {

        return (
          angular.lowercase(troopMember.name).indexOf(
            angular.lowercase($scope.formVals.memberFilter) || ''
          )
          !== -1
        );
      };

      this.addInviteRecord = function(troopMember) {

        InviteFactory.create({
          troopId: Me.troop.$id,
          boardId: Me.currentBoard.$id,
          fromMemberId: Me.troopMember.$id,
          memberId: troopMember.$id
        })
        .then(function() {

        })
        .catch(function(error) {
          console.log(error);
        });

      };

      $scope.close = function() {
        $scope.showModal = false;

        $timeout(close, 800);

      };
      $scope.invite = function() {


        _.each($scope.selectedMembers, function(troopMember, troopMemberId) {

          if ( troopMember ) {
            that.addInviteRecord(troopMember);
          }

        });

        $scope.close();

      };
      $scope.selectMember = function(troopMember) {

        if ( troopMember.hasInvites ) {
          return false;
        }

        if ( $scope.selectedMembers[troopMember.$id] ) {

          troopMember.classes = '';
          $scope.selectedMembers[troopMember.$id] = null;
          return false;
        }

        if (
          troopMember.boards
          && troopMember.boards.hasOwnProperty(Me.currentBoard.$id)
        ) {
          return false;
        }

        troopMember.classes = 'active';
        $scope.selectedMembers[troopMember.$id] = troopMember;
      };
      $scope.removeNewMember = function(email) {

        var index = $scope.newMembers.indexOf(email);

        if ( index !== -1 ) {
          $scope.newMembers.splice(index, 1);
        }
      };
      $scope.addNewMember = function(form) {

        $scope.hasExistingTroopMember = false;
        $scope.tryingToInviteYourself = false;
        $scope.hasError = false;
        $scope.hasFormError = false;
        $scope.formVals.emailHasFocus = false;
        $scope.missingEmail = false;

        if ( ! form.$valid ) {
          $scope.hasFormError = true;
          $scope.hasError = true;
          return false;
        }

        var email = $scope.formVals.email.toLowerCase();

        if ( ! email ) {

          $scope.missingEmail = true;
          $scope.hasError = true;
          return false;
        }

        if ( $scope.newMembers.indexOf(email) !== -1 ) {
          $scope.formVals.email = '';
          return false;
        }

        if ( $scope.existingInvites.indexOf(email) !== -1 ) {
          $scope.formVals.email = '';
          return false;
        }

        if ( $scope.selectedMembers.hasOwnProperty(email) ) {
          $scope.formVals.email = '';
          return false;
        }

        if ( email === Me.troopMember.email.toLowerCase() ) {

          $scope.tryingToInviteYourself = true;
          $scope.hasError = true;
          return false;
        }

        var existingTroopMember = _.findWhere(Me.troopMembers, { email: email });

        if (existingTroopMember) {

          if ( $scope.selectedMembers[existingTroopMember.$id] ) {
            return false;
          }

          if (
            existingTroopMember.boards
            && existingTroopMember.boards.hasOwnProperty(Me.currentBoard.$id)
          ) {

            $scope.hasExistingTroopMember = true;
            $scope.hasError = true;
            return false;
          }

          existingTroopMember.classes = 'active';
          $scope.selectedMembers[existingTroopMember.$id] = existingTroopMember;
          $scope.formVals.email = '';
          return false;
        }

        $scope.newMembers.push(email);
        $scope.formVals.email = '';
      };

      $scope.$on('onEscapeKey', function(event) {
        $scope.close();
      })

      $scope.curBoardInvites = $firebaseArray(Ref.child('boardInvites').child(Me.troop.$id))
      $scope.curBoardInvites.$loaded()
      .then(function() {

        $scope.curBoardInvites = _.filter($scope.curBoardInvites, function(invite) {
          return invite.boardId === Me.currentBoard.$id
        });

        $scope.invitees = [];
        _.each($scope.curBoardInvites, function(invite) {
          $scope.invitees.push(invite.memberId)
        });

        return $scope.invitees;
      })
      .then(function() {
        return Me.troopMembers.$loaded();
      })
      .then(function() {
        $scope.troopMembers = _.sortBy(Me.troopMembers, function(troopMember) {

          var name = troopMember.name;

          troopMember.classes = '';

          if (
            troopMember.boards
            && troopMember.boards.hasOwnProperty(Me.currentBoard.$id)
          ) {

            troopMember.isAlreadyBoardMember = true;
            troopMember.hasInvites = false;
            troopMember.classes += ' existing-member';
          }

          if ($scope.selectedMembers.hasOwnProperty(troopMember.$id)) {

            troopMember.classes += ' active';
          }
          if ( $scope.invitees && $scope.invitees.indexOf(troopMember.$id) > -1 ) {

            troopMember.classes += ' active';
            troopMember.hasInvites = true;
          }

          return name.toLowerCase();
        });

      });

    }

})(); // end of file
