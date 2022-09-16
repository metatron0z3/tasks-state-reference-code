(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:MultiCardCtrl
   * @description
   * # MultiCardCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('MultiCardCtrl',MultiCardCtrl);

  MultiCardCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$timeout',
    '$localStorage',
    '$sessionStorage',
    'SecurityFactory',
    '$q',
    'Auth',
    'Ref',
    'Me',
    'Nav',
    'TroopApi',
    'BoardFactory',
    'CardFactory',
    'FileFactory',
    'ModalService',
    'TroopLogger',
    'HELP_TROOP_ID'
  ];

  return;

  function MultiCardCtrl(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $timeout,
    $localStorage,
    $sessionStorage,
    SecurityFactory,
    $q,
    Auth,
    Ref,
    Me,
    Nav,
    TroopApi,
    BoardFactory,
    CardFactory,
    FileFactory,
    ModalService,
    TroopLogger,
    HELP_TROOP_ID
  ) {

    var logConfig = {
      slug: 'controller: MultiCardCtrl - ',
      path: [ 'controllers', 'dashboard', 'board', 'MultiCard.js']
    };

    var that = this;
    var vm = this;

    vm.startTour = false;
    vm.hasTour = false;
    vm.isDragging = true;

    this.trackAssets = {};

    this.isReOrdering = false;
    this.unwatchCurrentBoardCards = function() {};

    $scope.loading = true;
    $scope.Me = Me;
    $scope.assetCountLimit = 7;
    $scope.noteCountLimit;
    $scope.cardCount = null;
    $scope.cardLists = null;
    $scope.cardListsMap = null;
    $scope.cardsWithSelectedTag = true;
    $scope.isCardDisplayed = {};
    $scope.cardMenus = {};
    $scope.assets = [];
    $scope.isModalShowing = false;
    $scope.canDisplayMembers = false;
    $scope.selectedTagName = $stateParams.selectedTagName || 'tp-all';
    $scope.dragDisabled = false;
    $scope.notes = {
      list: [],
      orderedList: []
    };
    $scope.noteMenus = {};
    $scope.newNote = {};
    this.refreshNoteMenus = function(card,event) {

      _.each(card.detailNotes.list, function(note) {
        if (note !== null) {
          $scope.noteMenus[note.$id] = false;
        }
      });
    };


    this.refreshCardMenus = function(event) {

      _.each(Me.currentBoardCards, function(card) {
        $scope.cardMenus[card.$id] = false;
      });

    };


    this.reOrderStuff = function() {

      if (that.isReOrdering) {
        return false;
      }

      that.isReOrdering = true;




      Me.currentBoardCards.orderCardTags(Me.currentBoard.tagNames);
      that.setCards();

      // this is not currently triggering and it should stay that way.
      // if (Me.multiCardScrollY) {
      //   $timeout(function() {
      //     $('[data-ui-view=dashboardContent] > ul').scrollTop(Me.multiCardScrollY);
      //     Me.multiCardScrollY = null;
      //   }, 100, false);
      //
      // }

      that.isReOrdering = false;
    };
    this.setCardLists = function(tagNames) {

      if (that.isSettingCardList) {
        // debounce hack
        return false;
      }

      that.isSettingCardList = true;
      $scope.cardCount = Me.currentBoardCards.length;

      if (!tagNames) {
        tagNames = Me.currentBoard.tagNames;
      }

      var newTagNames = {};
      var start = _.keys(tagNames).length;

      _.each(tagNames, function(value, tag) {
        if ( ! isNaN(value) ) {
          newTagNames[tag] = {
            order: start,
            count: value
          };

          start -= 1;
        }
        else {
          newTagNames[tag] = value;
        }

      });

      Me.currentBoard.tagNames = newTagNames;
      Me.currentBoard.orderedTagNames = _.sortBy(newTagNames, 'order').reverse();

      var cards = _.sortBy(Me.currentBoardCards, 'order').reverse();
      var untaggedCards = _.filter(cards, function(card) {
        return _.isEmpty(card.tags);
      });
      $scope.cardLists = [];
      $scope.cardListsMap = {};

      if (untaggedCards.length > 0) {
        $scope.cardListsMap['untagged'] = {
          order: Infinity,
          name: 'untagged',
          title: 'Untagged',
          count: untaggedCards.length,
          cards: untaggedCards
        };
        $scope.cardLists.push($scope.cardListsMap['untagged']);
      }


      _.each(newTagNames, function(tag, tagName) {
        var tagCards = _.filter(cards, function(card) {
          return card.tags && card.tags.hasOwnProperty(tagName);
        });
        $scope.cardListsMap[tagName] = {
          name: tagName,
          title: '#' + tagName,
          order: tag.order,
          color: tag.color,
          count: tagCards.length,
          cards: tagCards
        };
        $scope.cardLists.push($scope.cardListsMap[tagName]);
      });

      $scope.cards = [];
      $scope.cardLists = _.sortBy($scope.cardLists, 'order').reverse();

      _.each($scope.cardLists, function(cardList) {

        _.each(cardList.cards, function(card) {

          if ($scope.cards.indexOf(card) === -1) {

            $scope.cards.push(card);
          }
        });
      });

      TroopLogger.debug(logConfig, '$scope.cards[]: ', $.extend({}, $scope.cards));

      $timeout(function() {
        that.isSettingCardList = false;
      }, 500);
    };
    this.orderNotes = function(card) {
      TroopLogger.debug(logConfig ,card.detailNotes);

      card.detailNotes.orderedList = _.sortBy(card.detailNotes.list, function(note, noteId) {

        note.$id = noteId;
        note.troopId = Me.troop.$id;
        note.cardId = $scope.card.$id;
        $scope.noteMenus[note.$id] = false;
        return note.createdAt;
      });

    };
    this.setCards = function() {
      $scope.cards = Me.currentBoardCards;

      if ($scope.selectedTagName !== 'tp-all') {


        $scope.cardsWithSelectedTag = _.some($scope.cards, function(card, index, array) {
          return card.tags &&
          card.tags.hasOwnProperty( $scope.selectedTagName )
        })
      }
      else {
        $scope.cardsWithSelectedTag = true;
      }


      _.each($scope.cards, function(card) {
        card.detailNotes = {
          list: [],
          orderedList: []
        };
        // $scope.newNote[card.$id] = {
        //   show: false,
        //   value: null
        // }
        card.detailNotes.list = CardFactory.getNotes({
          troopId: Me.troop.$id,
          cardId: card.$id
        });


        card.detailNotes.list.$loaded().then(function() {

          card.detailNotes.list = card.detailNotes.list.reverse();
          that.refreshNoteMenus(card);
        });
      });


      // $scope.cards = [];

      // if ( _.isEmpty($sessionStorage.currentBoardTags) ) {
      //
      //   $scope.cards = Me.currentBoardCards;
      // }
      // else {
      //
      //   var allTag = _.findWhere(
      //     $sessionStorage.currentBoardTags,
      //     {
      //       name: 'tp-all'
      //     }
      //   );
      //
      //   if (allTag.selected) {
      //
      //     $scope.cards = Me.currentBoardCards;
      //   }
      //   else {
      //
      //     // get list of selected tag names
      //     var selectedTagNames = [];
      //     _.each($sessionStorage.currentBoardTags, function(tag) {
      //       if (tag.selected) {
      //         selectedTagNames.push(tag.name);
      //       }
      //     });
      //
      //     if (selectedTagNames.length === 0) {
      //
      //       allTag.selected = true;
      //       selectedTagNames.push('tp-all');
      //       $scope.cards = Me.currentBoardCards;
      //       return false;
      //     }
      //
      //     _.each(Me.currentBoardCards, function(card) {
      //
      //       var isEmtpy = _.isEmpty(card.tags);
      //       if (
      //         ! isEmtpy
      //         && $scope.cards.indexOf(card) === -1
      //       ) {
      //         // see if card has a selected tag
      //         _.each($sessionStorage.currentBoardTags, function(tag) {
      //
      //           if (
      //             tag.selected
      //             && 'tp-all' !== tag.name
      //             && card.tags.hasOwnProperty(tag.name)
      //           ) {
      //             // show cards matching selected tags
      //             $scope.cards.push(card);
      //             return false;
      //
      //           }
      //         });
      //       }
      //     });
      //   }
      // }
    };
    this.startWatching = function() {



      that.unwatchCurrentBoardCards = Me.currentBoardCards.$watch(function(event) {

        switch (event.event) {
          case 'child_changed':
            if ( Me.currentBoardCards.$getRecord(event.key) === null ) {
              TroopLogger.debug(logConfig, event.key, 'card archived');
              $scope.tpDataPumpItems = _.filter($scope.tpDataPumpItems, function(item){
                return item.$id !== event.key;
              });
            }

            that.reOrderStuff();
          break;

          case 'child_added':

            if ( $scope.tpDataPumpItems && $scope.tpDataPumpItems.length > 0 ) {

              Array.prototype.splice.apply(
                $scope.tpDataPumpItems,
                [0,0].concat(Me.currentBoardCards.$getRecord(event.key))
              );
            }
            else {
              $scope.tpDataPumpItems = [Me.currentBoardCards.$getRecord(event.key)]
            }
          break;
        }
      });

    };
    $scope.checkDownload = function(card) {
      var canIDownload = false;
      var boardRead = false;
      var boardPermission = 'admin'
      var createdBy = true;
      if (
        card
        && Me.currentBoard
        && Me.troopMember
        && Me.troopMember.boards
        && Me.troopMember.boards.hasOwnProperty(Me.currentBoard.$id)
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
    $scope.showCardModal = function(action, card, focus) {

      // edit card

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
          if ( focus ) {
            modal.controller.setFocus(focus);
          }
          modal.controller.action = action;



        });
      }

    };
    $scope.showPublicTroopJoinModal = function(type) {

      if ( Me.modalIsOn ) {

        return;
      }

      if (Me.trooper.troops && type === 'button') {

        if (
          Me.trooper.troops[Me.troop.$id]
          && Me.trooper.troops[Me.troop.$id].troopPermission === 'banned'
        ){
          // this person has been banned and can't join this troop
          ModalService.showModal({
            templateUrl: '/views/modal/message.html',
            controller: 'MessageModalCtrl'
          }).then(function(modal) {

            modal.scope.header = "You Need to be Invited"

            modal.scope.message = "You have been removed from this troop. You now have to be invited back in by an admin.";

            modal.scope.accept = function() {

              modal.scope.close();
            };

            modal.close.then(function(result) {

            });

          });
        }
        else {
          TroopApi.joinPublicTroop({
            //userId: Me.trooper.$id,
            troopId: Me.troop.$id,
            reject: false
          })
          .then(function(resp) {

            if ( resp && resp.data) {

              if ( ! resp.data.memberId ) {
                return $q.reject({ code: 'MISSING_TROOP_MEMBER_ID'});
              }

              if ( ! resp.data.troopId ) {
                return $q.reject({ code: 'MISSING_TROOP_ID'});
              }

              that.troopId = resp.data.troopId;
              that.troopMemberId = resp.data.memberId;

              return;

            }
            else {

              return $q.reject({ code: 'SERVER_ERROR'});
            }

          })
          .then(function() {
            Me.joinPublicTroop(that.troopId, that.troopMemberId)
          })
        }


      }
      else {
        ModalService.showModal({
          templateUrl: '/views/modal/public-troop-join.html',
          controller: 'PublicTroopJoinModalCtrl as vm'
        }).then(function(modal) {

          modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

          modal.close.then(function(result) {

          });

        });
      }

    }
    $scope.navToTroopMember = function(troopMemberId) {

      if (Me.troopMember.$id === troopMemberId) {
        return false;
      }

      if (
        Me.currentTroopMember
        && Me.currentTroopMember.$id === troopMemberId
      ) {
        return false;
      }

      Me.loadCurrentTroopMember(Me.troop.$id, troopMemberId);

      Nav.toMemberChat(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        troopMemberId
      );
      // $state.go('home.dashboard.troopMember.chat', { troopMemberId: troopMemberId });

    };
    $scope.navToDetailCard = function(card) {

      Nav.toBoardCard(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        Me.currentBoard.$id,
        card.$id,
        $scope.selectedTagName
      );
      //
      // $state.go('home.dashboard.board.card', {
      //   boardId: Me.currentBoard.$id,
      //   cardId: card.$id
      // });

      Me.multiCardScrollY = $('[data-ui-view=dashboardContent] > ul').scrollTop();
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


        // modal.controller.closeModal = function() {
        //   // modal.controller.close();
        // };

      });
    };
    $scope.showAssetsModal = function(card, assetId) {

      if ( Me.modalIsOn ) {

        return;
      }

      Ref.child('assets')
        .child(card.troopId)
        .child(assetId)
        .once('value', function(snap) {

          if (snap.exists()) {

            var asset = snap.val();
            asset.troopId = card.troopId;

            var mimeType = asset.mimeType;

            if ( ! mimeType && asset.fileName ) {
              var ext = asset.fileName.split('.').pop();
              mimeType = MIME_TYPES[ext];
            }

            var fileType = null;
            if ( mimeType ) {
              fileType = FileFactory.fileTypeClass(mimeType);
            }

            if (
              ( asset.metaData && asset.metaData.videoIframe )
              || 'file-video' === fileType
              || 'file-audio' === fileType
            ) {
              ModalService.showModal({
                templateUrl: '/views/modal/multimedia.html',
                controller: 'MultimediaModalCtrl'
              })
              .then(function(modal) {

                asset.mimeType = mimeType;
                asset.fileType = fileType;

                modal.controller.setData({
                  troopId: card.troopId,
                  asset: asset
                });

                modal.close.then(function(result) {

                });

              });
            }
            else if (
              FileFactory.isImageFileType(mimeType)
              || FileFactory.isDocumentFileType(mimeType)
            ) {
              ModalService.showModal({
                templateUrl: '/views/modal/assets.html',
                controller: 'AssetsModalCtrl'
              })
              .then(function(modal) {





                modal.controller.setData({
                  troopId: card.troopId,
                  card: card,
                  assetId: assetId,
                  isDocumentFileType: FileFactory.isDocumentFileType(mimeType)
                });


                modal.close.then(function(result) {

                });

              });
            }

            else {
              window.open(asset.originalUrl, '_blank');
              //win.focus();
            }

          }

        });
    };
    $scope.customTracking = function(index,id) {
      return index+id;
    }

    $scope.selectTag = function(selectedTagName) {

      _.each($sessionStorage.currentBoardTags, function(tag) {

        tag.selected = selectedTagName === tag.name;
      });

      Me.showRightSidebar[$state.current.name] = true;
      $rootScope.showRightSidebar = true;

      $rootScope.$broadcast('tag-filter-apply', selectedTagName);

    };
    $scope.assetSize = function($index) {
      var size = '';

      TroopLogger.debug(logConfig, '$index: ', $index);
      TroopLogger.debug(logConfig, 'Me.currentBoard Object: ', $.extend({},Me.currentBoard));
      TroopLogger.debug(logConfig, 'Me.currentBoard.viewSettings.card Object: ', Me.currentBoard.viewSettings);

      if (Me.currentBoard.hasOwnProperty('viewSettings')) {
        switch(Me.currentBoard.viewSettings.card.imageSize) {
          case 'large':
            if ( 0 === $index ) {
              size = 'xlargeUrl';
            }
            else {
              size = 'mediumUrl';
            }
            break;

          case 'medium':
            if ( 0 === $index ) {
              size = 'xlargeUrl';
            }
            else {
              size = 'mediumUrl';
            }
            break;

          case 'panoramic':
            if ( 0 === $index ) {
              size = 'xlargeUrl';
            }
            else {
              size = 'mediumUrl';
            }
            break;

          case 'macro':
            if ( 0 === $index ) {
              size = 'xlargeUrl';
            }
            else {
              size = 'mediumUrl';
            }
            break;

          case 'thumbnail':
          default:
            size = 'mediumUrl';
            break;
        }
      }
      else {
        size = 'mediumUrl'
      }




      return size;
    }
    $scope.writeComment = function(card) {

      if ( Me.troopMember.troopPermission !== 'guest' ){

        if ($scope.newNote[card.$id].value) {

          var newNoteObj = {
            troopId: Me.troop.$id,
            cardId: card.$id,
            memberId: Me.troopMember.$id,
            text: $scope.newNote[card.$id].value
          };

          CardFactory.addNote(newNoteObj);

          TroopLogger.debug(logConfig,newNoteObj);

          $scope.newNote[card.$id].value = '';
          $scope.newNote[card.$id].show = false;
          Me.setCurrentNoteEntry($scope.newNote[card.$id].value, card.$id)

          $scope.scrollToBottom = true;
          $timeout(function() {
            $scope.scrollToBottom = false;
          }, 500);
        }
      }

    };
    $scope.newNoteFocus = function(card) {

      if ( Me.troopMember.troopPermission === 'guest' ) {
        //$event.target.blur();
        //$scope.newNote[card.$id].value = '';
        $scope.showPublicTroopJoinModal();
      }
    }
    $scope.newNoteTyping = function(card) {
      if ( Me.troopMember.troopPermission === 'guest' && that.joinModalShowing === false ) {
        //$event.target.blur();
        //$scope.newNote[card.$id].value = '';
        $scope.showPublicTroopJoinModal();
      }
      else{
        Me.setCurrentNoteEntry($scope.newNote[card.$id].value, card.$id)
      }
    }

    $scope.filesAdded = function($files, $file, $event) {
      $("body > .wrapper > main > section > main > ul > .drag-overlay ").removeClass("drag-animate");
      $("body > .wrapper > main > section > main > .empty-board > .drag-overlay ").removeClass("drag-animate");
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

    $scope.tagFilesAdded = function($files, $file, $event) {
      $("body > .wrapper > main > section > main > ul > .drag-overlay ").removeClass("drag-animate");
      $("body > .wrapper > main > section > main > .empty-board > .drag-overlay ").removeClass("drag-animate");
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
        that.createCard(asset, $scope.selectedTagName.substring(3));

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

    this.createCard = function(asset, tagName) {

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
        tagString: tagName || '',
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


       $("body > .wrapper > main > section > main > ul > .drag-overlay > .background-box ").on("dragover", function() {
         $("body > .wrapper > main > section > main > ul > .drag-overlay ").addClass("drag-animate");
       })
       $("body > .wrapper > main > section > main > ul > .drag-overlay > .background-box ").on("dragleave", function() {
         $("body > .wrapper > main > section > main > ul > .drag-overlay ").removeClass("drag-animate");
       })

    }

    $scope.uniqueTrackById = function (count,id){
      return count+'-'+id;
    }

    $rootScope.$watch('readOnlyMode', function() {
      if ($rootScope.readOnlyMode) {
        $scope.assetCountLimit = 3;
        $scope.noteCountLimit = 1;
      }
      else {
        $scope.assetCountLimit = 7;
        $scope.noteCountLimit = 3;
      }
    })

    $rootScope.$broadcast('multi-card-view-loaded');

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      TroopLogger.debug(logConfig, '** stateChangeStart');
      $scope.loading = true;
      that.unwatchCurrentBoardCards();

    });

    $scope.$on('$destroy', function() {


    });

    that.refreshCardMenus();

    Auth.$loaded()
    .then(function waitForRedirect() {

      $scope.loading = true;

      return Me.$doneRedirecting();
    })
    .catch(function authRedirectCatch(error) {


      if ( error && error.code ) {

        switch (error.code) {

          case 'SIGNING_IN':
            // continue loading if signing in
            return this;

          default:
            TroopLogger.error(logConfig, 'Auth & Redirecting catch()', error);
            break;
        }
      }

      // otherwise skip loading
      return $q.reject(error);
    })
    .then(function tryToLoadTrooper() {
      TroopLogger.debug(logConfig, 'tryToLoadTrooper');
      return Me.$doneTryingToLoadTrooper();
    })
    .then(function waitForTrooperToLoad() {
      TroopLogger.debug(logConfig, 'waitForTrooperToLoad');
      return Me.trooper.$loaded();
    })
    .then(function tryToLoadTroopMember() {




      TroopLogger.debug(logConfig, 'tryToLoadTroopMember');
      return Me.$doneTryingToLoadTroopMember();
    })
    .then(function waitForTroopMemberToLoad() {
      TroopLogger.debug(logConfig, 'waitForTroopMemberToLoad');
      return Me.troopMember.$loaded();
    })
    .then(function tryToLoadTroop() {
      TroopLogger.debug(logConfig, 'tryToLoadTroop');
      return Me.$doneTryingToLoadTroop();
    })
    .then(function waitForTroopToLoad() {
      TroopLogger.debug(logConfig, 'waitForTroopToLoad');
      return Me.troop.$loaded();
    })
    .then(function tryToLoadBoard() {
      TroopLogger.debug(logConfig, 'tryToLoadBoard');

      if ( ( ! Me.currentBoard ) || Me.currentBoard.$id !==  $stateParams.boardId ) {

        Me.loadBoard(Me.troop.$id, $stateParams.boardId);
      }

      return Me.$doneTryingToLoadBoard();
    })
    .then(function listenToBoardAndWaitForCardsToLoad() {
      TroopLogger.debug(logConfig, 'listenToBoardAndWaitForCardsToLoad');
      Me.currentBoard
      .$ref()
      .child('viewSettings')
      .child('card')
      .child('imageSize')
      .on('value', function(snap) {

        var imageSize = snap.val();

        if (
          ( ! imageSize )
          || ( imageSize === 'thumbnail' )
        ) {
          $scope.assetCountLimit = 6;
        }
        else {
          $scope.assetCountLimit = 7;
        }
      });

      return Me.currentBoardCards.$loaded();

    })
    .then(function complete() {

      if (
        $localStorage.newTroopId
        && Me.troop.$id === $localStorage.newTroopId
        && Me.screen.width > 1249
        && ! Me.firebaseUser.isAnoymous
      ) {

        vm.hasTour = true;
        initTour();

        $timeout(function() {

          vm.startTour = true;
        }, 1000);
      }


      that.reOrderStuff();
      that.startWatching();

      $scope.$on('tag-filter-apply', function(event, selectedTagName) {

        $scope.selectedTagName = selectedTagName;

        that.reOrderStuff();

        $timeout(function() {
          $('[data-ui-view=dashboardContent] > ul').scrollTop(Me.multiCardScrollY);
          Me.multiCardScrollY = null;
        }, 100, false);
      });

      // Me.currentBoardCards.$loaded().then(function(){
      //
      //
      //   $scope.card = _.last($scope.cards);
      //
      //
      //   if ($scope.card) {
      //     $scope.newNote.value = Me.loadCurrentNoteEntry($scope.card.$id);
      //
      //     that.notes.list = CardFactory.getNotes({
      //       troopId: Me.troop.$id,
      //       cardId: $scope.card.$id
      //     });
      //
      //     that.notes.list.$loaded().then(function() {
      //
      //       //that.orderNotes($scope.card);
      //       //that.refreshNoteMenus($scope.card);
      //
      //       that.notes.list.$watch(function() {
      //         that.orderNotes($scope.card);
      //       });
      //     });
      //   }
      // });

      $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
      $scope.loading = false;
      TroopLogger.debug(logConfig, 'multicardView all loaded - Me.currentBoard',$.extend({},Me.currentBoard));
    })
    .catch(function(error) {
      console.log(error)
    });



    activate();

    return;

    function activate() {

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

    }

    function initTour() {

      var buttons = [
        // {
        //   text: 'Exit',
        //   action: 'cancel',
        //   classes: 'shepherd-button-secondary'
        // },
        {
          text: 'Next!',
          action: 'next',
          classes: 'shepherd-button-example-primary'
        }
      ];

      vm.tourConfig = {
        options: {
          defaults: {
            classes: 'shepherd-theme-arrows',
            // showCancelLink: true
          }
        },
        events: {
          show: function() {

            delete $localStorage.newTroopId;
          },
          complete: function() {

            $timeout(function() {

              vm.hasTour = false;
            }, 400);
          }
        },
        steps: [
          {
            step: 'card',
            options: {
              classes: 'step-card shepherd-theme-arrows',
              title: 'These are cards',
              text: 'This is an example of a card in Troop. Cards are a great way to organize your images and files in a easy-to-find format.',
              attachTo: {
                element: '[data-ui-view=dashboardContent] > .card-list > .card-0',
                on: 'bottom'
              },
              buttons: buttons,
              when: {
                show: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.addClass('animated-show');
                  }, 100);
                },
                hide: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.removeClass('animated-show');
                  }, 100);
                }
              }
            }
          },
          {
            step: 'new-card',
            options: {
              classes: 'step-new-card shepherd-theme-arrows',
              title: 'Click here to create cards',
              text: 'To add more cards to your board, click the this blue plus button. You can add as many cards to a single board as you want.',
              attachTo: {
                element: '[data-ui-view=dashboardHeader] > .wrapper .action.new',
                on: 'bottom'
              },
              buttons: buttons,
              when: {
                show: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.addClass('animated-show');
                  }, 100);
                },
                hide: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.removeClass('animated-show');
                  }, 100);
                }
              }
            }
          },
          {
            step: 'new-board',
            options: {
              classes: 'step-new-board shepherd-theme-arrows',
              title: 'These are your boards',
              text: 'Boards allow you to organzie your cards by topic. For example, you can have a board for your bugs or a board for your leads.',
              attachTo: {
                element: '[data-ui-view=leftSidebar] > main > .boards > header > .image-container',
                on: 'right'
              },
              buttons: buttons,
              when: {
                show: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.addClass('animated-show');
                  }, 100);
                },
                hide: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.removeClass('animated-show');
                  }, 100);
                }
              }
            }
          },
          {
            step: 'direct-messaging',
            options: {
              classes: 'step-direct-messaging shepherd-theme-arrows',
              title: 'Direct messaging',
              text: 'Direct messaging allows you to share and collaborate together. You can also chat and collaborate on boards.',
              attachTo: {
                element: '[data-ui-view=leftSidebar] > main > .troop-members > header > .image-container',
                on: 'right'
              },
              buttons: buttons,
              when: {
                show: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.addClass('animated-show');
                  }, 100);
                },
                hide: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.removeClass('animated-show');
                  }, 100);
                }
              }
            }
          },
          // {
          //   step: 'new-troop',
          //   options: {
          //     title: 'Creating New Troops',
          //     text: 'You can have as many Troops as you want. Creating multiple Troops allows you to keep your cards and boards organized by category.',
          //     attachTo: {
          //       element: '[data-ui-view=troopSidebar] > .troop-list > .new-troop > .image-container',
          //       on: 'right'
          //     },
          //     buttons: buttons
          //   }
          // },
          {
            step: 'help-troop',
            options: {
              classes: 'step-help-troop shepherd-theme-arrows',
              title: 'Help Troop',
              text: 'Now that you know the basics, go and explore Troop. If you have questions about anything, just check out the "Help Troop" for some tips and tricks.',
              attachTo: {
                element: '[data-ui-view=troopSidebar] > .troop-list > [data-troop-id=' + HELP_TROOP_ID + ']',
                on: 'right'
              },
              buttons: [
                {
                  text: 'Get Started',
                  action: 'complete',
                  classes: 'shepherd-button-example-primary'
                }
              ],
              when: {
                show: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.addClass('animated-show');
                  }, 100);
                },
                hide: function() {
                  var $el = $(this.el);

                  $timeout(function() {

                    $el.removeClass('animated-show');
                  }, 100);
                }
              }
            }
          }
        ]
      }

    }

  }

})();
