'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:ngAsset
 * @description
 * # ngAsset
 */
angular.module('webClientApp')
  .directive('ngAsset', [
    'Ref',
    function (
      Ref
    ) {

      return {
        scope: {
          ngAssets: '='
        },
        link: function(scope, element, attrs) {

          if (attrs.ngAsset && attrs.ngAssetField) {
            Ref.child('assets/' + attrs.ngAsset)
              .once(
              'value',
              function(snapshot) {
                var asset = snapshot.val();

                if (asset) {
                  var url;

                  if (asset.metaData) {
                    url = asset.metaData[attrs.ngAssetField];
                  }
                  else {
                    url = asset[attrs.ngAssetField];
                  }

                  if (url) {
                    element[0].src = url.replace('http://', 'https://');
                  }

                }


              }
            );

          }
          else  {

            var setSource = function() {

              if ( !_.isEmpty(scope.ngAssets) ) {

                var url;

                if (scope.ngAssets[0].metaData) {
                  url = scope.ngAssets[0].metaData[attrs.ngAssetField];
                }
                else {
                  url = scope.ngAssets[0][attrs.ngAssetField];
                }

                if (url) {
                  element[0].src = url.replace('http://', 'https://');
                }
              }
            }

            scope.ngAssets.$loaded().then(function() {

              setSource();

              scope.ngAssets.$watch(setSource);

            });

          }

        }
      }
    }
  ]);
