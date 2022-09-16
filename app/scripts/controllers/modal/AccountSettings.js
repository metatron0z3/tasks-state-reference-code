'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:AccountSettingsModalCtrl
 * @description
 * # AccountSettingsModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
.controller(
  'AccountSettingsModalCtrl',
  [
    '$scope',
    '$timeout',
    'Me',
    'TrooperFactory',
    'TroopApi',
    'close',
    function (
      $scope,
      $timeout,
      Me,
      TrooperFactory,
      TroopApi,
      close
    ) {

      var that = this;

      $scope.Me = Me;
      $scope.showModal = true;
      $scope.isProcessing = false;
      $scope.formVals = {
        errorMsg: '',
        passwordResetSuccess: false,
        trooperNameUpdateSuccess: false,
        name: Me.trooper.name,
        oldPassword: '',
        newPassword: ''
      };

      $scope.updateTrooper = function(form) {

        $scope.isProcessing = true;

        var payload = {};

        if ( $scope.formVals.name ) {

          payload.name = $scope.formVals.name;
        }

        if ( $scope.formVals.oldPassword ) {

          payload.oldPassword = $scope.formVals.oldPassword;
        }

        if ( $scope.formVals.newPassword ) {

          payload.newPassword = $scope.formVals.newPassword;
        }

        if ( form.$valid ) {

          // User is updating Account Name
          if (  payload.name !== Me.trooper.name ) {

            TroopApi.updateUser({
              userId: Me.trooper.$id,
              name: payload.name
            })
            .then(function(resp){

              $scope.formVals.trooperNameUpdateSuccess = true;
              $scope.isProcessing = false;
              $scope.close();
            })
            .catch(function(error){

              $scope.formVals.trooperNameUpdateSuccess = false;
              $scope.isProcessing = false;
              $scope.formVals.errorMsg = error.data || '';
            });
          }

          // User is updating password
          if (  $scope.formVals.oldPassword  && $scope.formVals.newPassword  )  {

            TroopApi.updateUser({
              userId: Me.trooper.$id,
              newPassword: payload.newPassword,
              oldPassword: payload.oldPassword
            })
            .then(function(resp) {

              $scope.formVals.passwordResetSuccess = true;
              $scope.isProcessing = false;
              $scope.close();
            })
            .catch(function(error) {

              $scope.formVals.passwordResetSuccess = false;
              $scope.isProcessing = false;
              $scope.formVals.errorMsg = error.data || '';
            });
          }
        }
      };

      $scope.close = function() {

        $scope.showModal = false;

        $timeout(function() {
          close();
        }, 800);
      };

      $scope.save = function(form) {

        if (form.$valid) {

          that.updateTrooper();
        }
      };
    }
  ]
);
