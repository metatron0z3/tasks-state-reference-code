'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:PasswordResetCtrl
 * @description
 * # PasswordResetCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'PasswordResetCtrl',
    [
      '$scope',
      '$localStorage',
      '$timeout',
      '$q',
      '$state',
      '$stateParams',
      '$rootScope',
      'Me',
      'Ref',
      'Auth',
      'TroopApi',
      function (
        $scope,
        $localStorage,
        $timeout,
        $q,
        $state,
        $stateParams,
        $rootScope,
        Me,
        Ref,
        Auth,
        TroopApi
      ) {

        var that = this;

        $scope.isProcessing = false;

        $scope.formVals = {
          errorMsg: '',
          $storage: $localStorage,
          passwordResetSuccess: false
        };

        this.cleanLocalStorage = function() {
          $scope.formVals.$storage.newAccount = null;
          delete $scope.formVals.$storage.newAccount;
        };

        $scope.reset = function(form) {

          if ( form.$invalid ) {

            return false
          }

          $scope.isProcessing = true;

          TroopApi.applyPasswordReset({
            token: $stateParams.token,
            newPassword: $scope.formVals.$storage.newAccount.password
          })
          .then(function(resp) {

            $scope.formVals.passwordResetSuccess = true;
            that.cleanLocalStorage();
          })
          .catch(function(error) {

            $scope.formVals.passwordResetSuccess = false;
            $scope.isProcessing = false;
            $scope.formVals.errorMsg = error.data || '';
          });

        };

        // Force logged out state if reaching this Login route
        Me.freeMe();
        Me.stopMonitoringConnection();
        Auth.logout(false);
      }
    ]

  );
