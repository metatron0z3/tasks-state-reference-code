/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:PublicTroopJoinModalCtrl
 * @description
 * PublicTroopJoinModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('PublicTroopJoinModalCtrl', PublicTroopJoinModalCtrl);

  PublicTroopJoinModalCtrl.$inject = [
    '$scope',
    '$state',
    '$timeout',
    '$q',
    'Auth',
    'Me',
    'Nav',
    'close',
    'TroopApi',
    'ModalService'
  ];

  function PublicTroopJoinModalCtrl(
    $scope,
    $state,
    $timeout,
    $q,
    Auth,
    Me,
    Nav,
    close,
    TroopApi,
    ModalService
  ) {

    /* jshint validthis: true */
    var vm = this;
    vm.Me = Me;
    vm.showModal = true;
    vm.login = login;
    vm.signUp = signUp;
    vm.loggedIn = false;
    vm.join = join;
    vm.close = closeModal;
    vm.setMessage = customMessage;


    activate();

    return;

    function activate() {

      Auth.$loaded().then(function() {

        if ( ! Me.firebaseUser.isAnonymous ) {

          vm.loggedIn = true;
        }

      });

      $scope.$on('onEscapeKey', function(event) {
        vm.close();
      })
    }

    function login(){

      Me.storeTroopToJoin(Me.troop.$id);

      Nav.toLogin();

      closeModal();
    }

    function signUp(){

      Me.storeTroopToJoin(Me.troop.$id);

      Nav.toSignUp();

      closeModal();
    }

    function join() {
      //if the user is logged in, they just need to be joined to this troop and rerouted
      //if the user is not logged in, display the modal to log in or sign up

      if (
        Me.trooper.troops
        && Me.trooper.troops[Me.troop.$id]
        && Me.trooper.troops[Me.troop.$id].troopPermission === 'banned'
      ){
        // this person has been banned and can't join this troop
        closeModal();
        ModalService.showModal({
          templateUrl: '/views/modal/message.html',
          controller: 'MessageModalCtrl'
        }).then(function(modal) {

          modal.scope.header = 'You Need to be Invited';

          modal.scope.message = 'You have left or been removed from this troop. You now have to be invited back in by an admin.';

          modal.scope.accept = function() {

            modal.scope.close();
          };

        });

      }
      else {

        TroopApi.joinPublicTroop({
          //userId: Me.trooper.$id,
          troopId: Me.troop.$id,
          reject: false
        })
        .then(function(resp) {

          if ( resp && resp.data) {

            if ( ! resp.data.memberId ) {
              return $q.reject({ code: 'MISSING_TROOP_MEMBER_ID'});
            }

            if ( ! resp.data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID'});
            }

            vm.troopId = resp.data.troopId;
            vm.troopMemberId = resp.data.memberId;

            return;

          }
          else {

            return $q.reject({ code: 'SERVER_ERROR'});
          }

        })
        .then(function() {

          Me.joinPublicTroop(vm.troopId, vm.troopMemberId);
        })
        .then(function() {

          closeModal();
        });
      }

    }

    function customMessage(message){
      vm.message = message;
    }

    function closeModal() {

      vm.showModal = false;

      $timeout(function() {
        close();
      }, 800);
    }

  }

})();
