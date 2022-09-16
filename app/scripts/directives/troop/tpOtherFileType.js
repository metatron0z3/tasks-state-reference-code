'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpOtherFileType
 * @description
 * # tpOtherFileType
 */
angular.module('webClientApp')
  .directive('tpOtherFileType', [
    function () {
      return {
        scope: {
          tpOtherFileType: '='
        },
        link: function(scope, element, attrs) {

          scope.$watch('tpOtherFileType', function() {

            if ( !_.isEmpty(scope.tpOtherFileType)) {

              var template =
                '<svg class="icon file-type ' + scope.tpOtherFileType + '">' +
                  '<use xlink:href="#' + scope.tpOtherFileType + '"/>' +
                '</svg>' +
                '<svg class="icon upload">' +
                  '<use xlink:href="#upload"/>' +
                '</svg>';

              element.html(template);
              element.addClass(scope.tpOtherFileType);
            }

          });

        }
      }
    }
  ]);
