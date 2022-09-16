'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpChatEntriesCount
 * @description
 * # tpChatEntriesCount
 */
angular.module('webClientApp')
  .directive('tpChatEntriesCount', [
    '$timeout',
    'Ref',
    function (
      $timeout,
      Ref
    ) {

      return {
        restrict: 'A',
        scope: {
          tpChatEntriesCount: '=',
          tpChatEntriesCountAppend: '='
        },
        compile: function(tElement, tAttrs) {

          return function(scope, element, attr) {
            scope.$watch('tpChatEntriesCount', function() {

              $timeout(function() {
                if (scope.tpChatEntriesCount) {
                  Ref.child('chats/' + scope.tpChatEntriesCount).once('value', function(snap) {
                    if (snap.exists()) {
                      var chat = snap.val();
                      var text = chat.totalChatEntries;
                      var single = 'Comment';
                      var plural = 'Comments';

                      if ( _.isObject(scope.tpChatEntriesCountAppend) ) {
                        single = scope.tpChatEntriesCountAppend.single;
                        plural = scope.tpChatEntriesCountAppend.plural;

                        if (chat.totalChatEntries === 0) {
                          //element.removeClass('has-comments');
                          text = single;
                        }
                        else {
                          text += ' ' + (chat.totalChatEntries > 1 ? plural : single) ;

                          element.addClass('has-comments');
                          element.parent().addClass('has-comments');
                        }
                      }
                      else if (chat.totalChatEntries > 0) {
                        element.addClass('has-comments');
                        element.parent().addClass('has-comments');
                      }

                      element.attr('data-count', text);


                    }
                    else {
                      element.removeAttr('data-count');
                      element.removeClass('has-comments');
                      element.parent().removeClass('has-comments');
                    }
                  });

                }
                else {
                  element.attr('data-count', 'Comment');
                  //element.removeClass('has-comments');
                }
              }, 0);

            });
          }
        }
      };


    }
  ]);
