/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:TroopInviteModalCtrl
   * @description
   * # TroopInviteModalCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('TroopInviteModalCtrl', TroopInviteModalCtrl)

  TroopInviteModalCtrl.$inject = [
    '$scope',
    '$timeout',
    '$q',
    'Me',
    'InviteFactory',
    'TrooperFactory',
    'TroopMemberFactory',
    'TroopLogger',
    'close'
  ];
  function TroopInviteModalCtrl(
    $scope,
    $timeout,
    $q,
    Me,
    InviteFactory,
    TrooperFactory,
    TroopMemberFactory,
    TroopLogger,
    close
  ) {

    var logConfig = {
      slug: 'controller: TroopInviteModalCtrl - ',
      path: [ 'controllers', 'modal', 'TroopInvite.js' ]
    };

    var vm = this;

    vm.emails = [''];
    vm.err = null;
    vm.invitePermission = 'admin';
    vm.thisTroop = Me.troop.troopName;
    vm.payload = {
        troopId: Me.troop.$id,
        fromMemberId: Me.troopMember.$id
    };

    vm.inviteData = {
      tryingToInviteYourself: false,
      inviteAlreadySentToEmail: false,
      emailBelongsToExistingTroopMember: false
    };


    vm.formvals = {
      email: ''
    };

    vm.setInvitePermission = setInvitePermission;
    vm.invite = invite;
    vm.addInviteRecord = addInviteRecord;
    vm.closeModal = closeModal;
    vm.addAnother = addAnother;
    vm.removeEmail = removeEmail;

    activate();

    return;

    function activate() {
      vm.showModal = true;

      TroopLogger.error(logConfig, 'activate() called');

      $scope.$on('onEscapeKey', function(event) {
        vm.closeModal();
      })
    }

    function setInvitePermission(type) {

      vm.invitePermission = type;
    }

    function invite(form) {

      if ( ! vm.emails ) {

        form.email.$dirty = true;
        form.email.$touched = true;
        form.email.$invalid = true;

        return false;
      }

      if ( ! form.$valid ) {

        return false;
      }

      var promises = [];

      _.each( vm.emails, function(email) {

        vm.email = email;

        if ( email ) {

          promises.push(vm.addInviteRecord(vm.email));
        }

      });

      $q.all(promises)
      .then(function() {

        closeModal();

      });


      // both trooper and invite do not exist

      // vm.step = 'troop-invite-success';

    }

    function addInviteRecord(email) {


      var blah = email;

      vm.payload = {
          troopId: Me.troop.$id,
          fromMemberId: Me.troopMember.$id,
          email: email,
          permission: vm.invitePermission
      };

      if ( vm.formvals.email ) {

        vm.payload.email = blah;
        vm.payload.permission = vm.invitePermission;
      }

      return InviteFactory.create(vm.payload);

    }

    function addAnother() {

      vm.emails.push('');

    }

    function removeEmail($index) {

      $timeout(function() {

        vm.emails.splice($index, 1);

      },0);
    }


    function closeModal() {

      vm.showModal = false;

      $timeout(function() {

        close();
      }, 800);

    }

  }

})();
