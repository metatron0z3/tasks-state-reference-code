/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */
(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:AffiliateTableCtrl
   * @description
   * # AffiliateTableCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('AffiliateTableCtrl', AffiliateTableCtrl);

  AffiliateTableCtrl.$inject = [
    '$scope',
    '$q',
    '$firebaseArray',
    'Me',
    'Auth',
    'Ref',
    'TroopLogger',
    'ModalService'
  ];

  return;

  function AffiliateTableCtrl(
    $scope,
    $q,
    $firebaseArray,
    Me,
    Auth,
    Ref,
    TroopLogger,
    ModalService
  ) {

    var logConfig = {
     slug: 'controller: Affiliate Table - ',
     path: [ 'controllers', 'affiliate', 'Table.js' ]
    };

    var vm = this;

    vm.Me = Me;
    vm.trackingCodes = null;
    vm.analytics = null;
    vm.unwatchAnalytics = null;
    vm.unwatchTrackingCodes = null;
    vm.codeBreakdowns = [];

    vm.showTrackingCodeModal = showTrackingCodeModal;

    activate();

    return;

    function activate() {

     Auth.$loaded()
     .then(function() {

       TroopLogger.debug(logConfig, 'Auth.$loaded()');
       return Me.$doneRedirecting();
     })
     .catch(function(error) {
       TroopLogger.error(logConfig, 'Auth.$loaded ERROR',error);

       if ( error && error.code ) {

         switch (error.code) {

           case 'AFFILIATE_LOAD':
             return this;

           case 'SIGNING_IN':
             // continue loading if signing in
             return this;
         }
       }

       // otherwise skip loading
       return $q.reject(error);
     })
     .then(function waitingForTrooperToLoad() {

       TroopLogger.debug(logConfig, 'waitingForTrooperToLoad');
       return Me.trooper.$loaded();
     })
     .then(function() {

       initTrackCodes();
       initAnalytics();

       $q.all([
         vm.trackingCodes.$loaded(),
         vm.analytics.$loaded()
       ])
       .then(compileAnalytics);
     });

    }

    function compileAnalytics() {

      vm.codeBreakdowns = [];

      _.each(vm.trackingCodes, function(code) {

        var codeBreakdown = {
          name: code.$id,
          'facebook.com': {
            count: 0
          },
          'google.com': {
            count: 0
          },
          email: {
            count: 0
          },
          total: {
            count: 0
          }
        }

        var tcAnalytics = _.filter(vm.analytics, function(analytic, userId) {

          var isForCurrentTc = analytic.signUp && ( analytic.signUp.tcId === code.$id );

          if ( isForCurrentTc ) {

            codeBreakdown[analytic.signUp.provider].count += 1;
            codeBreakdown.total.count += 1;
          }

          return isForCurrentTc;
        });

        vm.codeBreakdowns.push(codeBreakdown);

      });

    }

    function initTrackCodes() {

      vm.trackingCodes = new $firebaseArray(
        Ref.child('trackingCodes')
        .orderByChild('userId')
        .equalTo(Me.firebaseUser.uid)
      );

      vm.trackingCodes.$loaded()
      .then(function() {

        vm.unwatchTrackingCodes = vm.trackingCodes.$watch(function(event) {

          switch (event.event) {

           case 'child_added':
             compileAnalytics();
             break;

          }

        });
      });

      $scope.$on('$destroy', function() {

       if ( vm.unwatchTrackingCodes ) {

         vm.unwatchTrackingCodes();
       }
      });
    }

    function initAnalytics(tc) {

     vm.analytics = new $firebaseArray(
       Ref.child('analytics')
       .child('users')
     );

     vm.analytics.$loaded()
     .then(function() {

       vm.unwatchAnalytics = vm.analytics.$watch(function(event) {

         switch (event.event) {

          case 'child_changed':
            compileAnalytics();
            break;

         }

       });
     });

     $scope.$on('$destroy', function() {

       if ( vm.unwatchAnalytics ) {

         vm.unwatchAnalytics();
       }
     });
    }

    function showTrackingCodeModal() {

     ModalService.showModal({
       templateUrl: '/views/modal/tracking-code.html',
       controller: 'TrackingCodeModalCtrl as vm'
     });

    }
  }

})();
