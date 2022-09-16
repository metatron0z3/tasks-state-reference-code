/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:CardGridCtrl
 * @description
 * # CardGridCtrl
 * Controller of the webClientApp
 */
  angular
  .module('webClientApp')
  .controller('CardGridCtrl', CardGridCtrl);

  CardGridCtrl.$inject = [
    '$q',
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$sessionStorage',
    '$timeout',
    '$filter',
    'Auth',
    'Ref',
    'Me',
    'Nav',
    'BoardFactory',
    'CardFactory',
    'FileFactory',
    'ModalService',
    'AssetFirebaseObject',
    'UAParser',
    'TroopLogger',
    'MIME_TYPES'
  ];

  return;

  function CardGridCtrl(
    $q,
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $sessionStorage,
    $timeout,
    $filter,
    Auth,
    Ref,
    Me,
    Nav,
    BoardFactory,
    CardFactory,
    FileFactory,
    ModalService,
    AssetFirebaseObject,
    UAParser,
    TroopLogger,
    MIME_TYPES
  ) {
    var logConfig = {
      slug: 'controller: CardGridCtrl - ',
      path: [ 'controllers', 'dashboard', 'board', 'Grid.js']
    };

    var mobile = ('iOS' === UAParser.os.name) || ('Android' === UAParser.os.name);

    var that = this;

    $scope.loading = true;
    $scope.isModalShowing = false;
    $scope.hasImageAssets = false;
    $scope.gridList = {
      "cards": [],
      "assets": {},
      "firstUrl": {}
    }
    $scope.hoverTitle = false;
    $scope.dragDisabled = false;
    this.orderGrid = function() {
      $scope.gridList.cards = Me.currentBoardCards;

      _.each($scope.gridList.cards, function(card) {
        card.numImages = 0;
        card.imageAssets = [];

        if (card.orderedAssets) {

          that.getFirstUrl(card)
          card.imageAssets = angular.copy(card.orderedAssets);
          card.fileAssets = angular.copy(card.orderedAssets);
          card.numImages = card.numFiles = card.orderedAssets.length;
          _.each(card.orderedAssets, function(asset, index) {
            var assetId = asset;

            var imageFile = true;
            var nonImage = false;
            that.checkFileType(card.troopId, assetId);
            if ( ! that.checkFileType(card.troopId, assetId)) {
              card.numImages--;
              imageFile = false;
              card.imageAssets.splice(index, 1)
            }
            else {
              card.numFiles--;
              nonImage = false;
              card.fileAssets.splice(index, 1)
            }


            if (card.numImages > 1 && imageFile) {


              var duration = card.numImages * 0.6;
              var delay = index * 0.6;

              $scope.gridList.assets[assetId] = {
                  '-webkit-animation': 'showMe ' + duration +'s linear infinite ' + delay + 's forwards',
                  '-moz-animation': 'showMe ' + duration +'s linear infinite ' + delay + 's forwards',
                  '-o-animation': 'showMe ' + duration +'s linear infinite ' + delay + 's forwards',
                  '-ms-animation': 'showMe ' + duration +'s linear infinite ' + delay + 's forwards',
                  'animation': 'showMe ' + duration +'s linear infinite ' + delay + 's forwards',
                  'z-index': ((card.numImages - index) + 1)
                }
            }
            else {
              $scope.gridList.assets[assetId] = {}
            }
          })
        }
        if (card.numImages > 0) {
          $scope.hasImageAssets = true;
        }
        if (card.numFiles > 0) {
          $scope.onlyFiles = true;
        }
      })

    }
    this.checkFileType = function(troopId, assetId) {

      var check = false;
      if (assetId) {

        var asset = Me.currentBoardAssets.$getRecord(assetId);

        var mimeType = asset.mimeType;

        if ( ! mimeType && asset.fileName ) {
          var ext = asset.fileName.split('.').pop();
          mimeType = MIME_TYPES[ext];
        }

        if (FileFactory.isImageFileType(mimeType)) {
          check = true;
        }
        else {
          check = false;
        }

        return check;
      }
    }
    this.getFirstUrl = function(card) {
      var url = Me.currentBoardAssets.$getRecord(card.orderedAssets[0]);
      if (url && url.metaData){
        if (url.metaData.largeUrl) {
          $scope.gridList.firstUrl[card.$id] = {
            'background-image': 'url(' + url.metaData.largeUrl + ')'
          }
        }
        else {
          $scope.gridList.firstUrl[card.$id] = {
            'background-color': 'rgba(216,224,230,0.4)'
          }
        }

      }
    }
    this.maxOrder = -Infinity;
    $scope.assets = [];
    this.trackAssets = {};
    $scope.dragDisabled = false;
    this.reOrderStuff = function() {
      if (that.isReOrdering) {
        return false;
      }

      that.isReOrdering = true;

      Me.currentBoardCards.orderCardTags(Me.currentBoard.tagNames);
      that.setCards();

      that.isReOrdering = false;
    }

    this.setCards = function() {
      $scope.gridList.cards = [];

      if ( _.isEmpty($sessionStorage.currentBoardTags) ) {

        $scope.gridList.cards = Me.currentBoardCards;
      }
      else {

        var allTag = _.findWhere(
          $sessionStorage.currentBoardTags,
          {
            name: 'tp-all'
          }
        );

        if (allTag.selected) {

          $scope.gridList.cards = Me.currentBoardCards;
        }
        else {

          // get list of selected tag names
          var selectedTagNames = [];
          _.each($sessionStorage.currentBoardTags, function(tag) {
            if (tag.selected) {
              selectedTagNames.push(tag.name);
            }
          });

          if (selectedTagNames.length === 0) {

            allTag.selected = true;
            selectedTagNames.push('tp-all');
            $scope.gridList.cards = Me.currentBoardCards;
            return false;
          }

          _.each(Me.currentBoardCards, function(card) {

            var isEmtpy = _.isEmpty(card.tags);
            if (
              ! isEmtpy
              && $scope.gridList.cards.indexOf(card) === -1
            ) {
              // see if card has a selected tag
              _.each($sessionStorage.currentBoardTags, function(tag) {

                if (
                  tag.selected
                  && 'tp-all' !== tag.name
                  && card.tags.hasOwnProperty(tag.name)
                ) {
                  // show cards matching selected tags
                  $scope.gridList.cards.push(card);
                  return false;

                }
              });
            }
          });
        }
      }

    }

    this.startWatching = function() {

      Me.currentBoardCards.$watch(function(data) {

        that.orderGrid();

      });

    };

    this.resizeGrid = function() {


    }

    this.updateCardOrder = function(data) {

      TroopLogger.debug(logConfig, 'updateCardOrder()');
      if (data.prevCardObj && data.nextCardObj) {

        TroopLogger.debug(logConfig, 'first if condition');

        //dropped in between
        if (data.prevCardObj.order === data.nextCardObj.order) {

          //set to same order as prev and next
          data.nextCardObj.order = data.prevCardObj.order;
        }
        else if (
          data.cardObj.order >= data.prevCardObj.order
          || data.cardObj.order <= data.nextCardObj.order
        ) {

          //set order below prevCard order
          var orderDiff = data.prevCardObj.order - data.nextCardObj.order;

          if ( orderDiff > 1 ) {
            data.cardObj.order = data.prevCardObj.order - 1;
          }
          else {
            data.cardObj.order = data.prevCardObj.order - (orderDiff / 2.0);
          }
        }
        else {
          //order should already be in between
        }

      }
      else if (
        data.prevCardObj
        && ( data.cardObj.order > data.prevCardObj.order )
      ) {

        TroopLogger.debug(logConfig, 'second if condition');

        //dropped on bottom
        if (data.prevCardObj.order > 1) {
          data.cardObj.order = data.prevCardObj.order - 1;
        }
        else {
          data.cardObj.order = data.prevCardObj.order / 2.0;
        }
      }
      else if (
        data.nextCardObj
        && ( data.cardObj.order <= data.nextCardObj.order )
      ) {

        TroopLogger.debug(logConfig, 'third if condition');

        //dropped on top
        data.cardObj.order = data.nextCardObj.order + 1;
      }
      else {

        TroopLogger.debug(logConfig, 'last empty else from updateCardOrder()');
        //no change to order needed
      }
    };

    this.saveCard = function(data) {

      TroopLogger.debug(logConfig, 'data passed into saveCard()', $.extend({}, data));
      TroopLogger.debug(logConfig, 'saveCard()');

      //that.grapListScrollTops();

      Me.currentBoardCards.$save(data.cardObj).then(function() {
        // $timeout(function() {
        //
        //   that.resizeGrid();
        // }, 500);

      });


    }

    $scope.checkDownload = function(card) {
      var canIDownload = false;

      var boardRead = false;
      var boardPermission = 'admin'
      var createdBy = true;

      if (
        Me.currentBoard
        && Me.troopMember
        && Me.troopMember.boards
        && Me.troopMember.boards[Me.currentBoard.$id]
      ) {
        boardRead = Me.currentBoard.readOnly;
        boardPermission = Me.troopMember.boards[Me.currentBoard.$id].permission;
        createdBy = (card.createdByMemberId === Me.troopMember.$id);
      }

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

    $scope.showCardModal = function(action, card) {

      if ( Me.modalIsOn ) {

        return;
      }

      if ( ! $scope.isModalShowing ) {

        $scope.isModalShowing = true;

        ModalService.showModal({
          templateUrl: '/views/modal/card.html',
          controller: 'CardModalCtrl as vm'
        })
        .then(function(modal) {

          $scope.isModalShowing = false;

          if ( card ) {
            modal.controller.setCard(card);
          }
          modal.controller.action = action;



        });
      }

    };

    $scope.showDeleteCardModal = function(card) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      }).then(function(modal) {

        modal.controller.extraClasses = 'archive-card-modal'
        modal.controller.header = 'Delete Card';
        modal.controller.message =
          'Are you sure you want to delete the "<b>'
          + card.cardName
          + '</b>" card?';
        modal.controller.actionTaken = ' Delete ';
        modal.controller.element = ' Card';


        modal.controller.cancel = function() {
          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          CardFactory.archive(card, function() {

          }).then(function() {
            modal.controller.closeModal();
          })
        };


        //modal.controller.closeModal();

      });
    };

    $scope.goToDetail = function($event, card) {
      var target = angular.element($event.target)
      if (! target.hasClass('dotdotdot') && ! target.hasClass('label') && ! target.hasClass('delete')) {
        Nav.toBoardCard(
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          Me.currentBoard.$id,
          card.$id
        );
      }

      //
      // $state.go('home.dashboard.board.card', {
      //   boardId: Me.currentBoard.$id,
      //   cardId: card.$id
      // });

      //Me.multiCardScrollY = $('[data-ui-view=dashboardContent] > ul').scrollTop();
    }



    $scope.filesAdded = function($files, $file, $event) {
      $("body > .wrapper > main > section > main > .empty-board > .drag-overlay ").removeClass("drag-animate");
      $("body > .wrapper > main > section > main > .drop-wrapper > .drag-overlay ").removeClass("drag-animate");

      if (that.maxOrder === -Infinity) {
        that.maxOrder = 0;
      }

      _.each($files, function(file) {

        that.maxOrder += 1;

        var asset = {
          order: that.maxOrder,
          file: file
        };

        $scope.assets.splice(0, 0, asset);

        if ( ! FileFactory.isImageFileType(file.type) ) {

          that.setAssetStyle(asset);
        }
        else {

          var reader  = new FileReader();
          reader.addEventListener('load', function() {

            $timeout(function() {

              asset.base64 = reader.result;

              that.setAssetStyle(asset);
            }, 0);

          }, false);

          reader.readAsDataURL(file);
        }
        that.createCard(asset);

      });



    };

    this.setAssetStyle = function(asset) {

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

          imageUrl = asset.metaData.mediumUrl;
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

    };

    this.createCard = function(asset) {

      var order = 1;

      if (Me.currentBoardCards.length > 0) {
        order = Me.currentBoardCards[0].order + 1;
      }

      CardFactory.create({
        board: Me.currentBoard,
        troopId: Me.troop.$id,
        order: order,
        cardName: asset.file.name,
        description: '',
        tagString: '',
        createdByMemberId: Me.troopMember.$id
      })
      .then(function(cardRef) {
        that.cardRef = cardRef;
        that.addAsset(asset);
      })
      .catch(function(error) {
        console.log(error);
      });
    };

    this.addAsset = function(asset) {
      that.uploadFile(asset);

      that.onAssetProcessingComplete();

    };

    this.onAssetProcessingComplete = function() {

      var allDone = true;

      if (!_.isEmpty(that.trackAssets)) {
        allDone = _.reduce(
          _.values(that.trackAssets),
          function(combined, nextValue) {
            return combined && nextValue;
          }
        );
      }

      if (allDone) {

        that.origCard = $scope.card;

        $scope.isSaving = false;

      }

    };

    this.uploadFile = function(asset) {

      if (asset && asset.file) {
        var $file = asset.file;

        that.trackAssets[$file.name] = false;

        var metaData = {};
        var mimeType = $file.type;

        if ( ! mimeType ) {
          var ext = $file.name.split('.').pop();
          mimeType = MIME_TYPES[ext] || MIME_TYPES['_default'];
        }
        CardFactory.uploadAsset({
          $file: $file,
          troopId: Me.troop.$id,
          cardId: that.cardRef.key,
          boardId: Me.currentBoard.$id,
          order: 0,
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
                that.trackAssets[$file.name] = true;
                that.onAssetProcessingComplete();
              }
            }
          });
        });



      }
    };

    $scope.emptyDrag = function($isDragging, $class, $event) {


       $("body > .wrapper > main > section > main > .empty-board > .drag-overlay > .background-box ").on("dragover", function() {
         $("body > .wrapper > main > section > main > .empty-board > .drag-overlay ").addClass("drag-animate");
       })
       $("body > .wrapper > main > section > main > .empty-board > .drag-overlay > .background-box ").on("dragleave", function() {
         $("body > .wrapper > main > section > main > .empty-board > .drag-overlay ").removeClass("drag-animate");
       })

    }

    $scope.drag = function($isDragging, $class, $event) {

       $("body > .wrapper > main > section > main > .drop-wrapper > .drag-overlay > .background-box ").on("dragover", function() {
         $("body > .wrapper > main > section > main > .drop-wrapper > .drag-overlay ").addClass("drag-animate");
       })
       $("body > .wrapper > main > section > main > .drop-wrapper > .drag-overlay > .background-box ").on("dragleave", function() {
         $("body > .wrapper > main > section > main > .drop-wrapper > .drag-overlay ").removeClass("drag-animate");
       })

    }

    var disabled = false;

    if (
      Me.troopMember.hasOwnProperty('boards')
      && Me.troopMember.boards.hasOwnProperty(Me.currentBoard.$id)
      && Me.troopMember.boards[Me.currentBoard.$id].permission !== 'admin'
    ) {
      disabled = true;
    }

    $scope.sortableOptions = {
      disabled: disabled,
      dropSort: false,
      dropAdd: false,
      dropRemove: false,
      // dropUpdate: false,
      dropRevert: true,
      group: 'card-list',
      draggable: '.square',
      scrollSensitivity: 50,
      scrollSpeed: 20,
      delay: mobile ? 100 : 0,
      onStart: function(evt) {
        $scope.dragDisabled = true;
      },
      onEnd: function (/**Event*/evt) {
        $(evt.from).removeClass('moving-card')
        var cardId = evt.item.getAttribute('data-card-id');
        var cardObj = Me.currentBoardCards.$getRecord(cardId);
        var prevCardIndex = evt.newIndex - 1;
        var nextCardIndex = evt.newIndex + 1;

        var prevCardObj = evt.models[evt.newIndex - 1];
        var nextCardObj = evt.models[evt.newIndex + 1];

        if (prevCardObj && nextCardObj) {
          //in between
          cardObj.order = prevCardObj.order - ( (prevCardObj.order - nextCardObj.order) / 2.0 );
        }
        else if (prevCardObj) {
          //end
          cardObj.order = prevCardObj.order / 2.0;
        }
        else if (nextCardObj) {
          //beginning
          cardObj.order = nextCardObj.order + 1;
        }

        var data = {
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex,
          fromEl: evt.from,
          toEl: evt.to,
          itemEl: evt.item,
          cardId: cardId,
          cardObj: cardObj,
          prevCardIndex: prevCardIndex,
          prevCardObj: prevCardObj,
          nextCardIndex: nextCardIndex,
          nextCardObj: nextCardObj

        };

        TroopLogger.debug(logConfig, 'movedWithinOtherCardsList()' + data);

        that.updateCardOrder(data);

        that.saveCard(data);
        $scope.dragDisabled = false;
      }
    };

    $scope.$on('$destroy', function() {
      //TODO: clean up stuff
    });


    $scope.$on('tag-filter-apply', function() {
      that.reOrderStuff();
    });

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {

      $scope.loading = true;
    });

    $rootScope.$broadcast('grid-view-loaded');

    Auth.$loaded().then(function() {
      TroopLogger.debug(logConfig, 'Auth.$loaded()');

      return Me.$doneRedirecting();
    })
    .catch(function(error) {

      TroopLogger.debug(logConfig, error);

      if ( error && error.code ) {

        switch (error.code) {

          case 'SIGNING_IN':
            // continue loading if signing in
            return this;

          default:
            TroopLogger.debug(logConfig, error);
            break;
        }
      }
      else {
        TroopLogger.debug(logConfig, error);
      }

      // otherwise skip loading
      return $q.reject(error);
    })
    .then(function doneTryingToLoadTroop() {
      TroopLogger.debug(logConfig, 'doneTryingToLoadTroop()');

      return Me.$doneTryingToLoadTroop();
    })
    .then(function trooperLoaded() {
      TroopLogger.debug(logConfig, 'doneTryingToLoadTroop()');

      return Me.trooper.$loaded();
    })
    .then(function doneTryingToLoadTroopMember() {
      TroopLogger.debug(logConfig, 'doneTryingToLoadTroopMember()');

      return Me.$doneTryingToLoadTroopMember();
    })
    .then(function troopMemberLoaded() {
      TroopLogger.debug(logConfig, 'troopMemberLoaded()');

      return Me.troopMember.$loaded();
    })
    .then(function doneTryingToLoadTroop() {
      TroopLogger.debug(logConfig, 'doneTryingToLoadTroop()');

      return Me.$doneTryingToLoadTroop();
    })
    .then(function troopLoaded() {
      TroopLogger.debug(logConfig, 'troopLoaded()');

      return Me.troop.$loaded();
    })
    .then(function doneTryingToLoadBoard() {
      TroopLogger.debug(logConfig, 'doneTryingToLoadBoard()');

      if ( ( ! Me.currentBoard ) || Me.currentBoard.$id !==  $stateParams.boardId ) {

        Me.loadBoard(Me.troop.$id, $stateParams.boardId);
      }

      return Me.$doneTryingToLoadBoard();
    })
    .then(function currentBoardLoaded() {
      TroopLogger.debug(logConfig, 'currentBoardLoaded()');

      return Me.currentBoard.$loaded();
    })
    .then(function() {

      return Me.currentBoardCards.$loaded();
    })
    .then(function() {

      return Me.currentBoardAssets.$loaded();
    })
    .then(function() {

      that.orderGrid();
      that.startWatching();
      $scope.loading = false;
      if ( Me.troopMember.troopPermission !== 'guest'
         && ( ( ! Me.currentBoard.readOnly )
         || ( Me.troopMember.boards[Me.currentBoard.$id].permission === 'admin' ) ) )
         {
           $scope.dragDisabled = false;
         }

      else
        {
          $scope.dragDisabled = true;
        }
    });

  }

})();
