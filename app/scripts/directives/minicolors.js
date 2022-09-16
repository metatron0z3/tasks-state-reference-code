'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:minicolors
 * @description
 * # minicolors
 */
angular.module('webClientApp')
  .directive('minicolors', [
    function () {
      return function(scope, element, attrs) {

        element.minicolors({
          //defaultValue: this.options.field.value,
          letterCase: 'uppercase',
          opacity: true,
          showFormatSelector: true,
          change: function(hex, opacity, value) {
            //self.currentSelection = value;
          }
        });


      };
    }
  ]);