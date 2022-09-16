/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TroopMembersCtrl
 * @description
 * # TroopMembersCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'TroopMembersCtrl',
    [
      '$scope',
      '$localStorage',
      '$state',
      '$stateParams',
      '$q',
      'Auth',
      'Me',
      'Nav',
      'TroopApi',
      'TroopFactory',
      'TroopMemberFactory',
      'BoardFactory',
      'ModalService',
      'agLogger',
      function (
        $scope,
        $localStorage,
        $state,
        $stateParams,
        $q,
        Auth,
        Me,
        Nav,
        TroopApi,
        TroopFactory,
        TroopMemberFactory,
        BoardFactory,
        ModalService,
        agLogger
      ) {

        var that = this;

        $scope.Me = Me;
        $scope.troopMembers = [];
        $scope.troopPermissionMap = {
          admin: 'Full Member',
          member: 'Guest'
        };

        $scope.promoteTroopMember = function(troopMember) {
          TroopMemberFactory.setTroopPermission({
            uid: troopMember.userId,
            troopId: Me.troop.$id,
            memberId: troopMember.$id,
            troopPermission: 'admin'
          })
          .then(function(resp) {

            _.each(Me.allBoards, function(board) {

              //if you are a member of a board, you are now moderator
              if ( board.members[troopMember.$id] )
              {
                TroopMemberFactory.setBoardPermission({
                  troopId: Me.troop.$id,
                  memberId: troopMember.$id,
                  boardId: board.$id,
                  permission: 'admin'
                })
              }
              //if you aren't a member of a board and it's public - join it and become moderator
              else if ( ! board.private )
              {

                BoardFactory.joinBoard({
                  troopMember: troopMember,
                  boardId: board.$id,
                  permission: 'admin'
                });
              }
            })


          })
          .catch(function(error) {

            console.log(error);
          });
        };
        $scope.demoteTroopMember = function(troopMember) {

          TroopMemberFactory.setTroopPermission({
            uid: troopMember.userId,
            troopId: Me.troop.$id,
            memberId: troopMember.$id,
            troopPermission: 'member'
          })
          .then(function(resp) {


          })
          .catch(function(error) {

            console.log(error);
          });
        };
        $scope.showTroopMemberProfileModal = function(troopMember) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/troop-member-profile.html',
            controller: 'TroopMemberProfileModalCtrl'
          }).then(function(modal) {

            modal.controller.setTroopMember(troopMember);

            modal.close.then(function(result) {

            });

          });
        };
        $scope.showTroopInviteModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/troop-invite.html',
            controller: 'TroopInviteModalCtrl as vm'
          })
          .then(function(modal) {

            modal.controller.setInvitePermission($stateParams.permission);

          });
        };
        $scope.showDeleteTroopMemberModal = function(troopMember) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/delete.html',
            controller: 'DeleteModalCtrl as vm'
          }).then(function(modal) {
            modal.controller.extraClasses = 'remove-troop-member-modal'

            if (troopMember.$id === Me.troopMember.$id)
            {
              modal.controller.header = 'Leave Troop';
              modal.controller.message =
                '<b>'
                + troopMember.name
                + '</b> are you sure you want to leave this troop?';
              modal.controller.actionTaken = ' Remove ';
              modal.controller.element = ' Troop Member';
            }
            else
            {
              modal.controller.header = 'Remove Member';
              modal.controller.message =
                'Are you sure you want to remove <b>'
                + troopMember.name
                + '</b> from this troop?';
              modal.controller.actionTaken = ' Remove ';
              modal.controller.element = ' Troop Member';
            }




            modal.controller.cancel = function() {
              modal.controller.closeModal();
            };

            modal.controller.remove = function() {

              var troopPermission = 'discharged'

              if (troopMember.$id !== Me.troopMember.$id)
              {
                troopPermission = 'banned'
              }

              TroopApi.removeFromTroop({
                uid: troopMember.userId,
                memberId: troopMember.$id,
                troopId: troopMember.troopId,
                troopPermission: troopPermission

              })
              .catch(function(error) {

                console.log(error);
                return $q.reject({ code: 'leaving troop did not work' });

              })
              .then(function(res) {
                  modal.controller.closeModal();
              })
              .catch(function(error) {

              })

            };
            // modal.controller.close.then(function(result) {
            //
            // });

          });
        };
        $scope.navToTroopMember = function(troopMemberId) {

          if (Me.troopMember.$id === troopMemberId) {
            return false;
          }

          if (
            Me.troopMember
            && Me.troopMember.$id === troopMemberId
          ) {
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

        $scope.showPublicTroopJoinModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/public-troop-join.html',
            controller: 'PublicTroopJoinModalCtrl as vm'
          }).then(function(modal) {

            modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

            modal.close.then(function(result) {

            });

          });
        }
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

          return Me.$doneTryingToLoadTroop();
        })
        .then(function() {

          return Me.troop.$loaded();
        })
        .then(function() {

          return Me.$doneTryingToLoadTroopMember();
        })
        .then(function() {

          return Me.troopMember.$loaded();
        })
        .then(function() {

          return Me.$doneTryingToLoadTroopMembers();
        })
        .then(function() {

          return Me.troopMembers.$loaded();
        })
        .then(function() {

          if ( ! Me.troopMembers ) {
            return $q.reject({ code: 'NO_TROOP_MEMBERS' });
          }

          $scope.troopMembers = _.reject(Me.troopMembers, function (troopMember) {

            return (
              ( troopMember.troopPermission !== $stateParams.permission )
              // || ( troopMember.$id === Me.troopMember.$id )
            );

          });

          $scope.troopMembers = _.sortBy($scope.troopMembers, function (i) {

            return (i.name || '').toLowerCase();

          });

          Me.troopMembers.$watch(function(event) {

            $scope.troopMembers = _.reject(Me.troopMembers, function (troopMember) {

              return (
                ( troopMember.troopPermission !== $stateParams.permission )
                // || ( troopMember.$id === Me.troopMember.$id )
              );

            });

            $scope.troopMembers = _.sortBy($scope.troopMembers, function (i) {

              return (i.name || '').toLowerCase();

            });
          });

          Me.loadBoard(null);
        })
        .catch(function brokenDreamCatcher(error) {

          if ( error && error.code ) {

            switch (error.code) {

              default:
                // agLogger.info('List catch', error);
                break;
            }
          }
          else {
            // agLogger.info('List catch', error);
          }
        });



      }
    ]
  );
