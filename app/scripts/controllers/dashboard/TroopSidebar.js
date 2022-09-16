/* global _ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TroopSidebarCtrl
 * @description
 * # TroopSidebarCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'TroopSidebarCtrl',
    [
      '$rootScope',
      '$scope',
      '$state',
      '$q',
      '$firebaseObject',
      'TroopFirebaseObject',
      'Ref',
      'Me',
      'Auth',
      'ModalService',
      'TroopLogger',
      function TroopSidebarCtrl(
        $rootScope,
        $scope,
        $state,
        $q,
        $firebaseObject,
        TroopFirebaseObject,
        Ref,
        Me,
        Auth,
        ModalService,
        TroopLogger
      ) {
        var logConfig = {
          slug: 'controller: TroopSidebar - ',
          path: [ 'controllers', 'dashboard', 'core', 'TroopSidebar.js']
        };

        var that = this;
        this.unWatchTrooper = null;
        this.unWatchTroopAdded = null;
        this.unWatchTroopInviteAdded = null;

        $scope.Me = Me;
        $scope.loading = false;
        $scope.troops = [];
        $scope.publicTroop = null;
        $scope.invites = [];
        $rootScope.showTroopSideBar = false;

        this.init = function() {

          TroopLogger.debug(logConfig, 'TroopSidebar - init()', _.keys(Me.troops));
          if ( $scope.loading ) {

            TroopLogger.debug(logConfig, 'TroopSidebar - init() - $scope.loading: ', $scope.loading);
            return false;
          }

          Me.trooper.$loaded()
          .then(function() {
            //TroopLogger.debug(logConfig, 'On invites change', $.extend({}, Me.trooper))

            if ( Me.trooper.hasOwnProperty('troopInvites') ) {

              // Supposed to remove invites where trooper is already a member
              $scope.invites = _.reject(Me.trooper.troopInvites, function(invite, troopId) {

                // return false;

                console.log('Me.trooper.troopInvites', Me.trooper.troopInvites)
                console.log('troopId: ', troopId)

                return Me.trooper.troops.hasOwnProperty(troopId)
                    && Me.trooper.troops[troopId].troopPermission !== 'discharged'
                    && Me.trooper.troops[troopId].troopPermission !== 'banned';
              });

              // Sorts invites
              $scope.invites = _.sortBy(Me.trooper.troopInvites, function(invite, troopId) {

                invite.troopId = troopId;
                invite.abbreviation = invite.troopName.substr(0,4);

                TroopLogger.debug(logConfig, 'TroopSidebar init invite', invite.troopName);

                return invite.troopName.toLowerCase();
              });

            }

            //
            Me.trooper.$ref().child('troopInvites').on('child_removed', function(snap) {

              if (snap.exists()) {

                var troopInvite = snap.val();

                if ( troopInvite ) {

                  var inviteIndex = _.findIndex($scope.invites,function(invite) {

                    return ( invite.inviteId === troopInvite.inviteId ) || -1
                  });

                  if (inviteIndex > -1) {

                    $scope.invites.splice(inviteIndex, 1);
                  }
                }
              }

            });


            //
            var troopPromises = [];
            _.each(Me.troops, function($troop, troopId) {

              if (
                Me.trooper.troops
                && Me.trooper.troops[troopId].troopPermission !== 'discharged'
                && Me.trooper.troops[troopId].troopPermission !== 'banned'
              ) {

                troopPromises.push($troop.$loaded());
              }

            });

            $q.all(troopPromises)
            .then(function() {
              TroopLogger.debug(logConfig, 'init() - $q.all(troopPromises)', 'Me.troop.$id: ' + Me.troop.$id, _.keys(Me.troops));

              $scope.troops = _.sortBy(Me.troops, function($troop, troopId) {

                if ($troop.troopName) {

                  return $troop.troopName.toLowerCase();
                }

              });

              $scope.troops = _.filter($scope.troops, function(value) {

                return that.checkPermission(value);
              });

              if (
                ( $scope.troops.length > 0  )
                && ( Me.screen.size === 'desktop' )
              ) {

                $rootScope.showTroopSideBar = true;
              }

              if ( Me.troopMember.troopPermission === 'guest' ) {

                $scope.publicTroop = Me.troop;
              }

              $scope.loading = false;

              Me.troopMember.$watch(function() {
                TroopLogger.debug(logConfig, 'TroopSidebar - Me.troopMember.$watch', Me.troopMember);
                if (
                  Me.troopMember.troopPermission === 'discharged'
                  || Me.troopMember.troopPermission === 'banned' ) {
                    TroopLogger.debug(logConfig, 'TroopSidebar - Me.troopMember.$watch is banned or discharged', Me.troopMember);
                    Me.switchToTroop(Me.getFirstTroop().troopId)
                  }

                $scope.troops = _.filter($scope.troops, function(value) {
                  TroopLogger.debug(logConfig, 'TroopSidebar - filter Troops', $scope.troops);
                  return that.checkPermission(value);
                });
              });

              TroopLogger.debug(logConfig, 'init() - $q.all(troopPromises)', 'Me.troop.$id: ' + Me.troop.$id, $scope.troops);

            });
          })


        };
        this.checkPermission = function(value) {

          if (
            Me.trooper.troops
            && Me.trooper.troops[value.$id].troopPermission !== 'discharged'
            && Me.trooper.troops[value.$id].troopPermission !== 'banned'
          ) {

            return true;
          }
          else {

            return false;
          }
        }

        $scope.acceptInvite = function(invite) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/invite-accept.html',
            controller: 'InviteAcceptModalCtrl'
          })
          .then(function(modal) {

            modal.controller.setInvite(invite);

            // modal.controller.closeModal();

            // modal.close.then(function(result) {
            //
            // });


          });
        };
        $scope.switchToTroop = function(troopId) {
          if (troopId !== Me.troop.$id) {

            Me.switchToTroop(troopId);

          }
        };
        $scope.showNewTroopModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          if ( Me.firebaseUser.isAnonymous ){
            ModalService.showModal({
              templateUrl: '/views/modal/public-troop-join.html',
              controller: 'PublicTroopJoinModalCtrl as vm'
            }).then(function(modal) {

              modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

              modal.close.then(function(result) {

              });

            });
          }
          else {
            ModalService.showModal({
              templateUrl: '/views/modal/troop.html',
              controller: 'TroopModalCtrl'
            }).then(function(modal) {

              modal.controller.setKindOfModal('new')

              modal.close.then(function(result) {

              });
            })
          }
        };

        $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

          if (Me.screen.size !== 'desktop') {
            $rootScope.showTroopSideBar = false;
          }

        });

        $scope.$on("$destroy", function() {

          if (that.unWatchTrooper) {
            that.unWatchTrooper();
          }

          if (that.unWatchTroopAdded) {
            that.unWatchTroopAdded();
          }

          if (that.unWatchTroopInviteAdded) {
            that.unWatchTroopInviteAdded();
          }

        });

        Auth.$loaded()
        .then(function waitForRedirectingToFinish() {

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
        .then(function waitForTroopsToLoad() {

          return Me.$doneTryingToLoadTroops();
        })
        .then(function initialize() {
          TroopLogger.debug(logConfig, 'TroopSidebarCtrl - initialize()', Me.firebaseUser)
          that.init();

          that.unWatchTroopAdded = $scope.$on('troop-added', function(event, $troop) {

            TroopLogger.debug(logConfig, "$scope.$on('troop-added')", $troop);
            $troop.$loaded()
            .then(function() {

              that.init();
            });

          });

          that.unWatchTroopInviteAdded = $scope.$on('troop-invite-added', function(event) {

            TroopLogger.debug(logConfig, "$scope.$on('troop-invite-added')");

            if (Me.trooper.troopInvites) {

              that.init();
            }

          });

          that.unWatchTrooper = Me.trooper.$watch(function(event) {
            //agLogger.debug("TroopSidebarCtrl - Me.trooper.$watch()");

            TroopLogger.debug(logConfig, 'On invite added', $.extend({}, Me.trooper))
            if ( Me.trooper.troops ){
              $scope.troops = _.filter($scope.troops, function(value) {

                return that.checkPermission(value);
              });
            }

            if (
              Me.trooper.troopInvites
              && $scope.invites.length !== _.keys(Me.trooper.troopInvites) )
              {
                TroopLogger.debug(logConfig, 'Me.trooper.$watch - need to add or remove invites')
                that.init();
              }
          });

        })
        .catch(function(error) {

          TroopLogger.debug(logConfig, 'TroopSidebarCtrl - error', error);

        });
      }
    ]
  );
