/* global phoneUtils, firebase, firebaseui, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:AuthCtrl
   * @description
   * # AuthCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('AuthCtrl', AuthCtrl);

  AuthCtrl.$inject = [
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
    'BoardFactory',
    'TroopMemberFactory',
    'FirebaseApp',
    'ModalService',
    'TroopApi',
    'TroopLogger',
    'API_USER',
    'API_USER_NUT',
    'HELP_TROOP_ID',
    'HELP_TROOP_BOARD_ID'
  ];

  return;

  function AuthCtrl(
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
    BoardFactory,
    TroopMemberFactory,
    FirebaseApp,
    ModalService,
    TroopApi,
    TroopLogger,
    API_USER,
    API_USER_NUT,
    HELP_TROOP_ID,
    HELP_TROOP_BOARD_ID
  ) {

    if ( ! HELP_TROOP_ID ) {
      throw 'Critical error!!! No HELP_TROOP_ID defined.';
    }

    var logConfig = {
      slug: 'controllers: Auth - ',
      path: [ 'controllers', 'core', 'Auth.js']
    };

    var vm = this;
    vm.action = $state.current.name.replace('auth.', '');
    vm.failedAuth = false;
    vm.failedOauth = false;
    vm.failedFirebaseAuth = false;
    vm.errorMsg = '';
    vm.curState = '';
    vm.$storage = $localStorage;
    vm.passwordResetSent = false;
    vm.troopId = null;
    vm.troopMemberId = null;
    vm.starterBoardId = null;
    vm.credential = null;
    vm.email = null;
    vm.linkWithEmail = false;
    vm.loading = false;
    vm.loggingInWithProvider = null;

    vm.cleanLocalStorage = cleanLocalStorage;
    vm.displayOauth = displayOauth;
    vm.signUp = signUp;
    vm.login = login;
    vm.createTroop = createTroop;
    vm.linkOauths = linkOauths;
    vm.legacyLogin = legacyLogin;
    vm.formChange = formChange;
    vm.phoneCheck = phoneCheck;
    vm.forgotPassword = forgotPassword;
    vm.sendPassword = sendPassword;
    vm.navTo = navTo;
    vm.accountExistsWithDifferentCredential = accountExistsWithDifferentCredential;

    activate();

    return;

    function activate() {

      $rootScope.showLoader = false;
      $rootScope.showLoginMenu = false;

      forceLogout();

      // initFirebaseUi();

      if ( ! $localStorage.newAccount ) {

        $localStorage.newAccount = {};
      }

      checkAuth();

    }

    function forceLogout() {
      // Force logged out state if reaching this Auth route

      Me.freeMe();
      Me.stopMonitoringConnection();
      Auth.logout(false);
    }

    function navTo(view) {
      TroopLogger.debug(logConfig, 'navTo', view)
      vm.failedFirebaseAuth = false;
      vm.failedAuth = false;
      vm.failedOauth = false;
      vm.uiState = '';
      vm.action = view;

      switch (view) {

        case 'login':
          Nav.toLogin();
          break;

        case 'sign-up':
          Nav.toSignUp();
          break;

        case 'link-oauth':
          break;
      }
    }

    function checkAuth() {

      var user = firebase.auth().currentUser;
      if (user) {
        // User is signed in.

        firebase.auth().signOut()
        .then(
          function() {
            // Sign-out successful.

          },
          function(error) {
            // An error happened.
          }
        );
      }
      else {
        // No user is signed in.

      }

    }

    function createTroop(form) {
      TroopLogger.debug(logConfig, 'createTroop');

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

      createAccount();

    }

    function linkOauths(form) {

      TroopLogger.debug(logConfig, 'linkOauths');

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

      accountExistsWithDifferentCredential(vm.credential, vm.email);
    }

    function legacyLogin(form) {
      TroopLogger.debug(logConfig, 'legacyLogin');

      //
      // form.$setSubmitted();
      //
      // if ( form.$invalid ) {
      //
      //   _.each(form.$error, function( errors, errorType) {
      //
      //     _.each(errors, function(field) {
      //       field.$setDirty();
      //       field.$setTouched();
      //     });
      //   });
      //
      //   vm.uiState = 'pending';
      //   return false;
      // }

      firebase.database().goOnline();
      // vm.uiState = 'legacy-logging-in';
      $rootScope.showLoader = true;
      Me.isLoggingIn = true;
      vm.errorMsg = '';

      TroopApi.login({
        provider: 'phone',
        loginId: phoneUtils.formatE164($localStorage.newAccount.loginId),
        password: $localStorage.newAccount.password,
        tc: $localStorage.tc,
        inviteToken: $localStorage.lastInviteToken
      })
      .catch(function serverErrors(error) {
        TroopLogger.debug(logConfig, error);
        return $q.reject({ code: 'INVALID_PASSWORD'});
      })
      .then(function doAuth(resp) {
        TroopLogger.debug(logConfig, 'Auth.$signInWithCustomToken()');
        if (resp.code === 'ALREADY_LOGGED_IN') {
          // do something in here ??
        }
        return Auth.$signInWithCustomToken(resp.data.token);
      })
      .then(function tryToLoadTrooper(firebaseUser) {
        TroopLogger.debug(logConfig, 'tryToLoadTrooper');

        cleanLocalStorage();

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
            TroopLogger.debug(logConfig, 'acceptInvite - resp',resp );
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

              vm.errorMsg = resp.data;
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

            vm.troopMemberId = Me.lastTroopMemberId;
            vm.troopId = Me.lastTroopId;
          }
          else {

            var firstTroop = Me.getFirstTroop();

            if ( ! firstTroop ) {

              $state.go('home');
              deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
            }

            vm.troopMemberId = firstTroop.troopMemberId;
            vm.troopId = firstTroop.troopId;
          }

          deferred.resolve();
        }

        return deferred.promise;
      })
      .then(function checkToJoinPublicTroop() {

        TroopLogger.debug(logConfig, 'checkToJoinPublicTroop');
        var deferred = $q.defer();
        if ( Me.getTroopToJoin() ) {

          vm.troopId = Me.getTroopToJoin();

          if ( ! Me.trooper.troops[vm.troopId] ) {
            TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - member not in troop, accept invite' );
            TroopApi.acceptInvite({
              troopId: vm.troopId,
              reject: false
            })
            .then(function(resp) {

              TroopLogger.debug(logConfig, 'acceptInvite - resp',resp );

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

                vm.errorMsg = resp.data;
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
          else if ( Me.trooper.troops[vm.troopId].troopPermission === 'banned' ){
            TroopLogger.debug( logConfig, 'checkToJoinPublicTroop() - member is banned from troop, find a new one' );
            $scope.showDischargeModal = true;
            if ( Me.lastTroopMemberId && Me.lastTroopId ) {

              vm.troopMemberId = Me.lastTroopMemberId;
              vm.troopId = Me.lastTroopId;
            }
            else {

              var firstTroop = Me.getFirstTroop();

              if ( ! firstTroop ) {

                $state.go('home');
                deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
              }

              vm.troopMemberId = firstTroop.troopMemberId;
              vm.troopId = firstTroop.troopId;
            }

            deferred.resolve();
          }
          else {
            TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - member is already in this troop' );
            deferred.resolve();
          }

        }
        else {
          TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - no PT to join' );
          deferred.resolve();
        }
        return deferred.promise;
      })
      .then(function tryToLoadTroop() {

        TroopLogger.debug(logConfig, 'tryToLoadTroop');
        Me.removeTroopToJoin();
        return Me.loadTroop(vm.troopId);
      })
      .then(function waitForTroopToLoad() {

        TroopLogger.debug(logConfig, 'waitForTroopToLoad');
        return Me.troop.$loaded();
      })
      .then(function tryToLoadTroopMember() {

        TroopLogger.debug(logConfig, 'tryToLoadTroopMember');
        return Me.loadTroopMember(vm.troopId, vm.troopMemberId);
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
        navToBoard();
      })
      .catch(function(error) {

        if ( error && error.code ) {

          switch (error.code) {

            case 'SERVER_ERROR':
              TroopLogger.error(logConfig, error);
              $rootScope.showLoader = false;
              Me.freeMe();
              Me.stopMonitoringConnection();
              Auth.logout(false);
              break;

            case 'INVALID_PASSWORD':
            case 'INVALID_EMAIL':
            case 'INVALID_USER':
              TroopLogger.info(logConfig, error);
              vm.failedAuth = true;
              $rootScope.showLoader = false;
              break;

            case 'SKIP_FINDING_FIRST_BOARD':
              TroopLogger.info(logConfig, error);
              navToBoard();
              break;

            case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
              TroopLogger.info(logConfig, error);
              navToTeamBoards();
              break;

            default:
              TroopLogger.error(logConfig, error);
              break;
          }



        }

      });
    }

    function login(form) {
      TroopLogger.debug(logConfig, 'login');

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

      var isValidPhone = false;

      try {
        isValidPhone = phoneUtils.isValidNumber(form.loginId.$modelValue);
      }
      catch (error) {

      }

      var isValidEmail = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(form.loginId.$modelValue);

      if ( ( ! isValidPhone ) && ( ! isValidEmail ) ) {

        return false;
      }

      if ( isValidPhone ) {

        legacyLogin(form);
      }
      else if ( isValidEmail ) {

        emailLogin(form);
      }


    }

    function signUp(form) {
      TroopLogger.debug(logConfig, 'signUp');


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
      vm.uiState = 'oauthing';
      firebase.auth()
      .createUserWithEmailAndPassword(
        form.email.$modelValue,
        form.password.$modelValue
      )
      .then(function getUserToken(user) {
        TroopLogger.debug(logConfig, 'signUp', 'getUserToken', user);
        // The signed-in user info.
        Me.firebaseUser = user;

        return Me.firebaseUser.getToken();

      })
      .then(function apiLoginWithOauth(userToken) {
        TroopLogger.debug(logConfig, 'emailLogin', 'apiLoginWithOauth');

        return TroopApi.oauth({
          provider: 'email',
          token: userToken,
          name: form.name.$modelValue,
          email: Me.firebaseUser.providerData[0].email,
          uid: Me.firebaseUser.uid,
          avatarUrl: TroopMemberFactory.generateAvatar(Me.firebaseUser.uid),
          tc: $localStorage.tc,
          inviteToken: $localStorage.lastInviteToken
        });
      })
      .then(function apiLoginWithOauthSuccess(resp) {

        TroopLogger.debug(logConfig, 'emailLogin', 'apiLoginWithOauthSuccess', resp);

        if ( resp.data.newTroopId ) {
          createAccount(resp.data.newTroopId, resp.data.newBoardId);
        }
        else {

          loadDashboard();
        }
      })
      .catch(function emailBrokenDreamCatcher(error) {
        TroopLogger.debug(logConfig, 'emailBrokenDreamCatcher', error);

        $timeout(function() {
          vm.uiState = '';
          vm.failedFirebaseAuth = true;
          vm.errorMsg = error.message;
        }, 0);
      });
    }

    function emailLogin(form) {
      TroopLogger.debug(logConfig, 'emailLogin');

      vm.uiState = 'oauthing';
      firebase.auth()
      .signInWithEmailAndPassword(
        form.loginId.$modelValue,
        form.password.$modelValue
      )
      .then(function getUserToken(user) {
        TroopLogger.debug(logConfig, 'emailLogin', 'getUserToken', user);
        // The signed-in user info.
        Me.firebaseUser = user;

        return Me.firebaseUser.getToken();
      })
      .then(function apiLoginWithOauth(userToken) {
        TroopLogger.debug(logConfig, 'emailLogin', 'apiLoginWithOauth');

        return TroopApi.oauth({
          token: userToken,
          uid: Me.firebaseUser.uid,
          name: Me.firebaseUser.displayName,
          email: Me.firebaseUser.providerData[0].email,
          provider: 'email',
          avatarUrl: Me.firebaseUser.providerData[0].photoURL,
          tc: $localStorage.tc,
          inviteToken: $localStorage.lastInviteToken
        });
      })
      .then(function apiLoginWithOauthSuccess(resp) {

        TroopLogger.debug(logConfig, 'emailLogin', 'apiLoginWithOauthSuccess', resp);

        loadDashboard();
      })
      .catch(function emailBrokenDreamCatcher(error) {
        TroopLogger.debug(logConfig, 'emailBrokenDreamCatcher', error);

        $timeout(function() {
          vm.uiState = '';
          vm.failedFirebaseAuth = true;
          vm.errorMsg = error.message;
        }, 0);
      });
    }

    function displayOauth(providerId) {

      vm.uiState = 'oauthing';
      vm.loading = true;
      vm.failedOauth = false;
      vm.loggingInWithProvider = providerId;

      switch (providerId) {

        case 'google.com':
          displayGoogleOauth();
          break;

        case 'facebook.com':
          displayFacebookOauth();
          break;

        case 'twitter.com':
          displayTwitterOauth();
          break;

        case 'github.com':
          displayGithubOauth();
          break;
      }
    }

    function displayGithubOauth() {

      var provider = new firebase.auth.GithubAuthProvider();

      popupOauth(provider)
      // redirectOauth(provider)
      .then(function twitterOauthResult(result) {
        // This gives you a GitHub Access Token. You can use it to access the GitHub API.
        var token = result.credential.accessToken;
        // The signed-in user info.
        var user = result.user;
        // ...

      })
      .catch(OauthBrokenDreamCatcher);
    }

    function displayTwitterOauth() {

      var provider = new firebase.auth.TwitterAuthProvider();

      popupOauth(provider)
      // redirectOauth(provider)
      .then(function twitterOauthResult(result) {
        if (result.credential) {
          // This gives you a the Twitter OAuth 1.0 Access Token and Secret.
          // You can use these server side with your app's credentials to access the Twitter API.
          var token = result.credential.accessToken;
          var secret = result.credential.secret;
          // ...
        }
        // The signed-in user info.
        var user = result.user;

      })
      .catch(OauthBrokenDreamCatcher);
    }

    function displayFacebookOauth() {
      TroopLogger.debug(logConfig, 'displayFacebookOauth');

      var provider = new firebase.auth.FacebookAuthProvider();
      provider.addScope('email');
      provider.addScope('public_profile');
      provider.addScope('user_friends');

      popupOauth(provider)
      .then(function getUserToken(result) {
        TroopLogger.debug(logConfig, 'displayFacebookOauth', 'getUserToken', result);

        // The signed-in user info.
        Me.firebaseUser = result.user;

        if (result.credential) {
          // This gives you a Facebook Access Token. You can use it to access the Facebook API.
          var token = result.credential.accessToken;
          // ...
        }

        if ( ! Me.firebaseUser.email ) {

          Me.firebaseUser.updateEmail(Me.firebaseUser.providerData[0].email);
        }

        return Me.firebaseUser.getToken();
      })
      .then(function apiLoginWithOauth(userToken) {
        TroopLogger.debug(logConfig, 'displayFacebookOauth', 'apiLoginWithOauth');

        return TroopApi.oauth({
          provider: vm.loggingInWithProvider,
          token: userToken,
          email: Me.firebaseUser.providerData[0].email,
          name: Me.firebaseUser.displayName,
          uid: Me.firebaseUser.uid,
          avatarUrl: Me.firebaseUser.providerData[0].photoURL,
          tc: $localStorage.tc,
          inviteToken: $localStorage.lastInviteToken
        });
      })
      .then(function apiLoginWithOauthSuccess(resp) {

        TroopLogger.debug(logConfig, 'displayFacebookOauth', 'apiLoginWithOauthSuccess', resp);
        if ( resp.data.newTroopId ) {

          createAccount(resp.data.newTroopId, resp.data.newBoardId);
        }
        else {
          loadDashboard();
        }
      })
      .catch(OauthBrokenDreamCatcher);
    }

    function displayGoogleOauth() {
      TroopLogger.debug(logConfig, 'displayGoogleOauth');

      var provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/userinfo.email');
      provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      provider.addScope('https://www.googleapis.com/auth/plus.me');
      provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

      popupOauth(provider)
      // redirectOauth(provider)
      .then(function getUserToken(result) {
        TroopLogger.debug(logConfig, 'displayGoogleOauth', 'getUserToken', result);
        // The signed-in user info.
        Me.firebaseUser = result.user;

        if (result.credential) {
          // This gives you a Google Access Token. You can use it to access the Google API.
          var token = result.credential.accessToken;
        }

        if ( ! Me.firebaseUser.email ) {

          Me.firebaseUser.updateEmail(Me.firebaseUser.providerData[0].email);
        }

        return Me.firebaseUser.getToken();

      })
      .then(function apiLoginWithOauth(userToken) {
        TroopLogger.debug(logConfig, 'displayGoogleOauth', 'apiLoginWithOauth');

        return TroopApi.oauth({
          token: userToken,
          uid: Me.firebaseUser.uid,
          name: Me.firebaseUser.displayName,
          email: Me.firebaseUser.providerData[0].email,
          provider: vm.loggingInWithProvider,
          avatarUrl: Me.firebaseUser.providerData[0].photoURL,
          tc: $localStorage.tc,
          inviteToken: $localStorage.lastInviteToken
        });
      })
      .then(function apiLoginWithOauthSuccess(resp) {

        TroopLogger.debug(logConfig, 'displayGoogleOauth - success', 'apiLoginWithOauthSuccess', resp);
        if ( resp.data.newTroopId ) {

          createAccount(resp.data.newTroopId, resp.data.newBoardId);
        }
        else {

          loadDashboard();
        }
      })
      .catch(OauthBrokenDreamCatcher); //this catch is what should be returning account exists
    }

    function loadDashboard() {

      $timeout(function() {
        vm.loading = false;
        $rootScope.showLoader = true;
      }, 0);


      Me.loadTrooper(Me.firebaseUser.uid)
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
            inviteToken: $localStorage.lastInviteToken
          })
          .then(function(resp) {


            TroopLogger.debug(logConfig, 'acceptInvite - resp',resp );

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

              vm.errorMsg = resp.data;
              return $q.reject({ code: 'SERVER_ERROR'});
            }
          })
          .then(function() {

            deferred.resolve();
          })
          .catch(function(error) {

            if (
              error
              && error.data
              && error.data === 'User is already member of this troop.'
            ) {
              // continue to dashboard if user already member of troop

              if ( Me.lastTroopMemberId && Me.lastTroopId ) {

                vm.troopMemberId = Me.lastTroopMemberId;
                vm.troopId = Me.lastTroopId;
              }
              else {

                var firstTroop = Me.getFirstTroop();

                if ( ! firstTroop ) {

                  $state.go('home');
                  deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
                }

                vm.troopMemberId = firstTroop.troopMemberId;
                vm.troopId = firstTroop.troopId;
              }

              deferred.resolve();
            }
            else {
              deferred.reject(error);
            }
          });
        }
        else {


          if ( Me.lastTroopMemberId && Me.lastTroopId ) {

            vm.troopMemberId = Me.lastTroopMemberId;
            vm.troopId = Me.lastTroopId;
          }
          else {

            var firstTroop = Me.getFirstTroop();

            if ( ! firstTroop ) {

              $state.go('home');
              deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
            }

            vm.troopMemberId = firstTroop.troopMemberId;
            vm.troopId = firstTroop.troopId;
          }

          deferred.resolve();
        }

        return deferred.promise;
      })
      .then(function checkToJoinPublicTroop() {

        TroopLogger.debug(logConfig, 'checkToJoinPublicTroop');
        var deferred = $q.defer();
        if ( Me.getTroopToJoin() ) {

          vm.troopId = Me.getTroopToJoin();

          if ( ! Me.trooper.troops[vm.troopId] ) {
            TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - member not in troop, accept invite' );
            TroopApi.acceptInvite({
              troopId: vm.troopId,
              reject: false
            })
            .then(function(resp) {

              TroopLogger.debug(logConfig, 'acceptInvite - resp',resp );

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

                vm.errorMsg = resp.data;
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
          else if ( Me.trooper.troops[vm.troopId].troopPermission === 'banned' ){
            TroopLogger.debug( logConfig, 'checkToJoinPublicTroop() - member is banned from troop, find a new one' );
            $scope.showDischargeModal = true;
            if ( Me.lastTroopMemberId && Me.lastTroopId ) {

              vm.troopMemberId = Me.lastTroopMemberId;
              vm.troopId = Me.lastTroopId;
            }
            else {

              var firstTroop = Me.getFirstTroop();

              if ( ! firstTroop ) {

                $state.go('home');
                deferred.reject({ code: 'USER_HAS_NO_TROOPS' });
              }

              vm.troopMemberId = firstTroop.troopMemberId;
              vm.troopId = firstTroop.troopId;
            }

            deferred.resolve();
          }
          else {
            TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - member is already in this troop' );
            deferred.resolve();
          }

        }
        else {
          TroopLogger.debug(logConfig, 'checkToJoinPublicTroop() - no PT to join' );
          deferred.resolve();
        }
        return deferred.promise;
      })
      .then(function tryToLoadTroop() {

        TroopLogger.debug(logConfig, 'try to load troop');
        Me.removeTroopToJoin();
        return Me.loadTroop(vm.troopId);
      })
      .then(function waitForTroopToLoad() {

        TroopLogger.debug(logConfig, 'waitForTroopToLoad');
        return Me.troop.$loaded();
      })
      .then(function tryToLoadTroopMember() {

        TroopLogger.debug(logConfig, 'tryToLoadTroopMember');
        return Me.loadTroopMember(vm.troopId, vm.troopMemberId);
      })
      .then(function waitForTroopMemberToLoad() {

        TroopLogger.debug(logConfig, 'waitForTroopMemberToLoad');
        if (! Me.firebaseUser.emailVerified ) {
          $scope.showLinkModal = true;
        }
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
        navToBoard();
      })
      .catch(function(error) {
        
        if ( error && error.code ) {

          switch (error.code) {

            case 'SERVER_ERROR':
              TroopLogger.error(logConfig, error);
              $rootScope.showLoader = false;
              Me.freeMe();
              Me.stopMonitoringConnection();
              Auth.logout(false);
              break;

            case 'INVALID_PASSWORD':
            case 'INVALID_EMAIL':
            case 'INVALID_USER':
              TroopLogger.info(logConfig, error);
              vm.failedAuth = true;
              $rootScope.showLoader = false;
              break;

            case 'SKIP_FINDING_FIRST_BOARD':
              TroopLogger.info(logConfig, error);
              navToBoard();
              break;

            case 'TROOP_MEMBER_HAS_NOT_JOINED_ANY_BOARDS':
              TroopLogger.info(logConfig, error);
              navToTeamBoards();
              break;

            default:
              TroopLogger.error(logConfig, error);
              break;
          }
        }
        else {

          TroopLogger.error(logConfig, error);
        }

      });

    }

    function collectTroopName() {
      TroopLogger.debug(logConfig, 'collectTroopName');

      $timeout(function() {
        vm.uiState = 'collect-troop-name';
        $rootScope.showLoader = false;
      }, 0);
    }

    function createAccount(firstTroop, firstBoard) {
      TroopLogger.debug(logConfig, 'createAccount');

      $localStorage.newTroopId = firstTroop;

      $rootScope.showLoader = true;

      Me.loadTrooper(Me.firebaseUser.uid);
      Me.$doneTryingToLoadTrooper()
      .then(function waitingForTrooperToLoad() {

        TroopLogger.debug(logConfig, 'waitingForTrooperToLoad');
        return Me.trooper.$loaded();
      })
      .then(function checkForTroopInvite() {

        TroopLogger.debug(logConfig, 'checkForTroopInvite');

        var deferred = $q.defer();

        if ( $localStorage.lastInviteToken ) {

          TroopLogger.debug(logConfig, 'checkForTroopInvite', 'has invite token');

          TroopApi.acceptInvite({
            userId: Me.trooper.$id,
            token: $localStorage.lastInviteToken
          })
          .then(function inviteAccepted(resp) {

            TroopLogger.debug(logConfig, 'acceptInvite - resp',resp );

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
          .then(function acceptInviteResolve() {

            deferred.resolve();
          })
          .catch(function acceptInviteReject(error) {

            deferred.reject(error);
          });
        }
        else if ( Me.getTroopToJoin() ) {

          TroopLogger.debug(logConfig, 'checkForTroopInvite', 'has public troop to join');

          vm.troopId = Me.getTroopToJoin();

          TroopApi.acceptInvite({
            troopId: vm.troopId,
            reject: false
          })
          .then(function inviteAccepted(resp) {

            TroopLogger.debug(logConfig, 'acceptInvite - resp',resp );

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

              vm.errorMsg = resp.data;
              return $q.reject({ code: 'SERVER_ERROR'});
            }


          })
          .then(function acceptInviteResolve() {

            deferred.resolve();
          })
          .catch(function acceptInviteReject(error) {

            deferred.reject(error);
          });
        }
        else {
          deferred.resolve();
        }

        return deferred.promise;
      })
      .then(function tryToLoadTroop() {

        if (firstTroop) {
          vm.troopId = firstTroop;
        }
        else {
          vm.troopId = HELP_TROOP_ID;
        }



        TroopLogger.debug(logConfig, 'tryToLoadTroop');

        return Me.loadTroop(vm.troopId);
      })
      .then(function waitForTroopToLoad() {
        TroopLogger.debug(logConfig, 'waitForTroopToLoad');
        return Me.troop.$loaded();
      })
      .then(function tryToLoadTroopMember() {


        TroopLogger.debug(logConfig, 'tryToLoadTroopMember');
        return Me.loadTroopMember(vm.troopId, Me.trooper.troops[vm.troopId].memberId);
      })
      .then(function waitForTroopMemberToLoad() {

        TroopLogger.debug(logConfig, 'waitForTroopMemberToLoad');
        return Me.troopMember.$loaded();
      })
      .then(function tryToLoadBoard() {

        var deferred = $q.defer();

        Me.$doneTryingToLoadAllBoards()
        .then(function waitForAllBoardsToLoad() {


          return Me.allBoards.$loaded();
        })
        .then(function getFirstBoard() {

          return Me.getFirstBoardId();

        })
        .then(function loadBoardResolve(boardId) {
          //vm.troopId = HELP_TROOP_ID;
          if ( firstBoard && firstBoard !== '' ) {
            vm.starterBoardId = firstBoard;
          }
          else {
            vm.starterBoardId = boardId;
          }

          deferred.resolve();
        })
        .catch(function loadBoardReject(error) {

          deferred.reject(error);
        });

        // else {
        //   // troop didn't exist, so because it's new, gotta create the default board too
        //
        //   BoardFactory.createDefault({
        //     troopId: vm.troopId,
        //     troopMemberId: vm.troopMemberId
        //   })
        //   .then(function createDefaultBoardResolve(boardRef) {
        //
        //     vm.starterBoardId = boardRef.key;
        //     deferred.resolve();
        //   })
        //   .catch(function createDefaultBoardReject(error) {
        //
        //     deferred.reject(error);
        //   });
        // }

        return deferred.promise;
      })
      .then(function nav() {

        navigateToTroop();
      })
      .catch(function brokenDreamCatcher(error) {
        TroopLogger.debug(logConfig, 'createAccount failed', error);

      });
    }

    function OauthBrokenDreamCatcher(error) {

      // Handle Errors here.
      // var errorCode = error.code;
      // var errorMessage = error.message;
      // // The email of the user's account used.
      // var email = error.email;
      // // The firebase.auth.AuthCredential type that was used.
      // var credential = error.credential;
      $timeout(function() {
        vm.loading = false;
        $rootScope.showLoader = false;
        vm.failedOauth = true;
        vm.errorMsg = error.message;
      }, 0);

      if ( error.code === 'auth/account-exists-with-different-credential' ) {
        TroopLogger.debug(logConfig, 'account exists with diff error');

        firebase.auth()
        .fetchProvidersForEmail(error.email)
        .then(function(providers) {

          vm.providers = providers;

          $timeout(function() {
            if (vm.providers[0] === 'password') {
              vm.linkWithEmail = true;
            }
            navTo('link-oauth');
            vm.credential = error.credential;
            vm.email = error.email;
            $rootScope.showLoader = false;

          }, 0);
        });



        // $timeout(function() {
        //   $rootScope.showLoader = false;
        //   vm.failedOauth = true;
        //   vm.errorMsg = 'Account alreay exists. Linking accounts.'
        // }, 0);

      }

      TroopLogger.debug(logConfig, 'OauthBrokenDreamCatcher', error);
    }

    function accountExistsWithDifferentCredential(pendingCredential, email, password) {

      TroopLogger.debug(logConfig, 'accountExistsWithDifferentCredential');

      $rootScope.showLoader = true;

      var provider = getProviderForProviderId(vm.providers[0]);


      if (vm.providers[0] === 'password') {

        firebase.auth().signInWithEmailAndPassword(email, password)
        .then(function(user) {
          return user.link(pendingCredential);
        })
        .then(function() {

          loadDashboard();
        })
        .catch(function(error) {
          $timeout(function() {
            vm.loading = false;
            $rootScope.showLoader = false;
            vm.failedFirebaseAuth = true;
            vm.errorMsg = error.message;
          }, 0);
        });
        return;
      }
      else {
        firebase.auth()
        .signInWithPopup(provider)
        .then(function(result) {

          return result.user.link(pendingCredential);
        })
        .then(function() {

          //logging user in to the dashboard

          loadDashboard();
        })
        .catch(function(error) {

          console.log(error);

          if ( error.code === 'auth/popup-blocked' ) {


            //
            // firebase.auth().signInWithRedirect(provider);
            //
            // firebase.auth()
            // .getRedirectResult()
            // .then(function(result) {
            //
            //   // console.log(JSON.stringify(result));
            //   //
            //   // console.log(pendingCredential);
            //
            //   return result.user.link(pendingCredential);
            // })
            // .catch(function(error) {
            //   console.log(error);
            // // The provider's account email, can be used in case of
            // // auth/account-exists-with-different-credential to fetch the providers
            // // linked to the email:
            // var email = error.email;
            // // The provider's credential:
            // var credential = error.credential;
            // // In case of auth/account-exists-with-different-credential error,
            // // you can fetch the providers using this:
            // if (error.code === 'auth/account-exists-with-different-credential') {
            //
            //   auth.fetchProvidersForEmail(email).then(function(providers) {
            //
            //     console.log('providers',providers);
            //     // The returned 'providers' is a list of the available providers
            //     // linked to the email address. Please refer to the guide for a more
            //     // complete explanation on how to recover from this error.
            //
            //     })
            //     .then(function() {
            //
            //       loadDashboard();
            //     });
            //   }
            // });
         }
        });
       }






      switch ( pendingCredential.provider ) {

        case 'facebook.com':
          break;

        case 'google.com':
          break;

        case 'twitter.com':
          break;

        case 'github.com':
          break;
      }
    }

    function getProviderForProviderId(providerId) {
      switch (providerId) {

        case 'facebook.com':
          return new firebase.auth.FacebookAuthProvider();

        case 'google.com':
          return new firebase.auth.GoogleAuthProvider();

        case 'twitter.com':
          return new firebase.auth.TwitterAuthProvider();

        case 'github.com':
          return new firebase.auth.GithubAuthProvider();

      }
    }

    function redirectOauth(provider) {

      firebase.auth().signInWithRedirect(provider);

      return firebase.auth().getRedirectResult();
    }

    function popupOauth(provider) {
      TroopLogger.debug(logConfig, 'popupOauth');
      return firebase.auth().signInWithPopup(provider);
    }

    function initFirebaseUi() {

      // Initialize the FirebaseUI Widget using Firebase.
      vm.ui = new firebaseui.auth.AuthUI(FirebaseApp.auth());
      vm.uiConfig = {
        // 'signInSuccessUrl': 'support',
        signInOptions: [
          // Leave the lines as is for the providers you want to offer your users.
          firebase.auth.GoogleAuthProvider.PROVIDER_ID,
          firebase.auth.FacebookAuthProvider.PROVIDER_ID,
          firebase.auth.TwitterAuthProvider.PROVIDER_ID,
          // firebase.auth.GithubAuthProvider.PROVIDER_ID,
          // firebase.auth.EmailAuthProvider.PROVIDER_ID
        ],
        // Terms of service url.
        // 'tosUrl': '<your-tos-url>',
        callbacks: {
          onLoadStart: function() {

            vm.uiState = 'loading';
          },
          onLoadSuccess: function() {

            vm.uiState = 'complete';
            $scope.$apply();
          },
          signInSuccess: function (currentUser, credential, redirectUrl) {

            firebase.auth()
            .currentUser
            .getToken(true)
            .then(function(idToken) {

              TroopApi.setToken(idToken, currentUser.uid);
              TroopApi.validateSlug('testslug');
            })
            .catch(function(error) {

            });

            return false;
          }

        }
      };
      // The start method will wait until the DOM is loaded.
      vm.ui.start('#firebaseui-auth-container', vm.uiConfig);
    }

    function cleanLocalStorage() {
      TroopLogger.debug(logConfig, 'cleanLocalStorage()');

      $localStorage.newAccount = null;
      delete $localStorage.newAccount;

      $localStorage.lastInviteToken = null;
      delete $localStorage.lastInviteToken;

      $localStorage.tc = null;
      delete $localStorage.tc;

    }

    function navToBoard() {
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

        cleanLocalStorage();

        $timeout(function() {

          var firstVisibleView = Me.currentBoard.getFirstVisibleView();

          Nav.toBoard(
            Me.currentBoard.viewMap[firstVisibleView],
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            Me.currentBoard.$id
          );

          Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});

        }, 800)
        .then(function() {

          if ($scope.showDischargeModal) {
            showDischargeModal();
          }

        });

      });
    }

    function showDischargeModal() {

      if ( Me.modalIsOn ) {

        return;
      }
      
      ModalService.showModal({
        templateUrl: '/views/modal/message.html',
        controller: 'MessageModalCtrl'
      })
      .then(function(modal) {

        modal.scope.header = 'Could Not Join Troop';

        modal.scope.message = 'Sorry, you have left or been removed from the troop you tried to join. You now have to be invited back in by an admin.';

        modal.scope.accept = function() {

          modal.scope.close();
        };

      });
    }

    function navToTeamBoards() {

      Nav.toAvailableBoards(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest'
      );
      // $state.go('home.dashboard.boards.available');

      Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
      cleanLocalStorage();
    }

    function navigateToTroop() {

      Me.loadBoard(vm.troopId, vm.starterBoardId)
      .then(function() {

        return Me.currentBoard.$loaded();
      })
      .then(function() {

        Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});


        var firstVisibleView = Me.currentBoard.getFirstVisibleView();

        Nav.toBoard(
          Me.currentBoard.viewMap[firstVisibleView],
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          Me.currentBoard.$id
        );

      })
      .catch(function(error) {

        if ( error && (error.code === 'BOARD_DOES_NOT_EXIST') ) {
          Me.redirectingDeferred.reject({ code: 'SIGNING_IN'});
          Nav.toMyBoards(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest'
          );

        }

      })
      .finally(function() {

        Me.isLoggingIn = false;
        Me.monitorConnection();
        cleanLocalStorage();
      });

    }

    function formChange() {

      if (vm.failedAuth) {
        vm.failedAuth = false;
      }
      if (vm.failedFirebaseAuth) {
        vm.failedFirebaseAuth = false;
      }
    }

    function phoneCheck(form) {

      if (
        form.phone.$invalid
        && phoneUtils.isValidNumber('+' + form.phone.$modelValue)
        && form.phone.$modelValue.charAt(0) !== '+'
      ) {
        $localStorage.newAccount.phone = '+' + form.phone.$modelValue;
      }
    }

    function legacyforgotPassword(form) {

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

          return TroopApi.sendPasswordReset(phoneUtils.formatE164($localStorage.newAccount.phone));

        })
        .then(function() {

          vm.passwordResetSent = true;
        })
        .catch(function(error) {

          TroopLogger.error(logConfig, error);
        });

      }

    }
    function forgotPassword(form, curState) {

      vm.errorMsg = '';

      vm.curState = curState;

      switch (curState) {

        case 'Log In':
          vm.curNav = 'login'
          break;

        case 'Link Accounts':
          vm.curNav = 'link-oauth'
          break;
      }

      vm.action = 'forgot-password'
      if (form.loginId) {
        vm.email = form.loginId.$modelValue;
      }

    }

    function sendPassword(email) {

      firebase.auth().sendPasswordResetEmail(email)
      .then(function() {
        TroopLogger.debug(logConfig, 'password reset email');
        $timeout(function() {
          navTo(vm.curNav);
        }, 0);
      }, function(error) {
        vm.failedFirebaseAuth = true;
        vm.errorMsg = error;
        console.log(error);
      })
    }

  }

})();
