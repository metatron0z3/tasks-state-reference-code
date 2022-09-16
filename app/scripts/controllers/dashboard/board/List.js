/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:CardListCtrl
   * @description
   * # CardListCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('CardListCtrl', CardListCtrl);

  CardListCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$sessionStorage',
    '$timeout',
    '$filter',
    '$notification',
    'Auth',
    'Ref',
    'Me',
    'Nav',
    'BoardFactory',
    'CardFactory',
    'FileFactory',
    'ModalService',
    'UAParser',
    'TroopLogger',
    'TROOP_ICON_URL'
  ];

  function CardListCtrl(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $sessionStorage,
    $timeout,
    $filter,
    $notification,
    Auth,
    Ref,
    Me,
    Nav,
    BoardFactory,
    CardFactory,
    FileFactory,
    ModalService,
    UAParser,
    TroopLogger,
    TROOP_ICON_URL
  ) {

    var logConfig = {
      slug: 'controller: CardListCtrl - ',
      path: [ 'controllers', 'dashboard', 'board', 'List.js']
    };

    var mobile = ('iOS' === UAParser.os.name) || ('Android' === UAParser.os.name);

    var vm = this;

    vm.Me = Me;
    vm.isSettingCardList = false;
    vm.cardListMenus = {};
    vm.listScrollTops = {};
    vm.trackAssets = {};
    vm.loading = true;
    vm.dragDisabled = false;
    vm.cardCount = 0;
    vm.cardLists = [];
    vm.cardListsMap = {};
    vm.tagRenameInput = {};
    vm.tagLabelRenameInput = {};
    vm.showTagRenameInput = {};
    vm.showTagLabelRenameInput = {};
    vm.showNewBoardTagInput = false;
    vm.newBoardTag = {
      value: ''
    };
    vm.showNewCardInput = {};
    vm.showTagList = {};
    vm.newCardName = {};
    vm.assets = [];
    vm.checkboxesToggle = true;
    vm.isModalShowing = false;
    vm.tagSorting = false;
    vm.tagColors = [
      '#ED193F',
      '#A5286A',
      '#5C2E91',
      '#364FA3',
      '#0065B3',

      '#048A8B',
      '#2FB846',
      '#A8CF38',
      '#FDB813',
      '#F78222'
    ];
    vm.mouseOverCardId = null;
    vm.changed = false;

    vm.drag = drag;
    vm.filesAdded = filesAdded;
    vm.onAssetProcessingComplete = onAssetProcessingComplete;
    vm.cardListTableClasses = cardListTableClasses;
    vm.initTagListCheckbox = initTagListCheckbox;
    vm.toggleList = toggleList;
    vm.toggleCheckboxes = toggleCheckboxes;
    vm.cardHasListTag = cardHasListTag;
    vm.navToDetailCard = navToDetailCard;
    vm.showCardModal = showCardModal;
    vm.showDeleteCardModal = showDeleteCardModal;
    vm.createCard = createCard;
    vm.showTagRename = showTagRename;
    vm.showTagLabelRename = showTagLabelRename;
    vm.renameTag = renameTag;
    vm.renameTagLabel = renameTagLabel;
    vm.createNewBoardTag = createNewBoardTag;
    vm.showBulkArchiveCardsModal = showBulkArchiveCardsModal;
    vm.removeEmptyList = removeEmptyList;
    vm.removeList = removeList;
    vm.chooseColor = chooseColor;
    vm.customTracking = customTracking;
    vm.toggleTagRenameInput = toggleTagRenameInput;
    vm.toggleTagLabelRenameInput= toggleTagLabelRenameInput;
    vm.unWatchCurrentBoardCards = function() {};

    activate();

    return;

    function activate() {
      $rootScope.showTagChooser = false;

      $rootScope.$broadcast('current-tag-filter-changed');

      $rootScope.$broadcast('card-list-view-loaded');

      $scope.$on('$destroy', function() {
        //TODO: clean up stuff

        vm.unWatchCurrentBoardCards();
      });

      if (Me.showTagList) {
        var values = _.values(Me.showTagList);
        var showAll = true;
        _.each(values, function(val) {
          if (val === false) {
            showAll = false;
            return false;
          }
        });

        if ( ! showAll ) {
          $rootScope.showTagChooser = true;
        }

        vm.showTagList = Me.showTagList;
        Me.showTagList = null;
      }

      $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        Me.showTagList = vm.showTagList;
        vm.loading = true;
        vm.unWatchCurrentBoardCards();
      });

      Auth.$loaded()
      .then(function waitForRedirect() {
        TroopLogger.debug(logConfig, 'Auth.$loaded()');

        return Me.$doneRedirecting();
      })
      .catch(function catchSignIn(error) {

        TroopLogger.debug(logConfig, 'Auth.$loaded() - catch error');

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
      .then(function setSortOptions() {

        var disabled = false;

        if (
          Me.troopMember.hasOwnProperty('boards')
          && Me.troopMember.boards.hasOwnProperty(Me.currentBoard.$id)
          && Me.troopMember.boards[Me.currentBoard.$id].permission !== 'admin'
        ) {
          disabled = true;
        }

        vm.cardSortableOptions = {
          disabled: disabled,
          delay: mobile ? 100 : 0,
          dropSort: false,
          dropAdd: false,
          dropRemove: false,
          //dropUpdate: false,
          dropRevert: true,
          group: 'card-list',
          draggable: '.card',
          scrollSensitivity: 50,
          scrollSpeed: 20,
          onStart: function(evt) {
            
            vm.dragDisabled = true;
          },
          onEnd: function (/**Event*/evt) {
            //console.log('onEnd',evt);
            var boardId = evt.to.getAttribute('data-board-id');
            var cardId = evt.item.getAttribute('data-card-id');
            var cardObj = Me.currentBoardCards.$getRecord(cardId);

            if ( boardId ) {

              if ( boardId !== Me.currentBoard.$id ) {

                CardFactory.moveCard({
                  troopId: Me.troop.$id,
                  cardId: cardId,
                  toBoardId: boardId,
                  fromBoardId: Me.currentBoard.$id
                })
                .then(function() {

                  $notification(
                    'Card moved',
                    {
                      body: 'Card moved sucessfully.',
                      dir: 'auto',
                      lang: 'en',
                      //tag: 'my-tag',
                      icon: TROOP_ICON_URL,
                      delay: 5000, // in ms
                      focusWindowOnClick: true // focus the window on click
                    }
                  );
                })
                .catch(function(error){
                  console.log(error);
                });

                Me.currentBoardCards.removeWithoutSave(cardId);
                evt.item.remove();
              }
              else {

                var children = $(evt.from).children();
                var index = evt.oldIndex;

                if ( index < 0 ) {
                  index = 0;
                }

                if ( index === 0 ) {

                  $(evt.from).prepend(evt.item);
                }
                if ( index === children.length ) {

                  $(evt.from).append(evt.item);
                }
                else {

                  $(evt.from).children().eq(index).before(evt.item);
                }

              }

              return false;
            }

            var toListName = evt.to.getAttribute('data-list-name');
            var fromListName = evt.from.getAttribute('data-list-name');
            var toModels = vm.cardListsMap[toListName].cards;
            var fromModels = vm.cardListsMap[fromListName].cards;
            var $nextEl = $(evt.from).find("> :nth-child(" + (evt.oldIndex + 1) + ")");
            var prevCardIndex = evt.newIndex - 1;
            var nextCardIndex = evt.newIndex + 1;

            var data = {
              oldIndex: evt.oldIndex,
              newIndex: evt.newIndex,
              fromEl: evt.from,
              toEl: evt.to,
              itemEl: evt.item,
              nextEl: $nextEl.length > 0 ? $nextEl[0] : null,
              toListName: toListName,
              toModels: toModels,
              fromListName: fromListName,
              fromModels: fromModels,
              cardId: cardId,
              cardObj: cardObj,
              indexInToList: toModels.indexOf(cardObj),
              indexInFromList: fromModels.indexOf(cardObj),
              prevCardIndex: prevCardIndex,
              prevCardObj: prevCardIndex >= 0 ? toModels[prevCardIndex] : null,
              nextCardIndex: nextCardIndex,
              nextCardObj: nextCardIndex < toModels.length ? toModels[nextCardIndex] : null

            };

            TroopLogger.debug(logConfig, 'end card drag', $.extend({}, data));

            if (data.prevCardObj === data.cardObj) {

              data.prevCardObj = data.prevCardIndex - 1 > 0 ? data.toModels[data.prevCardIndex - 1] : null;
            }

            if (data.nextCardObj === data.cardObj) {

              data.nextCardObj = data.nextCardIndex + 1 < data.toModels.length ? data.toModels[data.nextCardIndex + 1] : null;
            }

            if ('untagged' === fromListName) {

              if ('untagged' === toListName) {
                moveWithinUntaggedList(data);
              }
              else {
                movedFromUntaggedList(data);
              }

            }
            else if ('untagged' === toListName) {
              movedToUntaggedList(data);
            }
            else if (toListName === fromListName) {
              movedWithinOtherCardsList(data);
            }
            else {
              movedBetweenOtherCardsList(data);

            }

            vm.dragDisabled = false;
            return false;
          }
        };

        vm.tagSortableOptions = {
          getModels: function(){
            return vm.cardLists;
          },
          disabled: disabled,
          delay: mobile ? 100 : 0,
          //dropSort: false,
          //dropAdd: false,
          //dropRemove: false,
          dropUpdate: false,
          //dropRevert: true,
          group: 'tag-list',
          draggable: '.tag-list',
          handle: '.tag-list-drag-handle',
          scrollSensitivity: 220,
          onStart: function(evt) {
            vm.dragDisabled = true;
          },
          onEnd: function (/**Event*/evt) {


            var curTagName = evt.item.getAttribute('data-tag-name');
            var curTagObj = vm.cardListsMap[curTagName];
            var prevEl = evt.item.previousElementSibling;
            var prevTagName = null;
            var prevTagObj = null;
            if (prevEl) {
              prevTagName = prevEl.getAttribute('data-tag-name');
              if ('untagged' === prevTagName) {
                prevEl = null;
                prevTagName = null;
              }
              else {
                prevTagObj = vm.cardListsMap[prevTagName];
              }
            }
            var nextEl = evt.item.nextElementSibling;
            var nextTagName = null;
            var nextTagObj = null;
            if (nextEl) {
              nextTagName = nextEl.getAttribute('data-tag-name');
              nextTagObj = vm.cardListsMap[nextTagName];
            }

            var prevOrder = curTagObj.order;
            if (prevEl && nextEl) {
              //in between
              curTagObj.order = prevTagObj.order - ( (prevTagObj.order - nextTagObj.order) / 2.0 );
            }
            else if (prevEl) {
              //end
              curTagObj.order = prevTagObj.order / 2.0;
            }
            else if (nextEl) {
              //beginning
              curTagObj.order = nextTagObj.order + 1;
            }

            if (curTagObj.order !== prevOrder) {

              Me.currentBoard.tagNames[curTagName].order = curTagObj.order;
              delete Me.currentBoard.orderedTagNames;

              Me.currentBoard.$save().then(function() {

                if (prevEl && nextEl) {

                }
                else if (prevEl) {
                  evt.item.parentElement.removeChild(evt.item);
                }

              });
            }
            else {
              var inc = 0.0009765625;

              var toUpdateOrderList = _.where(Me.currentBoard.orderedTagNames, {order: curTagObj.order}).reverse();

              var newPrevIndex = toUpdateOrderList.indexOf(Me.currentBoard.tagNames[prevTagName]);
              var newCurIndex = toUpdateOrderList.indexOf(Me.currentBoard.tagNames[curTagName]);
              var newNextIndex = toUpdateOrderList.indexOf(Me.currentBoard.tagNames[nextTagName]);

              toUpdateOrderList.splice(newPrevIndex - 1, 0, toUpdateOrderList.splice(newCurIndex, 1)[0]);

              _.each(toUpdateOrderList, function(tag) {
                var key = _.findKey(Me.currentBoard.tagNames, tag);
                Me.currentBoard.tagNames[key].order = curTagObj.order + inc;
                inc += inc;
              });

              Me.currentBoard.$save().then(function() {

              });
            }
            vm.dragDisabled = false;
          }
        };

        return Me.currentBoardCards.$loaded();
      })
      .then(function waitForBoardAssets() {

        return Me.currentBoardAssets.$loaded();
      })
      .then(function complete() {

        startWatching();
        vm.loading = false;

        vm.isAdmin = Me.troopMember.boards[Me.currentBoard.$id].permission === 'admin';

        if (
          Me.troopMember.troopPermission !== 'guest'
          && (
            ( ! Me.currentBoard.readOnly )
            || vm.isAdmin
          )
        ) {

          vm.dragDisabled = false;
        }
        else {

          vm.dragDisabled = true;
        }

      });

    }

    function toggleTagLabelRenameInput(list, toggle) {
      $timeout(function() {
        vm.showTagLabelRenameInput[list.name] = toggle;
      }, 0);
    }

    function toggleTagRenameInput(list, toggle) {
      $timeout(function() {
        vm.showTagRenameInput[list.name] = toggle;
      }, 0);
    }

    function updateCardOrder(data) {

      vm.changed = true;

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

        vm.changed = false;
        TroopLogger.debug(logConfig, 'last empty else from updateCardOrder()');
        //no change to order needed
      }
    }

    function saveCard(data) {

      grapListScrollTops();

      Me.currentBoardCards.$save(data.cardObj).then(function() {

        $timeout(function() {

          scrollLists();
        }, 500);

      });

      if (data.toIncrement) {


        incrementTagCount(data.toIncrement);
        data.toIncrement = null;
      }

      if (data.toDecrement) {

        decrementTagCount(data.toDecrement);
        data.toDecrement = null;
      }

    }

    function moveWithinUntaggedList(data) {

      TroopLogger.debug(logConfig, 'moveWithinUntaggedList()' + data);

      updateCardOrder(data);
      saveCard(data);
    }

    function movedFromUntaggedList(data) {

      TroopLogger.debug(logConfig, 'movedFromUntaggedList' + data);

      if (data.indexInToList === -1) {
        //not in list yet, add tag
        if ( ! data.cardObj.tags ) {
          data.cardObj.tags = {};
        }
        data.cardObj.tags[data.toListName] = '';
        data.toIncrement = data.toListName;

        // shift nextCardObj
        data.nextCardObj = data.toModels[data.nextCardIndex - 1];
      }
      else {
        //already in list, remove exising dom element

        // shift prevCardObj
        data.prevCardObj = data.toModels[data.prevCardIndex];

        if (data.newIndex === 0) {
          data.nextCardObj = data.toModels[0];
          data.prevCardObj = null;
        }
        else if (data.newIndex === data.toModels.length) {
          data.nextCardObj = null;
          data.prevCardObj = data.toModels[data.toModels.length - 1];
        }
        else {
          data.nextCardObj = data.toModels[data.nextCardIndex - 1];
        }

        if (data.nextCardObj === data.cardObj) {
          data.nextCardObj = null;
        }

        if (data.prevCardObj === data.cardObj) {
          data.prevCardObj = null;
        }

        // remove existing dom element, keep newly dropped one
        $(data.toEl).find('[data-card-id=' + data.cardObj.$id + ']').each(function() {
          if (this !== data.itemEl) {
            data.toEl.removeChild(this);
          }
        });
      }

      var prevOrder = data.cardObj.order;
      updateCardOrder(data);

      if (data.indexInToList === -1 || prevOrder !== data.cardObj.order) {
        //something changed
        saveCard(data);
      }

    }

    function movedToUntaggedList(data) {

      TroopLogger.debug(logConfig, 'movedToUntaggedList()' + data);
      //remove tag
      delete data.cardObj.tags[data.fromListName];
      data.toDecrement = data.fromListName;

      if (data.newIndex === data.indexInToList) {
        //above same object
        data.toEl.removeChild(data.itemEl);
      }
      else if (data.newIndex === (data.indexInToList + 1)) {
        //below same object
        data.toEl.removeChild(data.itemEl);
      }
      else {
        data.nextCardObj = data.toModels[data.nextCardIndex - 1];
        updateCardOrder(data);
      }

      saveCard(data);

    }

    function movedWithinOtherCardsList(data) {

      TroopLogger.debug(logConfig, 'movedWithinOtherCardsList()' + data);

      updateCardOrder(data);
      if (vm.changed) {
        saveCard(data);
      }

    }

    function movedBetweenOtherCardsList(data) {

      TroopLogger.debug(logConfig, 'movedBetweenOtherCardsList' + data);

      // shift nextCardObj
      data.nextCardObj = data.toModels[data.nextCardIndex - 1];
      //copy El back
      if ( ! data.nextEl ) {
        //add to bottom
        data.fromEl.appendChild(data.itemEl.cloneNode(true));
      }
      else {
        //insert before nextEl
        data.fromEl.insertBefore(data.itemEl.cloneNode(true), data.nextEl);
      }

      // remove fromList tag
      delete data.cardObj.tags[data.fromListName];

      data.toDecrement = data.fromListName;


      if (data.indexInToList === -1) {
        //not in list yet, add tag
        if ( ! data.cardObj.tags ) {
          data.cardObj.tags = {};
        }
        data.cardObj.tags[data.toListName] = '';
        data.toIncrement = data.toListName;

      }
      else {
        //already in list, remove exising dom element

        if (data.nextCardObj === data.cardObj) {
          data.nextCardObj = null;
        }

        if (data.prevCardObj === data.cardObj) {
          data.prevCardObj = null;
        }

        // remove existing dom element, keep newly dropped one
        $(data.toEl).find('[data-card-id=' + data.cardObj.$id + ']').each(function() {
          if (this !== data.itemEl) {
            data.toEl.removeChild(this);
          }
        });
      }

      updateCardOrder(data);
      saveCard(data);
    }

    function grapListScrollTops() {

      $('.card-list-table > .wrapper > main > .card-list').each(function() {

        vm.listScrollTops[this.getAttribute('data-list-name')] = this.parentElement.scrollTop;
      });

    }

    function scrollLists() {

      _.each(vm.listScrollTops, function(value, key) {

        if (value) {

          $('[data-list-name='+ key +']').parent().scrollTop(value);
        }
      });
    }

    function incrementTagCount(tagName) {

      if (Me.currentBoard.tagNames[tagName] && Me.currentBoard.tagNames[tagName].count) {

        Me.currentBoard.tagNames[tagName].count = Me.currentBoard.tagNames[tagName].count + 1;
      }

      Me.currentBoard
        .$ref()
        .child('tagNames')
        .child(tagName)
        .child('count')
        .transaction(
          function(currentValue) {
            return (currentValue || 0) + 1;
          },
          function() {}
        );
    }

    function decrementTagCount(tagName) {

      if (Me.currentBoard.tagNames[tagName] && Me.currentBoard.tagNames[tagName].count) {

        Me.currentBoard.tagNames[tagName].count = Me.currentBoard.tagNames[tagName].count - 1;
      }

      Me.currentBoard
        .$ref()
        .child('tagNames')
        .child(tagName)
        .child('count')
        .transaction(
          function(currentValue) {
            var newValue = currentValue - 1;
            if (newValue < 0) {
              newValue = 0;
            }
            return newValue;
          },
          function() {}
        );
    }

    function setCardLists(tagNames) {


      if (vm.isSettingCardList) {
        // debounce hack
        return false;
      }

      vm.isSettingCardList = true;
      vm.cardCount = 0;

      if ( Me.currentBoardCards ) {

        vm.cardCount = Me.currentBoardCards.length;
      }


      if ( ! tagNames ) {

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

        vm.tagRenameInput[tag] = tag.substr(3);
      });

      Me.currentBoard.tagNames = newTagNames;
      Me.currentBoard.orderedTagNames = _.sortBy(newTagNames, 'order').reverse();

      var cards = _.sortBy(Me.currentBoardCards, function(card) {



        if (
          card.orderedAssets
          && card.orderedAssets.length > 0
          && Me.currentBoard.viewSettings.tag.showImage
        ) {

          var firstAsset = Me.currentBoardAssets.$getRecord(card.orderedAssets[0]);

          if ( firstAsset && FileFactory.isImageFileType(getAssetMimeType(firstAsset)) ) {

            card.style = getAssetStyle(firstAsset);
          }

        }

        card.noteCount = _.keys(card.notes).length;
        return card.order;

      }).reverse();

      var untaggedCards = _.filter(cards, function(card) {

        return _.isEmpty(card.tags);
      });

      vm.cardLists = [];
      vm.cardListsMap = {};

      if ( untaggedCards.length > 0 ) {

        vm.cardListsMap['untagged'] = {
          order: Infinity,
          name: 'untagged',
          title: '',
          label: 'General',
          count: untaggedCards.length,
          cards: untaggedCards
        };
        vm.cardLists.push(vm.cardListsMap['untagged']);
      }

      _.each(newTagNames, function(tag, tagName) {

        var tagCards = _.filter(cards, function(card) {
          return (
            card.tags
            && card.tags.hasOwnProperty(tagName)
            && card.tags[tagName] === ''
          );
        });

        vm.cardListsMap[tagName] = {
          name: tagName,
          title: '#' + tagName.substr(3),
          label: tag.label || tagName.substr(3),
          order: tag.order,
          color: tag.color,
          count: tagCards.length,
          cards: tagCards
        };
        vm.cardLists.push(vm.cardListsMap[tagName]);

        if (Me.currentBoard.tagNames[tagName].count !== vm.cardListsMap[tagName].count) {
          // try to fix board counts
          Me.currentBoard.tagNames[tagName].count = vm.cardListsMap[tagName].count;
        }
      });

      vm.cardLists = _.sortBy(vm.cardLists, 'order').reverse();

      if ( Me.cardListScrollX ) {

        $timeout(function() {

          $(".card-list-tables").scrollLeft(Me.cardListScrollX);
          Me.cardListScrollX = null;

        }, 100, false);

      }

      vm.isSettingCardList = false;

    }

    function startWatching() {

      vm.unWatchCurrentBoardCards = Me.currentBoardCards.$watch(function(data) {

        switch (data.event) {
          case 'child_changed':
            setCardLists();
            break;
        }

      });

      Me.currentBoard.$ref().child('tagNames').on('value', function(snap) {

        setCardLists(snap.val());
      });
    }

    function drag($isDragging, $class, $event) {

       $("body > .wrapper > main > section > main > .card-list-tables > .drag-overlay > .background-box ").on("dragover", function() {
         $("body > .wrapper > main > section > main > .card-list-tables > .drag-overlay ").addClass("drag-animate");
       });
       $("body > .wrapper > main > section > main > .card-list-tables > .drag-overlay > .background-box ").on("dragleave", function() {
         $("body > .wrapper > main > section > main > .card-list-tables > .drag-overlay ").removeClass("drag-animate");
       });
    }

    //This is the drag that is for the general vs. specific tags
    // function drag($isDragging, $class, $event) {
    //
    //   if ($isDragging) {
    //     $("body > .wrapper > main > section > main > .card-list-tables > .wrapper> .card-list-table:first-child > .wrapper").addClass("dragover")
    //   }
    //   else {
    //     $("body > .wrapper > main > section > main > .card-list-tables > .wrapper> .card-list-table:first-child > .wrapper").removeClass("dragover")
    //   }
    //
    //
    //
    // }

    function filesAdded($files, $file, $event, listName) {

      $("body > .wrapper > main > section > main > .card-list-tables > .drag-overlay ").removeClass("drag-animate");

      if (vm.maxOrder === -Infinity) {

        vm.maxOrder = 0;
      }

      _.each($files, function(file) {

        vm.maxOrder += 1;

        var asset = {
          order: 1,
          file: file
        };

        vm.assets.splice(0, 0, asset);

        if ( ! FileFactory.isImageFileType(file.type) ) {

          asset.style = getAssetStyle(asset);
        }
        else {

          var reader  = new FileReader();
          reader.addEventListener('load', function() {

            $timeout(function() {

              asset.base64 = reader.result;

              asset.style = getAssetStyle(asset);
            }, 0);

          }, false);

          reader.readAsDataURL(file);
        }

        createCard($event, listName, asset);

      });
    }

    function getAssetMimeType(asset) {

      var mimeType;

      if ( asset.file ) {

        mimeType = asset.file.type;

      }
      else {

        mimeType = asset.mimeType;
      }

      return mimeType;
    }

    function getAssetStyle(asset) {

      var imageUrl;
      var mimeType = getAssetMimeType(asset);

      if ( FileFactory.isImageFileType(mimeType) ) {

        if ( asset.file ) {

          imageUrl = asset.base64;
        }
        else if (asset.metaData) {

          imageUrl = asset.metaData.largeUrl;
        }
      }
      else if ( asset.image ) {

        imageUrl = asset.image.url;
      }
      else {

        var fileType = FileFactory.fileTypeClass(mimeType);

        imageUrl = '/images/svg/icons/' + fileType + '.svg';
      }

      return {
        'background-image': 'url(' + imageUrl + ')'
      };

    };

    function addAsset(asset, cardRef) {

      uploadFile(asset, cardRef);

      onAssetProcessingComplete();
    }

    function onAssetProcessingComplete() {

      var allDone = true;

      if ( ! _.isEmpty(vm.trackAssets) ) {

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

        return;
      }
    }

    function uploadFile(asset, cardRef) {

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
          cardId: cardRef.key,
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
                vm.trackAssets[$file.name] = true;
                onAssetProcessingComplete();
              }
            }
          });
        });



      }
    };

    function cardListTableClasses(list) {

      var classes = '';

      if ( 'untagged' !== list.name ) {

        classes += 'tag-list ';
      }

      if ( vm.showNewCardInput[list.name] ) {

        classes += 'showing-new-card-input ';
      }

      return classes;
    }

    function initTagListCheckbox(tagName) {

      if ( ! vm.showTagList.hasOwnProperty(tagName) ) {

        vm.showTagList[tagName] = true;
      }
    }

    function toggleList(listName) {

      vm.showTagList[listName] = ! vm.showTagList[listName];
      vm.checkboxesToggle = false;
    }

    function toggleCheckboxes() {

      vm.checkboxesToggle = ! vm.checkboxesToggle;
      var tagName;

      for ( tagName in vm.showTagList ) {

        vm.showTagList[tagName] = vm.checkboxesToggle;
      }
    }

    function cardHasListTag(tags, listName) {

      if ('untagged' === listName) {

        return true;
      }

      if ( ! tags ) {

        return false;
      }

      return tags.hasOwnProperty(listName);
    }

    function navToDetailCard(card, tag) {

      _.each($sessionStorage.currentBoardTags, function(boardTag) {

        boardTag.selected = boardTag.name === tag.name;
      });


      Nav.toBoardCard(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        Me.currentBoard.$id,
        card.$id
      );

      Me.cardListScrollX = $('.card-list-tables').scrollLeft();

    }

    function showCardModal(action, card, tagName) {

      if ( Me.modalIsOn ) {

        return;
      }

      if ( ! vm.isModalShowing ) {

        ModalService.showModal({
          templateUrl: '/views/modal/card.html',
          controller: 'CardModalCtrl as vm'
        })
        .then(function (modal) {

          modal.controller.action = action;

          vm.isModalShowing = false;

          if (card) {

            modal.controller.setCard(card);
          }

          if (tagName && 'untagged' !== tagName) {

            modal.controller.tagString = '#' + tagName.substring(3);
          }
        });
      }

    }

    function showDeleteCardModal(card) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      })
      .then(function(modal) {

        modal.controller.extraClasses = 'archive-card-modal';
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
          .catch(function(error) {

            console.log(error);
          });
        };


      });
    }

    function createCard($event, listName, asset) {

      if (vm.newCardName[listName] || asset) {

        var order = 1;

        if (Me.currentBoardCards.length > 0) {

          var prevCard = Me.currentBoardCards[Me.currentBoardCards.length - 1];
          order = (prevCard.order || 1) / 2.0;
        }

        var tags = {};
        if ('untagged' !== listName) {

          tags[listName] = '';
        }
        else {

          tags = null;
        }

        CardFactory.create({
          troopId: Me.troop.$id,
          board: Me.currentBoard,
          order: order,
          cardName: vm.newCardName[listName] || asset.file.name,
          tags: tags,
          createdByMemberId: Me.troopMember.$id
        })
        .then(function(cardRef) {

          vm.cardRef = cardRef;
          if (asset) {

            addAsset(asset, cardRef);
          }
          else {

            return; // skip to next promise
          }
        })
        .then(function() {

          vm.newCardName[listName] = '';
          vm.showNewCardInput[listName] = false;

          grapListScrollTops();
          var $listEl = $('[data-list-name=' + listName + ']');
          vm.listScrollTops[listName] = $listEl[0].scrollHeight;

          $timeout(function() {

            scrollLists();
          }, 1000);

        })
        .catch(function(error){

          console.log(error);

        });

      }

      return false;
    }

    function showTagRename($event, list) {


      if ( list.name === 'untagged' ) {
        return false;
      }

      vm.tagSortableOptions.disabled = true;
      vm.showTagRenameInput[list.name] = true;
      vm.tagRenameInput[list.name] = list.title;

      vm.showTagLabelRenameInput[list.name] = false;
    }

    function showTagLabelRename($event, list) {



      if ( list.name === 'untagged' ) {
        return false;
      }

      vm.tagSortableOptions.disabled = true;
      vm.showTagLabelRenameInput[list.name] = true;
      vm.tagLabelRenameInput[list.name] = list.label;

      vm.showTagRenameInput[list.name] = false;
    }

    function renameTag($event, list) {

      $timeout(function() {

        vm.showTagRenameInput[list.name] = false;

        var inputString = $.trim(vm.tagRenameInput[list.name]);

        if (inputString) {

          var tags = _.keys(CardFactory.parseTagString('#' + inputString));

          if (tags.length > 0) {

            var newTagName = tags[0];

            if ( newTagName !== list.name ) {

              Me.currentBoard.tagNames[newTagName] = Me.currentBoard.tagNames[list.name];
              delete Me.currentBoard.tagNames[list.name];

              _.each(vm.cardListsMap[list.name].cards, function(card) {

                var cardObj = Me.currentBoardCards.$getRecord(card.$id);
                cardObj.tags[newTagName] = cardObj.tags[list.name];
                delete cardObj.tags[list.name];

                Me.currentBoardCards.$save(cardObj);
              });

              Me.currentBoard.$save();
            }
          }
        }
        vm.tagSortableOptions.disabled = false;
      }, 0);

    }

    function renameTagLabel($event, list) {

      $timeout(function() {

        vm.showTagLabelRenameInput[list.name] = false;

        var inputString = $.trim(vm.tagLabelRenameInput[list.name]);

        if (inputString) {

          Me.currentBoard.tagNames[list.name].label = inputString;
        }

        Me.currentBoard.$save();

        vm.tagSortableOptions.disabled = false;

      },0);

    }

    function createNewBoardTag() {

      if (vm.newBoardTag.value) {

        var tags = _.keys(CardFactory.parseTagString('#' + $.trim(vm.newBoardTag.value)));

        if ( ! Me.currentBoard.tagNames ) {

          Me.currentBoard.tagNames = {};
        }

        var tagNames = _.sortBy(Me.currentBoard.tagNames, 'order');

        var order = 1;

        if (tagNames.length > 0) {

          order = tagNames[0].order / 2;
        }

        Me.currentBoard.tagNames[tags[0]] = {
          order: order,
          count: 0
        };

        BoardFactory.update({
          board: Me.currentBoard
        })
        .then(function() {
          vm.newBoardTag.showNewBoardTagInput = false;
          vm.newBoardTag.value = '';
        })
        .catch(function (error) {

          console.log(error);
        });


      }

    };

    function showBulkArchiveCardsModal(listName) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      })
      .then(function(modal) {

        modal.controller.extraClasses = 'bulk-archive-cards-modal'
        modal.controller.header = 'Delete Cards';
        modal.controller.message = [
          'Are you sure you want to delete "<b>ALL</b>" cards in this list?',
        ];
        modal.controller.actionTaken = ' Delete ';
        modal.controller.element = ' Cards';

        modal.controller.message = modal.controller.message.join('');

        modal.controller.cancel = function() {

          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          _.each(vm.cardListsMap[listName].cards, function(card) {

            Ref.child('cards')
              .child(card.troopId)
              .child(card.$id)
              .child('archived')
              .set( true );

          });

          Ref.child('boards')
            .child(Me.currentBoard.troopId)
            .child(Me.currentBoard.$id)
            .child('tagNames')
            .child(listName)
            .remove();

          modal.controller.closeModal();

        };

      });
    };

    function removeEmptyList(listName) {

      if ( Me.modalIsOn ) {

        return;
      }

      if ('untagged' !== listName) {

        ModalService.showModal({
          templateUrl: '/views/modal/delete.html',
          controller: 'DeleteModalCtrl as vm'
        })
        .then(function(modal) {

          modal.controller.extraClasses = 'remove-empty-list-modal'
          modal.controller.header = 'Remove Empty List';
          modal.controller.message =
            'Are you sure you want to remove the <b>#' +
            listName +
            '</b> list?'
          modal.controller.actionTaken = ' Remove ';
          modal.controller.element = ' List';

          modal.controller.cancel = function() {

            modal.controller.closeModal();
          };

          modal.controller.remove = function() {

            delete Me.currentBoard.tagNames[listName];

            Me.currentBoard.$save().then(function() {

              modal.controller.closeModal();
            });

          };

        });
      }

    };

    function removeList(listName) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      })
      .then(function(modal) {

        modal.controller.extraClasses = 'remove-empty-list-modal'
        modal.controller.header = 'Remove List';
        modal.controller.message =
          'Are you sure you want to remove the <b>#' +
          listName.substr(3) +
          '</b> list?'
        modal.controller.actionTaken = ' Remove ';
        modal.controller.element = ' List';

        modal.controller.cancel = function() {

          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          _.each(vm.cardListsMap[listName].cards, function(card) {

            delete card.tags[listName];
            Me.currentBoardCards.$save(card);
          });

          delete Me.currentBoard.tagNames[listName];

          Me.currentBoard.$save()
          .then(function() {

            modal.controller.closeModal();
          });

        };

      });

    };

    function chooseColor(listName, color) {

      if (  color ===  Me.currentBoard.tagNames[listName].color  ) {

        Me.currentBoard.tagNames[listName].color = '';
      }
      else {

        Me.currentBoard.tagNames[listName].color = color;
      }

      Me.currentBoard.$save();
    };

    function customTracking(index, id) {

      return index + '-' + id;
    }



  }


})();
