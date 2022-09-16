/* global phoneUtils, firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:LoginCtrl
 * @description
 * # LoginCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('LoginCtrl', LoginCtrl);

  LoginCtrl.$inject = [
    '$scope',
    '$localStorage',
    '$timeout',
    '$q',
    '$state',
    '$rootScope',
    'Auth',
    'Me',
    'Nav',
    'Ref',
    'ModalService',
    'TroopApi',
    'TroopLogger',
    'API_USER',
    'API_USER_NUT'
  ];


  function LoginCtrl(
    $scope,
    $localStorage,
    $timeout,
    $q,
    $state,
    $rootScope,
    Auth,
    Me,
    Nav,
    Ref,
    ModalService,
    TroopApi,
    TroopLogger,
    API_USER,
    API_USER_NUT
  ) {

    var logConfig = {
      slug: 'controllers: Login - ',
      path: [ 'controllers', 'core', 'Login.js']
    };

    var that = this;

    $scope.isProcessing = false;
    $scope.showDischargeModal = false;

    $scope.formVals = {
      errorMsg: '',
      failedAuth: false,
      invalidCode: false,
      $storage: $localStorage,
      passwordResetSent: false
    };

    this.cleanLocalStorage = function() {
      $scope.formVals.$storage.newAccount = null;
      delete $scope.formVals.$storage.newAccount;
    };

    this.navToBoard = function() {
      TroopLogger.debug(logConfig, 'navToBoard()');

      Me.$doneTryingToLoadBoard()
      .then(function waitForBoardToLoad() {
        // path needs a board loaded
        // wait for all boards and grab the first one
        TroopLogger.debug(logConfig, 'waitForBoardToLoad()');
        return Me.currentBoard.$loaded();
      })
      .then(function nav() {
        TroopLogger.debug(logConfig, 'nav()');

        that.cleanLocalStorage();


        $timeout(function() {

          var firstVisibleView = Me.currentBoard.getFirstVisibleView();

          Nav.toBoard(
            Me.currentBoard.viewMap[firstVisibleView],
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            Me.currentBoard.$id
          );

          Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});

        }, 800).then(function() {
          if ($scope.showDischargeModal) {
            that.showDischargeModal();
          }
        });

      });
    };
    this.showDischargeModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/message.html',
        controller: 'MessageModalCtrl'
      }).then(function(modal) {

        modal.scope.header = "Could Not Join Troop"

        modal.scope.message = "Sorry, you have left or been removed from the troop you tried to join. You now have to be invited back in by an admin.";

        modal.scope.accept = function() {

          modal.scope.close();
        };

        modal.close.then(function(result) {

        });

      });
    }
    this.navToTeamBoards = function() {

      Nav.toAvailableBoards(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest'
      );
      // $state.go('home.dashboard.boards.available');

      Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
      that.cleanLocalStorage();
    };

    $scope.formChange = function() {
      if ($scope.formVals.failedAuth) {
        $scope.formVals.failedAuth = false;
      }
    };
    $scope.phoneCheck = function() {

      if (
        $scope.loginForm.phone.$invalid
        && phoneUtils.isValidNumber('+' + $scope.loginForm.phone.$modelValue)
        && $scope.loginForm.phone.$modelValue.charAt(0) !== '+'
      ) {
        $localStorage.newAccount.phone = '+' + $scope.loginForm.phone.$modelValue;
      }
    };

    $scope.login = function(form) {

      form.$setSubmitted();

      if ( form.$invalid ) {

        _.each(form.$error, function( errors, errorType) {

          _.each(errors, function(field) {
            field.$setDirty();
            field.$setTouched();
          });
        });

        return false;
      }

      firebase.database().goOnline();
      $scope.isProcessing = true;
      Me.isLoggingIn = true;
      $scope.formVals.errorMsg = '';

      TroopApi.login({
        loginId: phoneUtils.formatE164($scope.formVals.$storage.newAccount.phone),
        password: $scope.formVals.$storage.newAccount.password
      })
      .catch(function serverErrors(error) {
        TroopLogger.debug(logConfig, error);

        return $q.reject({ code: 'INVALID_PASSWORD'});
      })
      .then(function doAuth(resp) {
        TroopLogger.debug(logConfig, 'Auth.$signInWithCustomToken()');
        if (resp.code === "ALREADY_LOGGED_IN") {
          // do something in here ??
        }
        return Auth.$signInWithCustomToken(resp.data.token);
      })
      .then(function tryToLoadTrooper(firebaseUser) {
        TroopLogger.debug(logConfig, 'tryToLoadTrooper');

        that.cleanLocalStorage();

        Me.firebaseUser = firebaseUser;
        return Me.loadTrooper(firebaseUser.uid);
      })
      .then(function waitingForTrooperToLoad() {

        TroopLogger.debug(logConfig, 'waitingForTrooperToLoad');
        return Me.trooper.$loaded();
      })
      .then(function checkForTroopInvite() {

        TroopLogger.debug(logConfig, 'checkForTroopInvite');
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


          if ( Me.lastTroopMemberId && Me.lastTroopId ) {

            that.troopMemberId = Me.lastTroopMemberId;
            that.troopId = Me.lastTroopId;
          }
          else {

            var firstTroop = Me.getFirstTroop();

            if ( ! firstTroop ) {

              $state.go('home');
              deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
            }

            that.troopMemberId = firstTroop.troopMemberId;
            that.troopId = firstTroop.troopId;
          }

          deferred.resolve();
        }

        return deferred.promise;
      })
      .then(function checkToJoinPublicTroop() {

        TroopLogger.debug(logConfig, 'checkToJoinPublicTroop');
        var deferred = $q.defer();
        if ( Me.getTroopToJoin() ) {

          that.troopId = Me.getTroopToJoin();

          if ( ! Me.trooper.troops[that.troopId] ) {
            TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - member not in troop, accept invite' )
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
          else if ( Me.trooper.troops[that.troopId].troopPermission === 'banned' ){
            TroopLogger.debug( logConfig, 'checkToJoinPublicTroop() - member is banned from troop, find a new one' )
            $scope.showDischargeModal = true;
            if ( Me.lastTroopMemberId && Me.lastTroopId ) {

              that.troopMemberId = Me.lastTroopMemberId;
              that.troopId = Me.lastTroopId;
            }
            else {

              var firstTroop = Me.getFirstTroop();

              if ( ! firstTroop ) {

                $state.go('home');
                deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
              }

              that.troopMemberId = firstTroop.troopMemberId;
              that.troopId = firstTroop.troopId;
            }

            deferred.resolve();
          }
          else {
            TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - member is already in this troop' )
            deferred.resolve();
          }

        }
        else {
          TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - no PT to join' )
          deferred.resolve();
        }
        return deferred.promise;
      })
      .then(function tryToLoadTroop() {

        TroopLogger.debug(logConfig, 'try to load troop');
        Me.removeTroopToJoin();
        return Me.loadTroop(that.troopId);
      })
      .then(function waitForTroopToLoad() {

        TroopLogger.debug(logConfig, 'waitForTroopToLoad');
        return Me.troop.$loaded();
      })
      .then(function tryToLoadTroopMember() {

        TroopLogger.debug(logConfig, 'tryToLoadTroopMember');
        return Me.loadTroopMember(that.troopId, that.troopMemberId);
      })
      .then(function waitForTroopMemberToLoad() {

        TroopLogger.debug(logConfig, 'waitForTroopMemberToLoad');
        return Me.troopMember.$loaded();
      })
      .then(function tryToLoadBoard() {

        TroopLogger.debug(logConfig, 'tryToLoadBoard');

        if (
          ( ! $localStorage.lastInviteToken )
          // has a remmbered board id
          && Me.lastBoardIds
          && Me.lastBoardIds[Me.troop.$id]
        ) {
          $scope.isProcessing = false;
          Me.loadBoard(Me.troop.$id, Me.lastBoardIds[Me.troop.$id]);
          return $q.reject({ code: 'SKIP_FINDING_FIRST_BOARD'});
        }

        // continue on to find first board

        return Me.$doneTryingToLoadAllBoards();
      })
      .then(function waitForAllBoardsToLoad() {
        // path needs a board loaded
        // wait for all boards and grab the first one
        TroopLogger.debug(logConfig, 'waitForAllBoardsToLoad');
        return Me.allBoards.$loaded();
      })
      .then(function getFirstBoard() {

        TroopLogger.debug(logConfig, 'getFirstBoard');
        return Me.getFirstBoardId();
      })
      .then(function tryToLoadFirstBoard(firstBoardId) {


        TroopLogger.debug(logConfig, 'tryToLoadFirstBoard');
        if ( ! firstBoardId ) {

          Nav.toAvailableBoards(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest'
          );
          // $state.go('home.dashboard.boards.available');
          Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
          return $q.reject({ code: 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS'});
        }
        else {
          Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
        }

        Me.loadBoard(Me.troop.$id, firstBoardId);
        that.navToBoard();
        $scope.isProcessing = false;
      })
      .catch(function(error) {

        if ( error && error.code ) {

          switch (error.code) {

            case 'SERVER_ERROR':
              TroopLogger.error(logConfig, error);
              $scope.isProcessing = false;
              Me.freeMe();
              Me.stopMonitoringConnection();
              Auth.logout(false);
              break;

            case 'INVALID_PASSWORD':
            case 'INVALID_EMAIL':
            case 'INVALID_USER':
              TroopLogger.info(logConfig, error);
              $scope.formVals.failedAuth = true;
              $scope.isProcessing = false;
              break;

            case 'SKIP_FINDING_FIRST_BOARD':
              TroopLogger.info(logConfig, error);
              that.navToBoard();
              break;

            case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
              TroopLogger.info(logConfig, error);
              that.navToTeamBoards();
              break;

            default:
              TroopLogger.error(logConfig, error);
              break;
          }



        }

      });

    };

    $scope.forgotPassword = function(form) {

      if (form.phone.$invalid) {

        form.phone.$setDirty();
        form.phone.$setTouched();
      }
      else {

        TroopApi.login({
          loginId: API_USER,
          password: API_USER_NUT
        })
        .then(function() {

          return TroopApi.sendPasswordReset(phoneUtils.formatE164($scope.formVals.$storage.newAccount.phone));

        })
        .then(function() {

          $scope.formVals.passwordResetSent = true;
        })
        .catch(function(error) {

          TroopLogger.error(logConfig, error);
        });

      }

    };

    // Force logged out state if reaching this Login route

    Me.freeMe();
    Me.stopMonitoringConnection();
    Auth.logout(false);
  }

})();
