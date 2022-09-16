/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
    'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:NotificationSidebarCtrl
 * @description
 * # NotificationSidebarCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('NotificationSidebarCtrl', NotificationSidebarCtrl);


  NotificationSidebarCtrl.$inject = [
    '$rootScope',
    '$scope',
    '$state',
    '$q',
    '$timeout',
    'Auth',
    'Me',
    'Nav',
    'Ref',
    'ModalService',
    'SecurityFactory',
    'TroopLogger'
  ];

  function NotificationSidebarCtrl(
    $rootScope,
    $scope,
    $state,
    $q,
    $timeout,
    Auth,
    Me,
    Nav,
    Ref,
    ModalService,
    SecurityFactory,
    TroopLogger
  ){

    var logConfig = {
      slug: 'controller: NotificationSidebar - ',
      path: [ 'controllers', 'dashboard', 'NotificationSidebar.js']
    };

    /* jshint validthis: true */
    var vm = this;
    vm.Me = Me;
    vm.canDisplayMembers = false;
    vm.showActionMenu = false;
    vm.init = init;
    vm.markAllRead = markAllRead;
    vm.isAnon = false;
    vm.troopMember = {};
    vm.troop = {};
    vm.date = new Date();
    vm.notificationFilter = 'all';

    vm.ptNotificationClick = ptNotificationClick;
    vm.markptNotificationAsRead = markptNotificationAsRead

    vm.showDeleteAllNotificationsModal = showDeleteAllNotificationsModal;

    vm.uniqueTrackById = uniqueTrackById;

    vm.unWatch = null;


    activate();

    return;

    function activate() {

      Auth.$loaded()
      .then(function initAndWaitForTroopLoad() {

        vm.init();

        return Me.$doneTryingToLoadTroop();
      })
      .then(function waitForTroopLoad() {

        return Me.troop.$loaded();
      })
      .then(function listenOnScopeForTroopChange() {

        $scope.$on('troop-changed', function() {

          vm.init();
        });
      });

      checkState($state.current.name);

      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

        var newState = toState.redirectTo || toState.name;

        checkState(newState);
      });

      $rootScope.$on('onBodyClick', function(event) {

        $timeout(function() {

          $rootScope.showNotifications = false;
        }, 0 )
      });

    }

    function init() {

      return Me.$doneTryingToLoadTrooper()
        .then(function meTrooperLoaded() {

          return Me.trooper.$loaded();
        })
        .then(function meDoneTryingToLoadTroop() {

          return Me.$doneTryingToLoadTroop();
        })
        .then(function meTroopLoaded() {

          return Me.troop.$loaded();
        })
        .then(function meDoneTryingToLoadTroopMember() {


          return Me.$doneTryingToLoadTroopMember();
        })
        .then(function meTroopMemberLoaded() {

          return Me.troopMember.$loaded();
        })
        // .then(function meDoneTryingToLoadNotifications() {
        //
        //
        //   return Me.$doneTryingToLoadNotifications();
        // })
        .then(function setNotificationsAndWatchIt() {
          vm.troopMember.$id = Me.troopMember.$id;
          vm.canDisplayMembers = SecurityFactory.membersDisplayCheck();

          if ( vm.canDisplayMembers ) {

            if (
              Me.notifications[Me.troopMember.$id]
              && Me.notifications[Me.troopMember.$id].$firebaseArray
            ) {

              vm.notificationList = Me.notifications[Me.troopMember.$id];
              vm.notifications = Me.notifications[Me.troopMember.$id].$firebaseArray;

              //console.log(vm.notifications);

              vm.notifications.$loaded()
              .then(function(){

                vm.unWatch = Me.notifications[Me.troopMember.$id].$firebaseArray.$watch(function(event){

                  if( event.event === 'child_added' ) {

                    var isUniq = true;
                    _.each($scope.tpDataPumpItems,function(item){
                      //console.log('$scope.tpDataPumpItems item',item);
                      if ( item && ( item.$id === event.key ) ) {
                        isUniq = false;
                      }
                    });


                    if ( isUniq && $scope.tpDataPumpItems ) {
                      Array.prototype.splice.apply(
                        $scope.tpDataPumpItems,
                        [0,0].concat(Me.notifications[Me.troopMember.$id].$firebaseArray.$getRecord(event.key))
                      );
                    }

                  }

                  if( event.event === 'child_removed' ) {

                    $scope.tpDataPumpItems = _.filter($scope.tpDataPumpItems, function(item){
                      return item.$id !== event.key;
                    });
                  }


                  if( event.event === 'child_changed' ){

                    if ( Me.notifications[Me.troopMember.$id].$firebaseArray.$getRecord(event.key) === null ) {

                      TroopLogger.debug(logConfig, event.key, 'notification changed');
                      $scope.tpDataPumpItems = _.filter($scope.tpDataPumpItems, function(item){
                        return item.$id !== event.key;
                      });
                    }
                  }

                });
              })
              .catch(function(error) {
                TroopLogger.error(logConfig, 'notification rejected',error);
                //console.log('catch here', error);
              });

            }
            else {
              if (
                Me.troopMember.$id !== 'guest'
                && vm.unWatch
              ) {
                // unwatch will only exist if you have right to see notifications
                // guest can't see notifications
                vm.unWatch();
              }

              vm.notifications = [];
            }
          }
        });
    }

    function checkState(stateName) {

      if ( stateName.indexOf('dashboard.board.') !== -1 ) {

        vm.notificationFilter = 'board';
      }
    }

    function uniqueTrackById(count,id){
      return count+'-'+id;
    }

    function markptNotificationAsRead() {

    }

    function ptNotificationClick() {

    }

    function showDeleteAllNotificationsModal() {

      if ( Me.modalIsOn ) {

        return;
      }

      if (Me.troopMember.troopPermission !== 'guest') {

        ModalService.showModal({
          templateUrl: '/views/modal/delete.html',
          controller: 'DeleteModalCtrl as vm'
        })
        .then(function(modal) {

          modal.controller.extraClasses = 'delete-all-notifications-modal';
          modal.controller.header = 'Delete All Notifications';
          modal.controller.message =
            'Are you sure you want to delete all these notifications?';
          modal.controller.actionTaken = ' Delete ';
          modal.controller.element = ' All';

          modal.controller.cancel = function() {
            modal.controller.closeModal();
            // .then(function(result) {
            //
            // });
          };

          modal.controller.remove = function() {

            deleteAll();
            modal.controller.closeModal();
            //modal.controller.close.then(function(result) {});
          };

        });

        vm.showActionMenu = false;

      }
      else {
        ModalService.showModal({
          templateUrl: '/views/modal/public-troop-join.html',
          controller: 'PublicTroopJoinModalCtrl as vm'
        })
        .then(function(modal) {

          modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

        });
      }
    }

    function deleteAll() {

      vm.notificationList.deleteAllNotifications();

    }

    function markAllRead() {

      if (Me.troopMember.troopPermission !== 'guest') {
        vm.notificationList.markAllNotificationAsRead();
        vm.showActionMenu = false;
      }
      else {

        if ( Me.modalIsOn ) {

          return;
        }

        ModalService.showModal({
          templateUrl: '/views/modal/public-troop-join.html',
          controller: 'PublicTroopJoinModalCtrl as vm'
        }).then(function(modal) {

          modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

        });
      }
    }

  }

})(); // end of file
