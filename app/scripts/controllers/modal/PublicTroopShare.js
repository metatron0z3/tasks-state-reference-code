/* global Clipboard,$ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:PublicTroopShareModalCtrl
 * @description
 * PublicTroopShareModalCtrl
 * Controller of the webClientApp
 */
angular
  .module('webClientApp')
  .controller('PublicTroopShareModalCtrl', PublicTroopShareModalCtrl);

  PublicTroopShareModalCtrl.$inject = [
    '$scope',
    '$timeout',
    '$notification',
    'Me',
    'close',
    'TROOP_CLIPBOARD',
    'WEB_SERVER_URL',
    'TroopLogger'
  ];

  function PublicTroopShareModalCtrl(
    $scope,
    $timeout,
    $notification,
    Me,
    close,
    TROOP_CLIPBOARD,
    WEB_SERVER_URL,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'controller: Public Troop Share Modal - ',
      path: [ 'controllers', 'modal', 'PublicTroopShare.js']
    };

    /* jshint validthis: true */
    var vm = this;

    waitForElementToDisplay('.copy-btn',100);

    function waitForElementToDisplay(selector, time) {

      if ( document.querySelector(selector) !== null ) {

        vm.clipboard = new Clipboard( $('.copy-btn')[0] );
      }
      else {

        setTimeout(function() {

          waitForElementToDisplay(selector, time);
        }, time);
      }
    }

    vm.close = closeModal;

    $scope.copyNotification = copyNotification;

    activate();

    return;

    function activate() {


      vm.showModal = true;

      vm.publicURL = {
        baseUrl: WEB_SERVER_URL + '/tr/',
        troopSlug: Me.troop.troopSlug
      };

      $scope.$on('onEscapeKey', function(event) {
        vm.close();
      })
    }

    function closeModal() {

      vm.showModal = false;

      $timeout(function() {
        close();
      }, 800);
    }

    function copyNotification() {

      var url = vm.publicURL.baseUrl + vm.publicURL.troopSlug;

      vm.clipboard.on('success', function(e) {

        $notification(
          'Success!',
          {
            body: 'You copied: ' + url + ' to your clipboard.',
            dir: 'auto',
            lang: 'en',
            icon: TROOP_CLIPBOARD,
            delay: 5000,
            focusWindowOnClick: false
          }
        );

        TroopLogger.debug(logConfig, 'clipboard success');
        e.clearSelection();
        vm.clipboard.destroy();
        closeModal();
      });

      vm.clipboard.on('error', function(e) {

        TroopLogger.error(logConfig, 'clipboard error',e);
      });
    }
  }

})();
