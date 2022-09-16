'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpMultimediaPlayer
 * @description
 * # tpMultimediaPlayer
 */
angular.module('webClientApp')
  .directive('tpMultimediaPlayer', [
    '$sce',
    '$parse',
    '$compile',
    '$sanitize',
    '$timeout',
    'UAParser',
    'REGEX',
    function (
      $sce,
      $parse,
      $compile,
      $sanitize,
      $timeout,
      UAParser,
      REGEX
    ) {

      return {
        restrict: 'A',
        scope: {
          tpMultimediaPlayer: '='
        },
        compile: function(tElement, tAttrs) {
          var mobile = ('iOS' === UAParser.os.name) || ('Android' === UAParser.os.name);

          return function(scope, element, attr) {

            scope.$watch('tpMultimediaPlayer', function() {
              var asset = scope.tpMultimediaPlayer;
              element.empty();

              if ( asset.metaData && asset.metaData.videoIframe ) {
                var $iframe = $(asset.metaData.videoIframe);
                element.append($iframe);
                if ( ! mobile ) {
                  var player = new playerjs.Player($iframe[0]);
                  player.on('ready', function() {
                    player.play();
                  });
                }

              }
              else if (
                'file-video' === asset.fileType
                || 'file-audio' === asset.fileType
              ) {
                var src = asset.originalUrl;
                var template = '<video controls="" preload="auto" data-setup="{}" webkit-playsinline="" autoplay="" src="' + src + '"></video>';
                var $video = $(template);
                element.append($video);
                $video[0].load();
                var adapter = playerjs.HTML5Adapter($video[0]);
                adapter.ready();
              }



            });
          }
        }
      };


    }
  ]);
