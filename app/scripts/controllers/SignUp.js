/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:SignUpCtrl
 * @description
 * # SignUpCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('SignUpCtrl', SignUpCtrl);

  SignUpCtrl.$inject = [
    '$scope',
    '$localStorage',
    '$q',
    '$state',
    '$timeout',
    '$rootScope',
    'Auth',
    'Me',
    'Nav',
    'Ref',
    'Slug',
    'TroopApi',
    'TroopFactory',
    'TroopMemberFactory',
    'BoardFactory',
    'TroopLogger'
  ];

  function SignUpCtrl(
    $scope,
    $localStorage,
    $q,
    $state,
    $timeout,
    $rootScope,
    Auth,
    Me,
    Nav,
    Ref,
    Slug,
    TroopApi,
    TroopFactory,
    TroopMemberFactory,
    BoardFactory,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'controllers: SignUp - ',
      path: [ 'controllers', 'core', 'SignUp.js']
    };


    var that = this;

    $scope.Me = Me;

    Me.isSigningUp = true;

    this.troopRef = null;
    this.troopMemberRef = null;
    this.generatedTroopMemberId = null;

    $scope.showModal = true;
    $scope.isProcessing = false;
    $rootScope.showLoader = false;
    $scope.joinFromPT = Me.getTroopToJoin() ? true : false;
    $scope.formVals = {
      errorMsg: '',
      invalidCode: false,
      $storage: $localStorage
    };

    this.generateCode = function(form) {
      TroopLogger.debug(logConfig, 'generateCode');

      TroopApi.generateUserCode({
        loginId: phoneUtils.formatE164($scope.formVals.$storage.newAccount.phone)
      })
      .then(function() {

        $scope.formVals.$storage.newAccount.code = '';
        $scope.formVals.$storage.newAccount.step = 'verify-code';
      })
      .catch(function(error) {

        console.log(error);
        $scope.formVals.errorMsg = error.data;
      });

    };
    this.verifyCode = function(form) {
      TroopLogger.debug(logConfig, 'verifyCode');

      $scope.isProcessing = true;

      TroopApi.verifyUserCode({
        loginId: phoneUtils.formatE164($scope.formVals.$storage.newAccount.phone),
        code: $scope.formVals.$storage.newAccount.code
      })
      .then(function() {
        TroopLogger.debug(logConfig, 'TroopApi.verifyUserCode success');

        if ( $localStorage.lastInviteToken ) {

          return $q.reject({ code: 'FOUND_INVITE'});
        }

        $scope.formVals.$storage.newAccount.step = 'create-account';

        $scope.isProcessing = false;
      })
      .catch(function(error) {
        TroopLogger.error(logConfig, 'TroopApi.verifyUserCode failed', error);

        $scope.isProcessing = false;

        if ( error && error.code === 'FOUND_INVITE') {

          that.createAccount(form);
          return false;
        }

        $scope.formVals.invalidCode = true;

        form.code.$focused = false;
        form.code.$setDirty();
        form.code.$setTouched();
      });

    };
    this.createAccount = function(form) {

      TroopLogger.debug(logConfig, 'createAccount');

      $scope.isProcessing = true;

      var that = this;
      var loginId = phoneUtils.formatE164($scope.formVals.$storage.newAccount.phone);

      TroopApi.addUser({
        loginId: loginId,
        name: $scope.formVals.$storage.newAccount.name,
        password: $scope.formVals.$storage.newAccount.password
      })
      .then(function() {
        TroopLogger.debug(logConfig, 'TroopApi.addUser success');

        return TroopApi.login({
          loginId: loginId,
          password: $scope.formVals.$storage.newAccount.password
        });
      })
      .catch(function(error) {
        TroopLogger.error(logConfig, 'TroopApi.addUser or TroopApi.login failed', error);

        return $q.reject({ code: 'INVALID'});
      })
      .then(function(resp) {
        TroopLogger.debug(logConfig, 'TroopApi.login success');
        TroopLogger.debug(logConfig, 'resp.data.token', resp.data.token);

        return Auth.$signInWithCustomToken(resp.data.token);
      })
      .then(function(firebaseUser) {
        TroopLogger.debug(logConfig, 'TroopApi.addUser success');

        Me.firebaseUser = firebaseUser;
        Me.loadTrooper(Me.firebaseUser.uid);
        return Me.$doneTryingToLoadTrooper();

      })
      .then(function() {
        TroopLogger.debug(logConfig, 'doneTryingToLoadTrooper');

        return Me.trooper.$loaded();
      })
      .then(function() {

        TroopLogger.debug(logConfig, 'trooper.$loaded');

        var deferred = $q.defer();

        if ( $localStorage.lastInviteToken ) {

          TroopApi.acceptInvite({
            userId: Me.trooper.$id,
            token: $localStorage.lastInviteToken
          })
          .then(function(resp) {

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

            deferred.resolve();
          })
          .catch(function(error) {

            deferred.reject(error);
          });
        }
        else if ( Me.getTroopToJoin() ) {

          that.troopId = Me.getTroopToJoin();

          TroopApi.acceptInvite({
            troopId: that.troopId,
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

              that.troopId = resp.data.troopId;
              that.troopMemberId = resp.data.memberId;

              return;

            }
            else {

              $scope.formVals.errorMsg = resp.data;
              return $q.reject({ code: 'SERVER_ERROR'});
            }


          })
          .then(function() {

            deferred.resolve();
          })
          .catch(function(error) {

            deferred.reject(error);
          });
        }
        else {

          TroopApi.createTroop({
            troopName: $scope.formVals.$storage.newAccount.troopName,
            createdByUserId: Me.trooper.$id
          })
          .then(function(resp) {
            that.troopId = resp.data.troopId;

            return TroopApi.createMember({
              troopId: that.troopId,
              userId: Me.firebaseUser.uid,
              name: $scope.formVals.$storage.newAccount.name,
              troopPermission: 'admin'
            });

          })
          .then(function(resp) {

            var member = resp.data;

            that.troopMemberId = member.id;

            return TroopApi.addTroop({
              uid: Me.firebaseUser.uid,
              troopId: that.troopId,
              troopPermission: 'admin',
              troopMemberId: member.id,
              troopMemberName: member.memberName
            });

          })
          .then(function() {

            deferred.resolve();
          })
          .catch(function(error) {

            deferred.reject(error);
          });
        }

        return deferred.promise;
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

        var deferred = $q.defer();

        if ( $localStorage.lastInviteToken || Me.getTroopToJoin() ) {

          Me.$doneTryingToLoadAllBoards()
          .then(function() {

            return Me.allBoards.$loaded();
          })
          .then(function() {

            return Me.getFirstBoardId();

          })
          .then(function(boardId) {
            that.starterBoardId = boardId
            deferred.resolve();
          })
          .catch(function(error) {

            deferred.reject(error);
          });
        }
        else {
          // troop didn't exist, so because it's new, gotta create the default board too

          BoardFactory.createDefault({
            troopId: that.troopId,
            troopMemberId: that.troopMemberId
          })
          .then(function(boardRef) {

            that.starterBoardId = boardRef.key;
            deferred.resolve();
          })
          .catch(function(error) {

            deferred.reject(error);
          });
        }

        return deferred.promise;
      })
      .then(function() {
        that.navigateToTroop();
      })
      .catch(function(error) {

        $scope.isProcessing = false;

      });
    };

    this.navigateToTroop = function () {

      if ( Me.screen.size !== 'desktop' ) {

        $timeout(function() {

          $scope.formVals.$storage.newAccount.step = 'get-app';
          $scope.isProcessing = false;
        }, 2000);

        return false;
      }

      Me.loadBoard(that.troopId, that.starterBoardId)
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

        Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
      })
      .catch(function(error) {

        if ( error && (error.code === 'BOARD_DOES_NOT_EXIST') ) {
          Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
          Nav.toMyBoards(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest'
          );
          // $state.go('home.dashboard.boards.mine');
        }

      })
      .finally(function() {

        Me.isSigningUp = false;
        Me.monitorConnection();
        $scope.isProcessing = false;
        that.cleanLocalStorage();
      });

    };
    this.cleanLocalStorage = function() {

      $localStorage.newAccount = null;
      delete $localStorage.newAccount;
      $localStorage.lastInviteToken = null;
      delete $localStorage.lastInviteToken;
    };

    $scope.phoneCheck = function() {
      var curVal = $scope.formVals.$storage.newAccount.phone;
      if (
        $scope.signUpForm.phone.$invalid
        && phoneUtils.isValidNumber("+" + $scope.signUpForm.phone.$modelValue)
        && $scope.signUpForm.phone.$modelValue.charAt(0) !== '+'
      ) {

        $scope.formVals.$storage.newAccount.phone = '+' + $scope.signUpForm.phone.$modelValue;
      }
    };
    $scope.prevStep = function(form) {

      switch($scope.formVals.$storage.newAccount.step) {

        case 'generate-code':
          break;

        case 'verify-code':
          $scope.formVals.$storage.newAccount.step = 'generate-code';
          break;

        case 'create-account':
          $scope.formVals.$storage.newAccount.step = 'verify-code';
          break;
      }
    };
    $scope.nextStep = function(form) {

      form.$setSubmitted();

      if ( form.$invalid ) {

        _.each(form.$error, function( errors, errorType) {

          _.each(errors, function(field) {

            field.$setDirty();
            field.$setTouched();
          })
        });

        return false;
      }

      if ($scope.formVals.$storage.newAccount.step === 'verify-code' && $scope.joinFromPT){
        $scope.formVals.$storage.newAccount.step = 'create-account'
      }

      switch ( $scope.formVals.$storage.newAccount.step ) {

        case 'generate-code':
          that.generateCode(form);
          break;

        case 'verify-code':
          that.verifyCode(form);
          break;

        case 'create-account':
          that.createAccount(form);
          break;
      }

    }

    $scope.$on('window-size-changed', function(event, size) {
      $scope.$apply();
    });

    if ( ! $scope.formVals.$storage.newAccount ) {
      $scope.formVals.$storage.newAccount = {};
    }

    if ( ! $scope.formVals.$storage.newAccount.step ) {
      $scope.formVals.$storage.newAccount.step = 'generate-code';
    }


    Me.freeMe();
    Me.stopMonitoringConnection();
    Auth.logout(false);
  }

})();
