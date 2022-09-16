'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:interactDraggable
 * @description
 * # interactDraggable
 */
angular.module('webClientApp')
  .directive('interactDraggable', [
    function () {
      return function(scope, element, attrs) {

        var start = {
          x: 0,
          y: 0
        };

        interact(element[0])
          .draggable({
            enabled: true,
            restrict: {
              restriction: 'parent',
            },
          })
          .allowFrom(' .drag-handle ')
          .on('dragmove', function(event) {

            start.x += event.dx;
            start.y += event.dy;

            element[0].setAttribute('style',
              'transform: translate('
              + start.x + 'px,'
              + start.y + 'px)'
            );


          });

      };
    }
  ]);