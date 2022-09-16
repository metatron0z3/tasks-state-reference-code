'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpCardDescription
 * @description
 * # tpCardDescription
 */
angular.module('webClientApp')
  .directive('tpCardDescription', [
    '$sce',
    '$parse',
    '$compile',
    '$sanitize',
    '$timeout',
    'REGEX',
    function (
      $sce,
      $parse,
      $compile,
      $sanitize,
      $timeout,
      REGEX
    ) {

      return {
        restrict: 'A',
        scope: {
          tpCardDescription: '=',
          tpCardDescriptionTruncate: '=',
          tpCardDescriptionLinks: '=',
          tpCardDescriptionEmails: '=',
          tpCardDescriptionLength: '=',
          tpCardIndex: '=',
          tpCardId: '='
        },
        compile: function(tElement, tAttrs) {

          return function(scope, element, attr) {

            scope.$watch('tpCardDescription', function() {

              element.addClass('loading');

              $timeout(function() {

                element.empty();
                element.parent().removeClass('has-overflow');

                if (scope.tpCardDescription) {

                  var text = scope.tpCardDescription;
                  text = $sanitize(text);

                  if (
                    scope.tpCardDescriptionTruncate
                    && scope.tpCardDescriptionLength
                    && scope.tpCardDescriptionLength > 0
                  ) {
                    text = text.substring(0,scope.tpCardDescriptionLength);
                  }

                  text = text.replace(/(\n|&#10;)/gi, '<br>');

                  if ( ! scope.tpCardDescriptionTruncate ) {
                    element.html(text);
                  }
                  else {
                    element.html(text);

                    if (
                      element[0].offsetHeight < element[0].scrollHeight ||
                      element[0].offsetWidth < element[0].scrollWidth
                    ) {
                      element.addClass('has-overflow');
                      element.parent().addClass('has-overflow');
                    }
                  }

                  var html = element.html();
                  html = html.replace(/<br\/?>/g, "\n");
                  // fix html entities
                  var matches = html.match(/(&.*?;)/g);
                  var alreadyMatched = {};
                  _.each(matches, function(match) {

                    if ( ! alreadyMatched[match] ) {
                      alreadyMatched[match] = true;
                      var tmpDom = $('<div>');
                      var text = tmpDom.html(match).text();
                      tmpDom.remove();

                      html = html.replace(match, text);

                    }

                  });
                  element.text(html);

                  html = element.html();

                  if (scope.tpCardDescriptionLinks) {
                    html += ' ';
                    var doneUrls = {};
                    var matches = html.match(REGEX.urlFindReplace);

                    _.each(matches, function(url) {
                      if ( url && ! doneUrls[url] ) {

                        var href = '<a href="' + url + '" target="_blank">' + url + '</a>';

                        html = html.replace(new RegExp(url, 'g'), href);

                        doneUrls[url] = true;
                      }
                    });
                  }
                  if (scope.tpCardDescriptionEmails) {
                    var doneEmails = {};
                    var matches = html.match(REGEX.emailFileReplace);
                    _.each(matches, function(email) {
                      if ( email && ! doneEmails[email] ) {
                        var mailto = email;

                        if (scope.tpCardId) {
                          mailto = email + '?bcc=email@troop.cards&body=%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0AThis Email is Synced with https://troop.work — Software for Groups%0D%0A#TroopRef:' + scope.tpCardId + ' ';
                        }

                        var href = '<a href="mailto:' + mailto + '">' + email + '</a>';

                        html = html.replace(new RegExp(email, 'g'), href);

                        doneEmails[email] = true;
                      }
                    });
                  }

                  html = html.replace(/(\n|&#10;)/gi, '<br>');
                  element.html(html);

                }
                element.removeClass('loading');
              }, 100, false);

            });
          }
        }
      };


    }
  ]);
