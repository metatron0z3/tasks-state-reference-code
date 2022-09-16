'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpAsset
 * @description
 * # tpAsset
 */
angular.module('webClientApp')
  .directive(
    'tpAsset',
    [
      'Slug',
      'Ref',
      'FileFactory',
      'MIME_TYPES',
      function tpAsset(
        Slug,
        Ref,
        FileFactory,
        MIME_TYPES
      ) {

        var uniqueId = 1;

        var controller = [
          '$rootScope',
          '$scope',
          '$element',
          '$attrs',
          '$http',
          '$timeout',
          '$sce',
          'Me',
          'ModalService',
          'AssetFirebaseObject',
          // 'Ocrad',
          function tpAssetController(
            $rootScope,
            $scope,
            $element,
            $attrs,
            $http,
            $timeout,
            $sce,
            Me,
            ModalService,
            AssetFirebaseObject
            // Ocrad
          ) {
            var that = this;
            this.unwatchAssetId = null;
            this.unwatchAssetSize = null;
            that.unwatchAsset = null;

            $scope.isRenaming = false;
            $scope.thumbnailStyling = {};
            $scope.assetState = 'fetching';
            $scope.canDownload = $scope.tpAssetDownload;
            $scope.canRename = $scope.tpAssetRename;
            $scope.canRemove = $scope.tpAssetRemove;
            $scope.iconMenu = $scope.tpAssetIconMenu;
            $scope.menuDisplay = ($scope.tpAssetShowMenu !== undefined) ? $scope.tpAssetShowMenu : true;
            // $scope.canOcr = !!$rootScope.isjhExperiencePlus;
            $scope.canStreamDownload = false;
            $scope.hasThumbnailClick = !! $attrs.tpAssetThumbnailClick;
            $scope.$asset = null;
            $scope.formData = {};
            $scope.permission = null;

            if ( Me.troopMember && Me.troopMember.troopPermission ) {
              $scope.permission = Me.troopMember.troopPermission;
            }

            var clickableFileTypes = [
              'file-image',
              'file-pdf',
              'file-text-document',
              'file-presentation',
              'file-spreadsheet'
            ];

            $scope.showPublicTroopJoinModal = function() {

              if ( Me.modalIsOn ) {

                return;
              }

              ModalService.showModal({
                templateUrl: '/views/modal/public-troop-join.html',
                controller: 'PublicTroopJoinModalCtrl as vm'
              }).then(function(modal) {

                modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

                modal.close.then(function(result) {

                });

              });
            };
            $scope.rename = function() {

              $scope.isRenaming = true;
              $element.addClass('renaming');
            };
            $scope.renameCancel = function() {

              $scope.formData.newFilename = $scope.$asset.fileName;
              $scope.isRenaming = false;
              $element.removeClass('renaming');
            };
            $scope.renameSave = function(form) {

              if ( ! form.$valid ) {
                return false;
              }

              if ($scope.$asset.fileName === $scope.formData.newFilename) {

                $scope.formData.newFilename = $scope.$asset.fileName;
                $scope.isRenaming = false;
                $element.removeClass('renaming');
                return false;
              }


              $scope.$asset.fileName = $scope.formData.newFilename;
              $scope.$asset.updatedAt = firebase.database.ServerValue.TIMESTAMP;
              $scope.$asset.$save();
              $scope.isRenaming = false;
              $element.removeClass('renaming');
            };
            $scope.refresh = function() {

              $scope.hasFileToUpload = false;
              $scope.showImage = false;
              $scope.showNonImage = false;
              $scope.showPlayButton = false;
              $scope.showImageClick = false;
              $scope.showAsset = true;

              if ( $scope.$asset ) {


                $scope.fileType = $scope.$asset.fileType;
                $scope.fileName = $scope.$asset.fileName;

                // $scope.download = function(){
                //   $http.get($scope.$asset.originalUrl, {
                //     responseType: 'arraybuffer'
                //   }).then(function(response) {
                //     var file = new Blob([response.data], {type: fType});
                //     console.log($element);  //downloadLink
                //     a.href = window.URL.createObjectURL(file);
                //     a.download = $scope.$asset.fileName;
                //     a.click();
                //   });
                // }

                $scope.formData.newFilename = $scope.$asset.fileName;
                $scope.fileExtension = $scope.$asset.fileExtension;
                $scope.fileBasename = $scope.$asset.fileBasename;
                $scope.formattedVideoDuration = $scope.$asset.formattedVideoDuration;

                if ($scope.fileName === $scope.fileExtension) {
                  $scope.fileExtension = "";
                  $scope.fileBasename = $scope.fileName;
                }

                if ( $scope.$asset.formattedVideoDuration ) {

                  $scope.formattedStorageSize = $scope.$asset.formattedVideoDuration;
                }
                else {

                  $scope.formattedStorageSize = $scope.$asset.formattedStorageSize;
                }

                if ($scope.$asset.isUploading) {

                  $element.addClass('uploading');
                }
                else if ($scope.$asset.uploadComplete) {

                  $element.removeClass('uploading');
                  $scope.thumbnailStyling = {};

                  if ($scope.fileType === 'file-image') {

                    $scope.showImage = true;

                    $scope.imageUrl = $scope.$asset.originalUrl;

                    if (
                      $scope.assetSize
                      && $.trim($scope.assetSize) !== 'originalUrl'
                      && $scope.$asset.metaData
                      && $scope.$asset.metaData.hasOwnProperty($scope.assetSize)
                    ) {

                      $scope.imageUrl = $scope.$asset.metaData[$scope.assetSize];
                    }

                    /*
                    if (
                      $scope.$asset.metaData
                      && $scope.$asset.metaData.color
                    ) {

                      $scope.thumbnailStyling = {
                        background: $scope.$asset.metaData.color
                      };
                    }
                    */

                    if (
                      $rootScope.isjhExperience
                      && $scope.$asset.metaData
                      && $scope.$asset.metaData.hasOwnProperty('videoUrl')
                    ) {
                      $scope.canStreamDownload = true;
                    }
                  }

                  if (
                    ( ! $scope.hasMoreAssets )
                    && $scope.hasThumbnailClick
                  ) {

                    if (
                      ( $scope.fileType === 'file-video' )
                      || ( $scope.fileType === 'file-audio' )
                    ) {

                      $scope.showPlayButton = true;
                    }

                    if (
                      $scope.$asset.metaData
                      && $scope.$asset.metaData.hasOwnProperty('videoUrl')
                    ) {
                      $scope.showPlayButton = true;
                      $scope.canDownload = false;
                      $element.addClass('embeded-video');
                    }

                    if ( clickableFileTypes.indexOf($scope.fileType) !== -1 ) {

                      $scope.showImageClick = true;
                    }

                  }

                }


                if ( $scope.displayDocument ) {

                  if ( $scope.$asset.fileType === 'file-pdf' ) {

                    $scope.iframeUrl = $sce.trustAsResourceUrl($scope.$asset.originalUrl);
                  }
                  else {

                    $scope.iframeUrl = $sce.trustAsResourceUrl(
                      'https://view.officeapps.live.com/op/embed.aspx?src=' + $scope.$asset.originalUrl
                    );
                  }

                }

              }
              else if ($scope.assetFile) {

                $scope.hasFileToUpload = true;
                $scope.fileType = FileFactory.fileTypeClass($scope.assetFile.type);
                $scope.fileName = $scope.assetFile.name;
                $scope.formData.newFilename = $scope.fileName;
                var parts = $scope.fileName.split('.');
                $scope.fileExtension = parts.pop();
                $scope.fileBasename = parts.join('.');

                $scope.formattedStorageSize = FileFactory.formatBytes($scope.assetFile.size, 1);


              }
              else if ($scope.assetExternalUrl) {

                $scope.showImage = true;
                $scope.imageUrl = $scope.assetExternalUrl;
                $scope.fileType = 'file-image';

                if (
                  $scope.assetEmbedlyImage.metaData
                  && $scope.assetEmbedlyImage.metaData.video
                  && $scope.assetEmbedlyImage.metaData.video.title
                ) {
                  $scope.fileName = Slug.slugify($scope.assetEmbedlyImage.metaData.video.title) + '.embed';
                }
                else {
                  $scope.fileName = URI($scope.imageUrl).filename();
                }
                $scope.formData.newFilename = $scope.fileName;
                var parts = $scope.fileName.split('.');
                $scope.fileExtension = parts.pop();
                $scope.fileBasename = parts.join('.');

                if (
                  $scope.assetEmbedlyImage
                  && $scope.assetEmbedlyImage.formattedVideoDuration
                ) {
                  $scope.formattedVideoDuration = $scope.assetEmbedlyImage.formattedVideoDuration;
                  $scope.formattedStorageSize = $scope.formattedVideoDuration;
                }

              }

              if ($scope.fileType !== 'file-image' && $scope.fileType !== undefined) {

                $element.addClass('file-non-image');

                $scope.showNonImage = true;

                if (
                  $scope.$asset
                  && ( $scope.$asset.isUploading )
                ) {

                  $scope.showNonImage = false;
                }

                if ($element.parent().attr('class').indexOf('two-row-container') !== -1){
                  $element.unwrap();
                }
              }
              else{
                $element.removeClass('file-non-image');
                $scope.showNonImage = false;
              }


              if (
                $scope.assetCount
                && $scope.assetCountLimit
                && $scope.assetIndex !== undefined
                && $scope.assetIndex === ($scope.assetCountLimit - 1)
                && $scope.assetCount !== $scope.assetCountLimit
              ) {

                $element.addClass('has-more');
                $scope.hasMoreAssets = true;
                $scope.moreAssetsCount = $scope.assetCount - $scope.assetCountLimit;
              }

              $element.addClass($scope.fileType);

              $scope.showAsset = ( ! $scope.showOnlyIfImage ) || ( ( $scope.showOnlyIfImage === true ) && $scope.fileType === 'file-image' );

              // if (
              //   ( $scope.setBackgroundStyle === true )
              //   && ( $scope.showOnlyIfImage === true )
              //   && $scope.$asset
              // ) {
              //   $element.css('background-image', 'url(' + $scope.$asset.metaData[$scope.assetSize] + ')');
              // }
              // else {
              //   $element.css('background-image', 'none');
              // }

            }
            $scope.onOcrClick = function() {

              var $canvas = $('<canvas></canvas>');
              $element.append($canvas);

              var canvas = $canvas[0];
              var context = canvas.getContext('2d');
              var img = new Image();
              img.crossOrigin = "Anonymous";
              var reader = new FileReader();
              reader.onload = function(event){
                var img = new Image();
                img.onload = function(){
                  canvas.width = img.width;
                  canvas.height = img.height;
                  context.drawImage(img,0,0);

                  $canvas.remove();
                }
                img.src = event.target.result;
              }
              reader.readAsDataURL($scope.assetFile);


            }
            $scope.onStreamDownload = function() {




              if (
                $scope.$asset.metaData
                && $scope.$asset.metaData.videoUrl
                && $scope.$asset.metaData.videoUrl.indexOf('youtube') !== -1
              ) {

                var uri = URI($scope.$asset.metaData.videoUrl);
                var parts = URI.parseQuery(uri.query());
                window.open('http://www.videograbby.com/#id=' + parts.v, '_blank');
              }

              // $http.jsonp(
              //   'http://www.videograbby.com/#id=Uj1aCSu3Z48',
              //   {
              //     'Content-Type': 'text/html'
              //   }
              // )
              //   .success(function(data, status, headers, config) {
              //   })
              //   .error(function(data, status, headers, config) {
              //   });
              // $.ajax({
              //   crossOrigin: true,
              //   dataType: 'html',
              //   type: 'GET',
              //   url: 'http://www.videograbby.com/#id=Uj1aCSu3Z48',
              //   success: function(data) {
              //   }
              // });
              // var $iframe = $('<iframe src="http://www.videograbby.com/#id=Uj1aCSu3Z48"></iframe>')
              // $element.append($iframe);
              //
              // $iframe[0].onload = function() {
              //
              //   var iframeDocument = $iframe[0].contentDocument || $iframe[0].contentWindow.document;
              //
              //   iframeDocument.domain = 'http://www.videograbby.com';
              //
              //   var iframeContent;
              //
              //   var iframeWindow = $iframe[0].contentWindow;
              //   if (iframeWindow) {
              //     //iframeContent = iframeWindow.$('body');
              //   }
              //
              // }

            };

            this.unwatchAssetSize = $scope.$watch('assetSize', function(){
              $scope.refresh();
            })

            this.unwatchAssetId = $scope.$watch('assetId', function() {

              if ( ! $scope.assetId ) {
                $scope.refresh();
                return false;
              }

              if (
                ( ! $scope.troopId )
                && ( $scope.tpAssetIsAvatar === false )
              ) {
                return false;
              }

              var $oldAsset;
              if ($scope.$asset) {
                $oldAsset = $scope.$asset;
              }

              if ( $scope.tpAssetIsAvatar === true ) {
                $scope.$asset = new AssetFirebaseObject(
                  Ref.child('avatars')
                    .child($scope.tpAssetUserId)
                    .child($scope.assetId)
                );

                $scope.$asset.$loaded()
                .then(function() {

                  if ( $scope.$asset.$value === null ) {

                    $scope.$asset = new AssetFirebaseObject(
                      Ref.child('assets')
                        .child($scope.troopId)
                        .child($scope.assetId)
                    );
                  }
                })
              }
              else {
                $scope.$asset = new AssetFirebaseObject(
                  Ref.child('assets')
                    .child($scope.troopId)
                    .child($scope.assetId)
                );
              }

              $scope.$asset.$loaded().then(function() {

                $scope.assetState = 'complete';
                $scope.refresh();

                that.unwatchAsset = $scope.$asset.$watch(function(event, key, prevChild) {

                  $scope.refresh();
                });
              });

              if ($oldAsset) {
                $oldAsset.$destroy();
              }
            });

            $scope.$on('$destroy', function() {

              if ( that.unwatchAsset ) {

                that.unwatchAsset();
                that.unwatchAsset = null;
              }

              if ( that.unwatchAssetId ) {

                that.unwatchAssetId();
                that.unwatchAssetId = null;
              }

              if ( that.unwatchAssetSize ) {

                that.unwatchAssetSize();
                that.unwatchAssetSize = null;
              }

              if ( $scope.$asset ) {

                $scope.$asset.$destroy();
              }

            });

          }
        ];

        return {
          restrict: 'A',
          scope: {
            troopId: '=tpAssetTroopId',
            assetId: '=tpAsset',
            entry: '=tpEntry',
            assetFile: '=tpAssetFile',
            assetExternalUrl: '=tpAssetExternalUrl',
            assetEmbedlyImage: '=tpAssetEmbedlyImage',
            assetIndex: '=tpAssetIndex',
            assetCount: '=tpAssetCount',
            assetCountLimit: '=tpAssetCountLimit',
            assetInfo: '=tpAssetInfo',
            assetInfoFileSize: '=tpAssetInfoFileSize',
            assetSize: '@tpAssetSize',
            assetProgress: '=tpAssetProgress',
            assetTitle: '=tpAssetTitle',
            displayDocument: '=tpAssetDisplayDocument',
            onThumbnailClick: '&tpAssetThumbnailClick',
            onHasMoreClick: '&tpAssetHasMoreClick',
            onRemoveClick: '&tpAssetRemoveClick',
            tpAssetDownload: '=tpAssetDownload',
            tpAssetShowMenu: '=tpAssetShowMenu',
            tpAssetIconMenu: '=tpAssetIconMenu',
            tpAssetRename: '=tpAssetRename',
            tpAssetRemove: '=tpAssetRemove',
            tpAssetIsAvatar: '=tpAssetIsAvatar',
            tpAssetUserId: '=tpAssetUserId',
            showOnlyIfImage: '=tpAssetImageOnly',
            setBackgroundStyle: '=tpAssetBackground',
            canClick: '=tpAssetCanClick'
          },
          controller: controller,
          templateUrl: '/views/directives/troop/tp-asset.html'
        };
      }
    ]
  );
