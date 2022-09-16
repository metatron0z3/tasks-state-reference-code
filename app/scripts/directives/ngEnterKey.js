'use strict';

// Refactor !
var insertAtCursor = function (el, text) {
  var val = el.value,
      endIndex,
      range;

  if (
    typeof el.selectionStart != "undefined"
    && typeof el.selectionEnd != "undefined"
  ) {
    endIndex = el.selectionEnd;
    el.value = val.slice(0, el.selectionStart) + text + val.slice(endIndex);
    el.selectionStart = el.selectionEnd = endIndex + text.length;
  }
  else if (
    typeof document.selection != "undefined"
    && typeof document.selection.createRange != "undefined"
  ) {
    el.focus();
    range = document.selection.createRange();
    range.collapse(false);
    range.text = text;
    range.select();
  }
}

/**
 * @ngdoc directive
 * @name webClientApp.directive:ngEnterKey
 * @description
 * # ngEnterKey
 */
angular.module('webClientApp')
  .directive('ngEnterKey',
    [
      function () {
        return {
          scope: {
            ngEnterKeyAction: '&',
            ngModel: '='
          },
          link: function(scope, element, attrs) {

            element.bind("keydown.enter keypress.enter", function(event) {
              var keyCode = event.which || event.keyCode;

              // If enter key is pressed
              if (keyCode === 13) {
                event.preventDefault();
                event.stopPropagation();

                if (
                  scope.ngModel
                  && attrs.ngEnterKeyCatch === 'single'
                  && (
                    event.altKey
                    || event.ctrlKey
                    || event.metaKey
                    || event.shiftKey
                  )
                ) {
                  insertAtCursor(element[0], "\n");
                  scope.$apply(function() {
                    scope.ngModel = element.val();
                  });

                }
                else {

                  scope.ngEnterKeyAction();

                  event.preventDefault();
                }
              }
            });
          }
        }

    }
  ]);
