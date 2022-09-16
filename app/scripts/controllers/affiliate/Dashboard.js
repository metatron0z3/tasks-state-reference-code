(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:AffiliateDashboardCtrl
   * @description
   * # AffiliateDashboardCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('AffiliateDashboardCtrl',AffiliateDashboardCtrl);

  AffiliateDashboardCtrl.$inject = [
    '$scope',
    '$localStorage',
    '$q',
    'Auth',
    'Me',
    'TroopLogger'
  ];

  return;

  function AffiliateDashboardCtrl(
    $scope,
    $localStorage,
    $q,
    Auth,
    Me,
    TroopLogger
  ) {
    var logConfig = {
      slug: 'controller: AffiliateDashboardCtrl - ',
      path: [ 'controllers', 'affiliate', 'Dashboard.js']
    };

    var vm = this;

    vm.Me = Me;

    activate();

    return;

    function activate() {

      Auth.$loaded()
      .then(function waitForRedirect(firebaseUser) {

        if ( ! Me.trooper ) {
          Me.redirectingDeferred.reject({
            code: 'AFFILIATE_LOAD',
            firebaseUser: firebaseUser
          });
        }

        return Me.$doneRedirecting();
      })
      .catch(function authRedirectCatch(error) {
        console.log('error')

        if ( error && error.code ) {

          switch (error.code) {

            case 'SIGNING_IN':
              // continue loading if signing in
              return this;

            case 'AFFILIATE_LOAD':
              return Me.loadTrooper(error.firebaseUser.uid);

            default:
              TroopLogger.error(logConfig, 'Auth & Redirecting catch()', error);
              break;
          }
        }

        // otherwise skip loading
        return $q.reject(error);
      })
      .then(function tryToLoadTrooper() {

        TroopLogger.debug(logConfig, 'tryToLoadTrooper');
        return Me.$doneTryingToLoadTrooper();
      })
      .then(function waitForTrooperToLoad() {
      TroopLogger.debug(logConfig, 'waitForTrooperToLoad');
      return Me.trooper.$loaded();
    })

    }


  }



})();
