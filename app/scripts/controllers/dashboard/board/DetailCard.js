/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:DetailCardCtrl
 * @description
 * # DetailCardCtrl
 * Controller of the DetailCardCtrl
 */
angular
  .module('webClientApp')
  .controller('DetailCardCtrl',DetailCardCtrl);


  DetailCardCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$localStorage',
    '$sessionStorage',
    '$timeout',
    'BoardFactory',
    'CardFactory',
    'FileFactory',
    'ChatFactory',
    'ChatEntryFactory',
    'SecurityFactory',
    'TroopApi',
    'Nav',
    'Auth',
    'Me',
    'Ref',
    'ModalService',
    'MIME_TYPES',
    'UAParser',
    'TroopLogger'
  ];

  function DetailCardCtrl(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $localStorage,
    $sessionStorage,
    $timeout,
    BoardFactory,
    CardFactory,
    FileFactory,
    ChatFactory,
    ChatEntryFactory,
    SecurityFactory,
    TroopApi,
    Nav,
    Auth,
    Me,
    Ref,
    ModalService,
    MIME_TYPES,
    UAParser,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'controller: DetailCard.js - ',
      path: [ 'controllers', 'dashboard', 'board', 'DetailCard.js']
    };


    if (
      ( ! $stateParams.boardId  )
      || ( ! $stateParams.cardId )
    ) {
      // $state.go('home.dashboard.boards.available');
      Nav.toAvailableBoards(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest'
      );
      return false;
    }

    var vm = this;

    var mobile = ('iOS' === UAParser.os.name) || ('Android' === UAParser.os.name);

    vm.unWatchCurrentBoardCards = null;

    var that = this;
    var boardChanged =  false;
    this.notes = {
      list: []
    };

    $scope.Me = Me;
    $scope.loading = true;
    $scope.assetModalShown = false;
    $scope.scrollToBottom = false;
    $scope.card = null;
    this.arrowKeyDebounce = null;
    $scope.newNote = {
      show: false,
      value: null
    };

    $scope.notes = {
      list: [],
      orderedList: []
    };
    $scope.noteMenus = {};
    $scope.emptyInfo = {
      title: '',
      description: ''
    };
    $scope.canDisplayMembers = false;
    var joinModalShowing = false;
    $scope.selectedTagName = $stateParams.selectedTagName;

    this.refreshNoteMenus = function(event) {

      _.each($scope.card.notes, function(note) {
        $scope.noteMenus[note.$id] = false;
      });

    };
    this.orderNotes = function() {
      TroopLogger.debug(logConfig,$scope.notes.orderedList);

      $scope.notes.orderedList = _.sortBy($scope.notes.list, function(note, noteId) {

        note.$id = noteId;
        note.troopId = Me.troop.$id;
        note.cardId = $scope.card.$id;

        return note.createdAt;
      }).reverse();
    };

    this.setCard = function(cardId) {

      Me.$doneTryingToLoadBoard()
      .then(function() {
        return Me.currentBoardCards.$loaded();
      })
      .then(function() {

        $scope.newNote.value = Me.loadCurrentNoteEntry(cardId);

        $rootScope.currentCard = cardId;

        $scope.card = Me.currentBoardCards.$getRecord(cardId);


        $scope.emptyInfo.title = $scope.card.cardName;
        $scope.emptyInfo.description = $scope.card.description;

        $scope.notes.list = $scope.card.notes;

        TroopLogger.debug(logConfig,$scope.notes.list);

        var cards = [];
        var currentCardIndex;
        var prevCardIndex;
        var nextCardIndex;

        if ( _.isEmpty($sessionStorage.currentBoardTags) ) {
          cards = Me.currentBoardCards;

          currentCardIndex = Me.currentBoardCards.$indexFor(cardId);
          prevCardIndex = currentCardIndex - 1;
          nextCardIndex = currentCardIndex + 1;
          $scope.prevCardKey = Me.currentBoardCards.$keyAt(prevCardIndex);
          $scope.nextCardKey = Me.currentBoardCards.$keyAt(nextCardIndex);
        }
        else {
          var allTag = _.findWhere(
            $sessionStorage.currentBoardTags,
            {
              name: 'tp-all'
            }
          );

          if (allTag.selected) {

            cards = Me.currentBoardCards;
          }
          else {

            // get list of selected tag names
            var selectedTagNames = [];
            _.each($sessionStorage.currentBoardTags, function(tag) {

              if (tag.selected) {
                selectedTagNames.push(tag.name);
              }
            });

            _.each(Me.currentBoardCards, function(card) {

              var isEmtpy = _.isEmpty(card.tags);
              if (
                ! isEmtpy
                && cards.indexOf(card) === -1
              ) {
                // see if card has a selected tag
                _.each($sessionStorage.currentBoardTags, function(tag) {

                  if (
                    tag.selected
                    && 'tp-all' !== tag.name
                    && card.tags.hasOwnProperty(tag.name)
                  ) {
                    // show cards matching selected tags
                    cards.push(card);
                    return false;

                  }
                });
              }
            });
          }
          currentCardIndex = cards.indexOf($scope.card);
          prevCardIndex = currentCardIndex - 1;
          nextCardIndex = currentCardIndex + 1;
          $scope.prevCardKey = cards[prevCardIndex] ? cards[prevCardIndex].$id : null ;
          $scope.nextCardKey = cards[nextCardIndex] ? cards[nextCardIndex].$id : null ;
          $scope.firstCardKey = cards[0] ? cards[0].$id : null ;
          $scope.lastCardKey = cards[cards.length-1] ? cards[cards.length-1].$id : null;
        }

        that.notes.list = CardFactory.getNotes({
          troopId: Me.troop.$id,
          cardId: $scope.card.$id
        });

        that.notes.list.$loaded().then(function() {

          that.orderNotes();
          that.refreshNoteMenus();

          that.notes.list.$watch(function() {
            that.orderNotes();
          });
        });

        that.reOrderStuff();
        $scope.loading = false;
      })
      .catch(function(error) {

        console.log(error);
      });


    };
    this.navBack = function() {


      var view = Nav.lastBoardView;

      Nav.toBoard(
        view,
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        Me.currentBoard.$id,
        $scope.selectedTagName
      );

    };

    this.reOrderStuff = function() {
      Me.currentBoardCards.orderCardTags(Me.currentBoard.tagNames);
    };

    $scope.showPublicTroopJoinModal = function(type) {

      if ( Me.modalIsOn ) {

        return;
      }

      that.joinModalShowing = true;
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

            modal.scope.header = "You Need to be Invited";

            modal.scope.message = "You have been removed from this troop. You now have to be invited back in by an admin.";

            modal.scope.accept = function() {

              modal.scope.close();
            };

            modal.close.then(function(result) {
              that.joinModalShowing = false;
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
            that.joinModalShowing = false;
          });

        });
      }

    }
    $scope.checkDownload = function(card) {
      var canIDownload = false;

      var boardRead = Me.currentBoard.readOnly;
      var boardPermission = Me.troopMember.boards[Me.currentBoard.$id].permission;
      var createdBy = (card.createdByMemberId === Me.troopMember.$id);

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
    $scope.showAssetsModal = function(card, assetId) {

      if ( Me.modalIsOn ) {

        return;
      }

      $scope.assetModalShown = true;

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
              }).then(function(modal) {

                asset.mimeType = mimeType;
                asset.fileType = fileType;

                modal.controller.setData({
                  troopId: card.troopId,
                  asset: asset
                });

                modal.close.then(function(result) {
                  $scope.assetModalShown = false;
                });

              });
            }
            else if (FileFactory.isImageFileType(mimeType)) {
              ModalService.showModal({
                templateUrl: '/views/modal/assets.html',
                controller: 'AssetsModalCtrl'
              }).then(function(modal) {

                modal.controller.setData({
                  troopId: card.troopId,
                  card: card,
                  assetId: assetId
                });

                modal.close.then(function(result) {
                  $scope.assetModalShown = false;
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
    $scope.showCardModal = function(action, card, focus) {
      // edit card

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/card.html',
        controller: 'CardModalCtrl as vm'
      }).then(function(modal) {

        modal.controller.setCard(card);
        modal.controller.action = action;

        if (focus) {
          modal.controller.setFocus(focus);
        }

        modal.close.then(function(result) {

        });

      });
    };
    $scope.showDeleteCardModal = function(card) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      })
      .then(function(modal) {

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

          })
          .then(function() {

            modal.controller.closeModal();
          })

        };


        modal.controller.closeModal = function() {
          that.navBack()
        };

      });
    };
    $scope.showDeleteCardNoteModal = function(note) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      }).then(function(modal) {

        modal.controller.extraClasses = 'delete-chat-entry-modal'
        modal.controller.header = 'Delete Note';
        modal.controller.message =
          'Are you sure you want to delete the "<b>'
          + note.text
          + '</b>" note?';
        modal.controller.actionTaken = ' Delete ';
        modal.controller.element = ' Note';

        modal.controller.cancel = function() {
          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          CardFactory.deleteNote(note)
        };

        modal.controller.closeModal = function() {
          that.navBack()
        };

      });
    };
    $scope.toggleAssetExpand = function(cardId) {

      $scope.assetListExpandTracker[cardId] = ! $scope.assetListExpandTracker[cardId];

      if (0 === $scope.assetListCountTracker[cardId]) {
        $scope.assetListCountTracker[cardId] = $scope.assetCountLimit;
      }
      else {
        $scope.assetListCountTracker[cardId] = 0;
      }

    };
    $scope.navToCard = function(cardId) {

      if (cardId) {
        $scope.loading = true;
        Nav.toBoardCard(
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          Me.currentBoard.$id,
          cardId
        );
        // $state.go('home.dashboard.board.card', {
        //   boardId: Me.currentBoard.$id,
        //   cardId: cardId
        // });
      }

    };
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
    $scope.newNoteFocus = function($event) {

      if ( Me.troopMember.troopPermission === 'guest' ) {
        $event.target.blur();
        $scope.newNote.value = '';
        $scope.showPublicTroopJoinModal();
      }
    }
    $scope.newNoteTyping = function($event) {

      if ( Me.troopMember.troopPermission === 'guest' && that.joinModalShowing === false ) {
        $event.target.blur();
        $scope.newNote.value = '';
        $scope.showPublicTroopJoinModal();
      }
      else{
        Me.setCurrentNoteEntry($scope.newNote.value, $scope.card.$id)
      }
    }

    $scope.writeComment = function() {

      if ( Me.troopMember.troopPermission !== 'guest' ){

        if ($scope.newNote.value) {

          var newNoteObj = {
            troopId: Me.troop.$id,
            cardId: $scope.card.$id,
            memberId: Me.troopMember.$id,
            text: $scope.newNote.value
          };

          CardFactory.addNote(newNoteObj);

          TroopLogger.debug(logConfig,newNoteObj);

          $scope.newNote.value = '';
          $scope.newNote.show = false;
          Me.setCurrentNoteEntry($scope.newNote.value, $scope.card.$id)


        }
      }

    };
    $scope.assetSize = function($index) {
      var size = '';

      switch(Me.currentBoard.viewSettings.card.imageSize) {

        case 'large':
          if ( 0 === $index ) {
            size = 'largeUrl';
          }
          else {
            size = 'mediumUrl';
          }
          break;

        case 'medium':
          if ( 0 === $index ) {
            size = 'largeUrl';
          }
          else {
            size = 'mediumUrl';
          }
          break;

        case 'panoramic':
          if ( 0 === $index ) {
            size = 'largeUrl';
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


      return size;
    }
    $scope.navToMultiCard = function(tagName) {

      _.each($sessionStorage.currentBoardTags, function(tag) {

        tag.selected = tag.name === tagName;
      });



      Nav.toBoardCards(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        Me.currentBoard.$id,
        'tag' + tagName
      );
      //
      // $state.go('home.dashboard.board.cards', {
      //   boardId: Me.currentBoard.$id
      // });
    };

    $scope.$on('tag-filter-apply', function() {
      that.setCard($stateParams.cardId);
    });

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      $scope.loading = true;
    });

    $rootScope.$broadcast('detail-card-view-loaded', $stateParams.cardId);

    $scope.$on('$destroy', function() {

      if ( vm.unWatchCurrentBoardCards ) {
        vm.unWatchCurrentBoardCards();
      }
    });

    $scope.$on('onLeftArrow', function(event) {
      if ( that.arrowKeyDebounce ) {
        $timeout.cancel(that.arrowKeyDebounce);
      }

      that.arrowKeyDebounce = $timeout(function() {

        if ($scope.prevCardKey
            && $scope.prevCardKey !== $scope.card.$id
            && ! $scope.assetModalShown ) {
          $scope.navToCard($scope.prevCardKey);
        }
        that.arrowKeyDebounce = null;

      }, 250 );
    });
    $scope.$on('onUpArrow', function(event) {

      if ( that.arrowKeyDebounce ) {
        $timeout.cancel(that.arrowKeyDebounce);
      }

      that.arrowKeyDebounce = $timeout(function() {

        if ($scope.firstCardKey
            && $scope.firstCardKey !== $scope.card.$id
            && ! $scope.assetModalShown ) {
          $scope.navToCard($scope.firstCardKey);
        }
        that.arrowKeyDebounce = null;

      }, 250 );
    });
    $scope.$on('onRightArrow', function(event) {

      if ( that.arrowKeyDebounce ) {
        $timeout.cancel(that.arrowKeyDebounce);
      }

      that.arrowKeyDebounce = $timeout(function() {

        if ($scope.nextCardKey
            && $scope.nextCardKey !== $scope.card.$id
            && ! $scope.assetModalShown ) {
          $scope.navToCard($scope.nextCardKey);
        }
        that.arrowKeyDebounce = null;

      }, 250 );
    });
    $scope.$on('onDownArrow', function(event) {

      if ( that.arrowKeyDebounce ) {
        $timeout.cancel(that.arrowKeyDebounce);
      }

      that.arrowKeyDebounce = $timeout(function() {

        if ($scope.lastCardKey
            && $scope.lastCardKey !== $scope.card.$id
            && ! $scope.assetModalShown ) {
          $scope.navToCard($scope.lastCardKey);
        }
        that.arrowKeyDebounce = null;

      }, 250 );
    });

    Auth.$loaded().then(function() {
      return Me.$doneRedirecting();
    })
    .catch(function(error) {
      TroopLogger.error(logConfig,error);

      if ( error && error.code ) {

        switch (error.code) {

          case 'SIGNING_IN':
            // continue loading if signing in
            return this;
            break;
        }
      }

      // otherwise skip loading
      return $q.reject(error);
    })
    .then(function() {

      return Me.$doneTryingToLoadTroop();
    })
    .then(function() {

      return Me.trooper.$loaded();
    })
    .then(function() {

      return Me.$doneTryingToLoadTroopMember();
    })
    .then(function() {

      return Me.troopMember.$loaded();
    })
    .then(function() {

      return Me.$doneTryingToLoadTroop();
    })
    .then(function() {

      return Me.troop.$loaded();
    })
    .then(function() {

      if ( ( ! Me.currentBoard ) || Me.currentBoard.$id !==  $stateParams.boardId ) {

        Me.loadBoard(Me.troop.$id, $stateParams.boardId);
      }
      return Me.$doneTryingToLoadBoard();
    })
    .then(function() {

      // var disabled = false;
      //
      // if (
      //   Me.troopMember.hasOwnProperty('boards')
      //   && Me.troopMember.boards.hasOwnProperty(Me.currentBoard.$id)
      //   && Me.troopMember.boards[Me.currentBoard.$id].permission !== 'admin'
      // ) {
      //   disabled = true;
      // }
      //
      // $scope.cardSortableOptions = {
      //   disabled: disabled,
      //   delay: mobile ? 100 : 0,
      //   dropSort: false,
      //   dropAdd: false,
      //   dropRemove: false,
      //   //dropUpdate: false,
      //   dropRevert: true,
      //   group: 'card-list',
      //   draggable: '.card',
      //   scrollSensitivity: 50,
      //   scrollSpeed: 20,
      //   onStart: function(evt) {
      //   },
      //   onEnd: function (/**Event*/evt) {
      //
      //     var boardId = evt.to.getAttribute('data-board-id');
      //     var cardId = evt.item.getAttribute('data-card-id');
      //     var cardObj = Me.currentBoardCards.$getRecord(cardId);
      //
      //
      //     if ( boardId ) {
      //
      //       if ( boardId !== Me.currentBoard.$id ) {
      //
      //         CardFactory.moveCard({
      //           troopId: Me.troop.$id,
      //           cardId: cardId,
      //           toBoardId: boardId,
      //           fromBoardId: Me.currentBoard.$id
      //         })
      //         .then(function() {
      //
      //           $notification(
      //             'Card moved',
      //             {
      //               body: 'Card moved sucessfully.',
      //               dir: 'auto',
      //               lang: 'en',
      //               //tag: 'my-tag',
      //               icon: TROOP_ICON_URL,
      //               delay: 5000, // in ms
      //               focusWindowOnClick: true // focus the window on click
      //             }
      //           );
      //         })
      //         .catch(function(error){
      //           console.log(error);
      //         });
      //
      //         Me.currentBoardCards.removeWithoutSave(cardId);
      //         evt.item.remove();
      //       }
      //
      //       return false;
      //     }
      //     else {
      //       return false;
      //     }
      //
      //   }
      // };
      return Me.currentBoardCards.$loaded();
    })
    .then(function() {

      that.setCard($stateParams.cardId);
      $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck()

      vm.unWatchCurrentBoardCards = Me.currentBoardCards.$watch(function(event) {

        if ( Me.currentBoardCards.$getRecord(event.key) ) {

          that.setCard($stateParams.cardId);
        }

      });
    })
    .catch(function(error) {
      TroopLogger.error(logConfig,error);
    });

   }
