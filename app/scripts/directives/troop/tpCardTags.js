'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpCardTags
 * @description
 * # tpCardTags
 */
angular.module('webClientApp')
  .directive('tpCardTags', [
    'Ref',
    function (
      Ref
    ) {

      return {
        scope: {
          tpCardTags: '='
        },
        link: function(scope, element, attrs) {

          scope.$watch('tpCardTags', function() {

            if ( !_.isEmpty(scope.tpCardTags)) {

              // remove data-tp-card-tag-* && tp-card-tag-*
              _.each(element[0].attributes, function(attrib) {
                if (attrib && ( attrib.name.indexOf('tp-card-tag-') !== -1 ) ) {
                  element.removeAttr(attrib.name);
                }
              });

              _.each(scope.tpCardTags, function(value, key) {
                element.attr('data-tp-card-tag-' + key, value);
              });

            }

          });

        }
      }
    }
  ]);
