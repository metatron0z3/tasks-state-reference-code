/**
 * @ngdoc function
 * @name webClientApp.directive:tpCheckbox
 * @description
 * # tpCheckbox
 * A directive that sets focus on first input element of every form
 */
angular.module('webClientApp')
.directive('tpCheckbox', [

  function(

  ) {


    return {
      restrict: 'A',
      scope: {
        model: '=tpCheckbox',

      },
      templateUrl: '/views/directives/troop/tp-checkbox.html'

    };


  }
]);
