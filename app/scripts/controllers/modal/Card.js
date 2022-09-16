/* global _, $, URI */
/* jshint strict: true */
/* jshint -W014 */

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:CardModalCtrl
   * @description
   * # CardModalCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('CardModalCtrl', CardModalCtrl);

  CardModalCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$localStorage',
    '$timeout',
    'Me',
    'CardFactory',
    'AssetFactory',
    'FileFactory',
    'close',
    'embedlyService',
    'Slug',
    'REGEX',
    'MIME_TYPES'
  ];

  function CardModalCtrl(
    $scope,
    $rootScope,
    $localStorage,
    $timeout,
    Me,
    CardFactory,
    AssetFactory,
    FileFactory,
    close,
    embedlyService,
    Slug,
    REGEX,
    MIME_TYPES
  ) {

    var vm = this;
    vm.trackAssets = {};
    vm.assetsToRemove = [];
    vm.assetsToUpdateOrder = {};
    vm.maxOrder = -Infinity;
    vm.alreadyClosing = false;
    vm.cardRef = null;

    vm.Me = Me;
    vm.isSaving = false;
    vm.$storage = $localStorage;
    vm.err = null;
    vm.focus = 'title';
    vm.files = [];
    vm.embedlyImages = [];
    vm.pastedImages = [];
    vm.assets = [];
    vm.showModal = true;
    vm.needTitle = Me.currentRouteState !== 'home.dashboard.board.document';
    vm.content = '';
    vm.fullScreenEditor = false;
    vm.showFindReplace = false;
    vm.textSearch = {
      find: '',
      replace: ''
    };
    vm.card = {
      cardName: '',
      description: '',
      assets: {}
    };
    vm.cardName = vm.card.cardName;

    vm.tagString = '';
    vm.sortableOptions = {
      dropSort: false,
      //dropAdd: false,
      //dropRemove: false,
      dropUpdate: false,
      //dropRevert: true,
      group: 'asset-list',
      draggable: '.asset',
      //filter: ".dropper",
      //exclude: 'dropper',
      // forceFallback: true,
      //handle: '.tag-list-drag-handle',
      //scrollSensitivity: 220,
      onStart: function(evt) {
        $(evt.from).addClass('moving-asset');
      },
      onEnd: function (/**Event*/evt) {
        $(evt.from).removeClass('moving-asset');

        var curAssetModel = evt.models[evt.newIndex];
        var prevAssetModel = evt.models[evt.newIndex - 1];
        var nextAssetModel = evt.models[evt.newIndex + 1];

        if (prevAssetModel && nextAssetModel) {
          //in between
          curAssetModel.order = prevAssetModel.order - ( (prevAssetModel.order - nextAssetModel.order) / 2.0 );
        }
        else if (prevAssetModel) {
          //end
          curAssetModel.order = prevAssetModel.order / 2.0;
        }
        else if (nextAssetModel) {
          //beginning
          curAssetModel.order = nextAssetModel.order + 1;
        }


        vm.maxOrder = Math.max(vm.maxOrder, curAssetModel.order);
      }
    };

    vm.setCard = setCard;
    vm.injectContent = injectContent;
    vm.findReplace = findReplace;
    vm.closeModal = closeModal;
    vm.save = save;
    vm.checkDownload = checkDownload;
    vm.cardNameBlur = cardNameBlur;
    vm.filesAdded = filesAdded;
    vm.assetClass = assetClass;
    vm.removeAsset = removeAsset;
    vm.isImageFileType = isImageFileType;
    vm.isOtherFileType = isOtherFileType;
    vm.fileTypeClass = fileTypeClass;
    vm.setFocus = setFocus;

    $rootScope.$broadcast('new-card-modal-open');

    $scope.$on('onEnterKey', function(event) {

      $timeout(function() {

        vm.save(cardModalForm);

      }, 0 );
    });

    $scope.$on('onEscapeKey', function(event) {
      vm.closeModal();
    })

    return;

    function closeModal() {

      vm.showModal = false;

      $timeout(function() {
        $rootScope.$broadcast('new-card-modal-close');
        close();
      }, 800);

    }

    function save(form) {

      // TODO: validation handling

      if (form.$valid) {

        vm.isSaving = true;

        if ('new' === vm.action) {
          createCard();
        }
        else {
          updateCard();
        }

      }
      else if ( ! vm.card.cardName ) {
        form.cardName.$dirty = true;
        form.cardName.$touched = true;
        form.cardName.$invalid = true;
      }

    }

    function checkDownload(asset) {
      var canIDownload = false;

      var boardRead = Me.currentBoard.readOnly;
      var boardPermission = Me.troopMember.boards[Me.currentBoard.$id].permission;
      var createdBy = (asset.createdByUserId === Me.troopMember.userId);
      if (
        boardRead === false
        || (
          boardPermission === 'admin'
          || createdBy
        )
      ) {
        canIDownload = true;
      }

      return canIDownload;
    }

    function cardNameBlur($event) {

      if ( $event ) {
        $event.stopPropagation();
      }

      checkForUrl(vm.card.cardName);
    }

    function filesAdded($files, $file, $newFiles, $duplicateFiles, $invalidFiles, $event) {

      if (vm.maxOrder === -Infinity) {
        vm.maxOrder = 0;
      }

      _.each($files, function(file) {

        vm.maxOrder += 1;

        var asset = {
          order: vm.maxOrder,
          file: file
        };

        vm.assets.splice(0, 0, asset);

        if ( ! FileFactory.isImageFileType(file.type) ) {

          setAssetStyle(asset);
        }
        else {

          var reader  = new FileReader();
          reader.addEventListener('load', function() {

            $timeout(function() {

              asset.base64 = reader.result;

              setAssetStyle(asset);
            }, 0);

          }, false);

          reader.readAsDataURL(file);
        }


      });

    }

    function assetClass(asset) {
      var classes = '';
      if ( ! asset ) {
        return classes;
      }
      else if (asset.file) {
        classes += ' new-asset';
      }
      else if (asset.image) {
        classes += ' embedly-asset';
      }
      else if (asset.paste) {
        classes += ' pasted-image-asset';
      }

      if (asset.progress !== undefined && asset.progress !== null) {
        classes += ' processing';

        if (asset.progress === 100) {
          classes += ' complete';
        }
      }


      return classes;
    }

    function removeAsset(assetToRemove, $index) {
      if (assetToRemove.assetId) {
        vm.assetsToRemove.push(assetToRemove.assetId);
      }

      vm.assets.splice($index, 1);
    }

    function isImageFileType(asset) {
      var mimeType = asset.mimeType;
      if ( (! mimeType) && asset.file ) {
        mimeType = asset.file.type;
      }
      return FileFactory.isImageFileType(mimeType);
    }

    function isOtherFileType(asset) {
      var mimeType = asset.mimeType;
      if ( (! mimeType) && asset.file ) {
        mimeType = asset.file.type;

        if ( ! mimeType ) {
          var ext = asset.file.name.split('.').pop();
          mimeType = MIME_TYPES[ext];
        }

      }

      return FileFactory.isOtherFileType(mimeType);
    }

    function fileTypeClass(asset) {
      var mimeType = asset.mimeType;
      if ( (! mimeType) && asset.file ) {
        mimeType = asset.file.type;

        if ( ! mimeType ) {
          var ext = asset.file.name.split('.').pop();
          mimeType = MIME_TYPES[ext];
        }

      }

      return FileFactory.fileTypeClass(mimeType);
    }



    function onAssetProcessingComplete() {

      var allDone = true;

      if (!_.isEmpty(vm.trackAssets)) {
        allDone = _.reduce(
          _.values(vm.trackAssets),
          function(combined, nextValue) {
            return combined && nextValue;
          }
        );
      }

      if (allDone) {

        vm.origCard = vm.card;

        vm.isSaving = false;

        vm.closeModal();
      }

    }

    function uploadFile(asset) {

      if (asset && asset.file) {
        var $file = asset.file;

        vm.trackAssets[$file.name] = false;

        var metaData = {};
        var mimeType = $file.type;

        if ( ! mimeType ) {
          var ext = $file.name.split('.').pop();
          mimeType = MIME_TYPES[ext] || MIME_TYPES._default;
        }

        CardFactory.uploadAsset({
          $file: $file,
          troopId: Me.troop.$id,
          cardId: vm.cardRef.key,
          boardId: Me.currentBoard.$id,
          order: asset.order,
          mimeType: mimeType,
          fileName: $file.name,
          metaData: metaData,
          createdByUserId: Me.trooper.$id
        })
        .then(function(resp) {

          asset.assetId = resp.assetRef.key;
          asset.troopId = Me.troop.$id;

          asset.file.state = 'uploading';
          asset.progress = 1;

          resp.uploader.then(
            function(uploaderResp) {
              // upload complete
              asset.file.state = 'complete';
            },
            function(uploaderResp) {
              // error

            },
            function(evt) {
              // upload notify
              //asset.progress = parseInt(100.0 * evt.loaded / evt.total);
            }
          );

          resp.assetRef.child('/upload/state').on('value', function(snap) {

            if ( snap.exists() ) {

              var state = snap.val();

              if (
                state
                && 'finished' === state
              ) {
                vm.trackAssets[$file.name] = true;
                onAssetProcessingComplete();
              }
            }
          });
        });



      }
    }

    function addEmbedlyImage(asset) {

      if (asset && asset.image) {
        var image = asset.image;

        var filename = URI(image.url).filename();

        if (filename) {
          var ext = filename.split('.').pop();
          var metaData = {};

          vm.trackAssets[image.url] = false;

          if (image.videoIframe) {
            metaData.videoIframe = image.videoIframe;
          }

          if (
            image.metaData
            && image.metaData.video
          ) {

            if ( image.metaData.video.duration ) {
              metaData.videoDuration = image.metaData.video.duration;
            }

            if ( image.metaData.video.title ) {

              filename = Slug.slugify(image.metaData.video.title) +  '.embed';

              // if ( image.metaData.video.url.indexOf('//vimeo.com') === -1 ) {
              //   filename = $.trim(image.metaData.video.title) + '.vimeo';
              // }
              //
              // if ( image.metaData.video.url.indexOf('//youtube.com') === -1 ) {
              //   filename = $.trim(image.metaData.video.title) + '.youtube';
              // }

            }
          }


          if (image.videoUrl) {
            metaData.videoUrl = image.videoUrl;
          }

          if (image.height) {
            metaData.height = image.height;
          }

          if (image.width) {
            metaData.width = image.width;
          }

          CardFactory.uploadAssetFromUrl({
            url: image.url,
            fileName: filename,
            troopId: Me.troop.$id,
            cardId: vm.cardRef.key,
            boardId: Me.currentBoard.$id,
            order: asset.order,
            mimeType: MIME_TYPES[ext] || null,
            metaData: metaData || null,
            createdByUserId: Me.trooper.$id,
            originalUrl: image.url,
            storageSize: image.size,
            uid: Me.firebaseUser.uid,
            token: Me.firebaseUser.token
          })
          .then(function(assetRef) {

            asset.image = null;
            asset.assetId = assetRef.key;

            asset.progress = 0;

            assetRef.on('value', function(snap) {

              var assetSnap = snap.val();

              if (
                ! vm.trackAssets[image.url]
                && assetSnap.upload
                && 'finished' === assetSnap.upload.state
              ) {

                vm.trackAssets[image.url] = true;
                onAssetProcessingComplete();
              }
            });
          });
        }
      }
    }

    function addAssets() {

      _.each(vm.assets, function(asset) {

        if (asset.file) {
          uploadFile(asset);
        }
        else if (asset.image) {
          addEmbedlyImage(asset);
        }
        else if (asset.paste) {
          // will re-implement when we add rich text again
        }

      });

      onAssetProcessingComplete();

    }

    function removeAssets() {

      if (vm.assetsToRemove.length > 0) {

        _.each(vm.assetsToRemove, function(assetId) {

          vm.trackAssets[assetId] = false;

          AssetFactory.delete({
            assetId: assetId,
            cardId: vm.card.$id,
            troopId: vm.card.troopId
          })
          .then(function() {

            vm.trackAssets[assetId] = true;

            onAssetProcessingComplete();

          })
          .catch(function(error) {

            console.log(error);
          });

        });

      }

    }

    function createCard() {

      var order = 1;

      if (Me.currentBoardCards.length > 0) {

        order = Me.currentBoardCards[0].order + 1;
      }

      CardFactory.create({
        board: Me.currentBoard,
        troopId: Me.troop.$id,
        order: order,
        cardName: vm.card.cardName,
        description: vm.card.description,
        tagString: vm.tagString,
        createdByMemberId: Me.troopMember.$id
      })
      .then(function(cardRef) {
        vm.cardRef = cardRef;
        addAssets();
      })
      .catch(function(error) {
        console.log(error);
      });
    }

    function updateCard() {
      _.each(vm.assets, function(asset) {
        if (asset.assetId) {
          vm.card.assets[asset.assetId] = asset.order;
        }

      });

      CardFactory.update({
        board: Me.currentBoard,
        card: vm.card,
        tagString: vm.tagString
      })
      .then(function(cardRef) {
        vm.cardRef = cardRef;

        addAssets();
        removeAssets();
      })
      .catch(function(error) {

        console.log(error);
      });

    }

    function setAssetStyle(asset) {

      var imageUrl;
      var mimeType;

      if ( asset.file ) {

        mimeType = asset.file.type;

      }
      else {

        mimeType = asset.mimeType;
      }

      if ( FileFactory.isImageFileType(mimeType) ) {

        if ( asset.file ) {

          imageUrl = asset.base64;
        }
        else {

          // Tomas wrote:
          // this is no the cleanest way how to deal with the unfinished
          // or otherwise damaged uploads but it will give a user a way to remove it.

          imageUrl = ( asset.metaData ) ? asset.metaData.mediumUrl : null;
        }
      }
      else if ( asset.image ) {

        imageUrl = asset.image.url;
      }
      else {

        var fileType = FileFactory.fileTypeClass(mimeType);

        imageUrl = '/images/svg/icons/' + fileType + '.svg';
      }

      asset.style = {
        'background-image': 'url(' + imageUrl + ')'
      };

    }

    function setCard(card) {

      vm.origCard = card;

      angular.copy(card, vm.card);

      vm.tagString = CardFactory.generateTagString(card);

      if (card.orderedAssets) {

        var order = 2;
        if (card.orderedAssets.length > 0) {

          var firstAssetId = card.orderedAssets[0];

          if (card.assets[firstAssetId] !== true) {
            order = card.assets[firstAssetId];
          }
          else {
            order = card.orderedAssets.length;
          }

        }

        _.each(card.orderedAssets, function(assetId) {

          var existingAsset = Me.currentBoardAssets.$getRecord(assetId);

          var asset;

          if (card.assets[assetId] === true) {

            asset = {
              assetId: assetId,
              order: order,
              mimeType: existingAsset.mimeType,
              originalUrl: existingAsset.originalUrl,
              metaData: existingAsset.metaData
            };

            setAssetStyle(asset);

            vm.assetsToUpdateOrder[assetId] = order;

            order -= 1;
          }
          else {

            asset = {
              assetId: assetId,
              order: card.assets[assetId],
              mimeType: existingAsset.mimeType,
              createdBy: card.createdByMemberId,
              originalUrl: existingAsset.originalUrl,
              metaData: existingAsset.metaData
            };

            setAssetStyle(asset);
          }

          vm.maxOrder = Math.max(vm.maxOrder, asset.order);

          vm.assets.push(asset);
        });

      }
    }

    function setFocus(focus) {

      vm.focus = focus;

    }

    function checkForUrl(url) {

      if (
        ( ! vm.isLoadingFromEmbedly )
        && url
        && url.match(REGEX.url)
      ) {

        vm.isLoadingFromEmbedly = true;

        embedlyService.extract(url)
        .then(function success(dataObj) {

          var tags = {
            source: dataObj.data.url.replace('#', '%23')
          };

          if (dataObj.data.media && dataObj.data.media.type === 'video') {

            if ( ! dataObj.data.images[0].metaData ) {
              dataObj.data.images[0].metaData = {};
            }

            if ( ! dataObj.data.images[0].metaData.video ) {
              dataObj.data.images[0].metaData.video = {};
            }

            dataObj.data.images[0].metaData.video.height = dataObj.data.media.height;
            dataObj.data.images[0].metaData.video.width = dataObj.data.media.width;
            dataObj.data.images[0].metaData.video.duration = dataObj.data.media.duration;
            dataObj.data.images[0].metaData.video.iframe = dataObj.data.media.html;
            dataObj.data.images[0].metaData.video.url = dataObj.data.media.url;
            dataObj.data.images[0].metaData.video.title = dataObj.data.title;
            dataObj.data.images[0].videoIframe = dataObj.data.media.html;
            dataObj.data.images[0].videoUrl = dataObj.data.url;
          }

          vm.card.cardName = dataObj.data.title;
          vm.content = dataObj.data.content;
          // console.log(toMarkdown(vm.content, { gfm: true }));
          //var description = dataObj.data.content || dataObj.data.description;
          // strip out <img> tags
          //vm.card.description = description.replace(/<img[^>]+\>/gi, '');

          if (Me.isjhExperience) {

            if ($.trim(vm.card.description)) {
              vm.card.description += "\n\n" +
                (dataObj.data.title || '') + "\n" +
                dataObj.data.url + "\n\n" +
                (dataObj.data.description || '');
            }
            else {
              vm.card.description = (dataObj.data.title || '') + "\n" +
                dataObj.data.url + "\n\n" +
                (dataObj.data.description || '');
            }

          }
          else {

            if ($.trim(vm.card.description)) {
              vm.card.description += "\n\n\n" +
                (dataObj.data.description || '') + "\n\n" +
                dataObj.data.url;
            }
            else {
              vm.card.description = (dataObj.data.description || '') + "\n\n" +
                dataObj.data.url;
            }

          }

          /*
          vm.tagString = CardFactory.generateTagString({
            tags: tags
          });
          */

          if (vm.maxOrder === -Infinity) {
            vm.maxOrder = 0;
          }

          _.each(dataObj.data.images, function(image) {

            if (
              dataObj.data.url.indexOf('//vimeo.com') === -1
              || (
                dataObj.data.url.indexOf('//vimeo.com') !== -1
                && image.videoUrl
              )
            ) {

              var asset = {
                order: vm.maxOrder,
                image: image
              };

              if (
                image.metaData
                && image.metaData.video
                && image.metaData.video.duration
              ) {
                image.formattedVideoDuration = AssetFactory.formatDuration(image.metaData.video.duration);
              }

              vm.maxOrder += 1;
              vm.assets.splice(0, 0, asset);


              setAssetStyle(asset);
            }
          });

          $timeout(function() {
            vm.isLoadingFromEmbedly = false;
          }, 400);

        });
      }
    }

    function injectContent() {

      if ( vm.content ) {
        vm.card.description += '\n' + toMarkdown(vm.content, { gfm: true });

        vm.content = '';
      }


    }

    function findReplace($event) {

      $event.preventDefault();

      var find = new RegExp(vm.textSearch.find, 'g');

      vm.card.description = vm.card.description.replace(find, vm.textSearch.replace);
    }


  }

})();
