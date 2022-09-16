/* global _, Shepherd */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

  angular
  .module('webClientApp')
  .directive('shepherdTour', shepherdTour);

  shepherdTourCtrl.$inject = [
    '$scope',
    '$element',
    'TroopLogger'
  ];

  return;

  function shepherdTour() {
    var directive = {
        restrict: 'A',
        scope: {
          config: '=shepherdTour',
          start: '=shepherdTourStart'
        },
        controller: shepherdTourCtrl,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;
  }

  function shepherdTourCtrl(
    $scope,
    $element,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'directive: Shepherd Tour - ',
      path: [ 'directive', 'core', 'shepherdTour.js' ]
    };

    var vm = this;
    vm.tour = null;

    activate();

    return;

    function activate() {

      vm.tour = new Shepherd.Tour(vm.config.options);

      if ( vm.config.hasOwnProperty('events') ) {

        _.each(vm.config.events, function(fn, name) {

          vm.tour.on(name, fn);
        });
      }

      _.each(vm.config.steps, function(step) {

        _.each(step.options.buttons, function(button) {

          switch (button.action) {

            case 'next':
              button.action = vm.tour.next;
              break;

            case 'back':
              button.action = vm.tour.back;
              break;

            case 'cancel':
              button.action = vm.tour.cancel;
              break;

            case 'complete':
              button.action = vm.tour.complete;
              break;
          }

        });

        vm.tour.addStep(step.step, step.options);

      });

      $scope.$watch('vm.start', function() {

        if (vm.start) {

          vm.tour.start();
        }

      });

      $scope.$on('$destroy', function() {

        _.each(vm.tour.steps, function(step) {

          step.destroy();
        });

      });
    }
  }




})(); // end of file
