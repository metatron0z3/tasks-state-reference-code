'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:SignUpCodeVerificationCtrl
 * @description
 * # SignUpCodeVerificationCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'InviteCtrl',
    [
      '$scope',
      '$state',
      '$stateParams',
      '$localStorage',
      'Nav',
      function (
        $scope,
        $state,
        $stateParams,
        $localStorage,
        Nav
      ) {

        $localStorage.lastInviteToken = $stateParams.token;
        if (
          $localStorage.newAccount
          && $localStorage.newAccount.step
        ) {
          $localStorage.newAccount.step = null;
          delete $localStorage.newAccount.step;
        }
        Nav.toSignUp();


      }
    ]

  );
