/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:DeleteModalCtrl
   * @description
   * # DeleteModalCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('DeleteModalCtrl', DeleteModalCtrl)

  DeleteModalCtrl.$inject = [
    '$scope',
    '$timeout',
    'close',
    'TroopLogger'
  ];
  function DeleteModalCtrl(
    $scope,
    $timeout,
    close,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'controller: DeleteModalCtrl - ',
      path: [ 'controllers', 'modal', 'Delete.js']
    };

    var vm = this;

    vm.err = null;
    vm.message = '';
    vm.element = '';
    vm.actionTaken = '';
    // vm.showModal = true;
    vm.warning = false;

    vm.cancel = cancel;
    vm.remove = remove;
    vm.closeModal = closeModal;

    activate();

    return;

    function activate() {

      vm.showModal = true;

      TroopLogger.error(logConfig, 'activate() called');

      $scope.$on('onEscapeKey', function(event) {
      vm.closeModal();
      })

    }

    function cancel() {
      // default initialization, should set function in .then() after .showModal()
    }

    function remove() {
      // default initialization, should set function in .then() after .showModal()
      TroopLogger.error(logConfig, 'remove() called');
    }

    function closeModal() {

      vm.showModal = false;

      $timeout(close, 800);
    }

  }

})();
