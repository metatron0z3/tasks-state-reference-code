'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:ngCharacterEnforcer
 * @description
 * # ngCharacterEnforcer
 */
angular.module('webClientApp')
  .directive('ngCharacterEnforcer', function () {
    return {
      require: 'ngModel',
      link: function(scope, element, attrs, modelCtrl) {

        modelCtrl.$parsers.push(function (inputValue) {
          // this next if is necessary for when using ng-required on your input.
          // In such cases, when a letter is typed first, this parser will be called
          // again, and the 2nd time, the value will be undefined
          if (inputValue == undefined) {
            return '';
          }

          var map = {
            'numbers-only': /[^0-9]/g
          };

          var regex = map[attrs.ngCharacterEnforcer];
          if ( ! regex ) {
            return '';
          }

          var transformedInput = inputValue.replace(regex, '');
          if (transformedInput!=inputValue) {
            modelCtrl.$setViewValue(transformedInput);
            modelCtrl.$render();
          }

          return transformedInput;
        });
      }
    };
  });