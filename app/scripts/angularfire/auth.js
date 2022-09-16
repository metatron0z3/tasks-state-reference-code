(function(){

/* global Firebase, $  */
/* jshint strict: true */
/* jshint -W014 */

'use strict';

angular
  .module(
    'firebase.auth',
    ['firebase', 'firebase.Ref']
  )
  .factory( 'Auth', AuthFce);

  AuthFce.$inject = [
    '$rootScope',
    '$state',
    '$stateParams',
    '$q',
    '$location',
    '$localStorage',
    '$firebaseAuth',
    'Ref',
    'Me',
    'Fingerprint',
    'TroopMemberFactory',
    'TroopApi',
    '$timeout',
    'TroopLogger'
  ];

  function AuthFce(
      $rootScope,
      $state,
      $stateParams,
      $q,
      $location,
      $localStorage,
      $firebaseAuth,
      Ref,
      Me,
      Fingerprint,
      TroopMemberFactory,
      TroopApi,
      $timeout,
      TroopLogger
    ) {

      var logConfig = {
        slug: 'core:       auth - ',
        path: [ 'core', 'auth.js']
      };

      var Auth = $firebaseAuth();

      Auth.$loaded = $loaded;
      Auth.onLoaded = onLoaded;
      Auth.logout = logout;

      activate();

      return Auth;

      function activate() {

        Auth.isAuthenticated = false;
        $rootScope.isAuthenticated = false;
        Auth.deferred = $q.defer();

        Auth.$loaded().then(onLoaded);
      }

      function $loaded() {
        return Auth.deferred.promise;
      }

      function onLoaded(firebaseUser) {

        TroopLogger.debug(logConfig, 'onLoaded()', $state);
        Auth.isAuthenticated = true;
        $rootScope.isAuthenticated = true;

        Me.firebaseUser = firebaseUser;



        TroopLogger.debug(logConfig, 'New FirebaseUser:', $.extend({}, firebaseUser));

        if ( Me.isSigningUp || Me.isLoggingIn ) {
          // don't redirect when not signing up or logging in
          return false;
        }

        if ( ($location.$$path || '').indexOf('/dashboard/') !== -1 ) {
          // don't redirect when already in dashbaord
          //return false;
        }



        if ( ($location.$$path || '').indexOf('/invite/') !== -1 ) {
          // don't redirect when inviting
          return false;
        }

        if ( ($location.$$path || '').indexOf('/sign-up') !== -1 ) {
          // don't redirect when signing up
          return false;
        }

        if ( ($location.$$path || '').indexOf('/reset') !== -1 ) {
          // don't redirect when signing up
          return false;
        }

        if ( ($location.$$path || '').indexOf('/login') !== -1 ) {
          // don't redirect when logging in
          return false;
        }

        if ( ($location.$$path || '').indexOf('/auth') !== -1 ) {
          // don't redirect when logging in
          return false;
        }

        if ( ($location.$$path || '').indexOf('/support') !== -1 ) {
          // don't redirect
          return false;
        }

        if ( ($location.$$path || '').indexOf('/tr/') !== -1 ) {
          // don't redirect
          Auth.deferred.resolve(firebaseUser);
          return false;
        }

        if ( ($location.$$path || '').indexOf('/affiliate') !== -1 ) {
          // don't redirect when in affiliate
          Auth.deferred.resolve(firebaseUser);
          return false;
        }


        if (
          ( ($location.$$path || '').indexOf('/home') !== -1 )
          && ( firebaseUser.isAnonymous )
        ) {
          // don't redirect when inviting
          return false;
        }
        // auto redirect
        Me.redirect(firebaseUser.uid);
      }

      function logout(redirectHome) {

        TroopLogger.debug(logConfig, 'logout()', $.extend({}, Auth.deferred));

        TroopApi.logout();

        Me.updateWindowTitle('Troop');

        Me.logout();

        if ( Auth.deferred.promise.$$state.status ) {

          Auth.deferred = $q.defer();
          Auth.$loaded().then(Auth.onLoaded);
        }

        Auth.isAuthenticated = false;
        $rootScope.isAuthenticated = false;

        Auth.$signOut();

        firebase.database().goOffline();
        firebase.database().goOnline();

        if ( redirectHome !== false ) {
          $state.go('home');
        }
      }
    }

})();
