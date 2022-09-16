'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:CardListCtrl
 * @description
 * # CardListCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'SearchCardsCtrl',
    [
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
      'ModalService',
      'SearchFactory',
      'UAParser',
      '$q',
      function SearchCardsCtrl(
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
        ModalService,
        SearchFactory,
        UAParser,
        $q
      ) {

        $scope.loading = false;
        $scope.Me = Me;
        $scope.cards = [];

        var mobile = ('iOS' === UAParser.os.name) || ('Android' === UAParser.os.name);

        $scope.search = {};
        $scope.search.string = SearchFactory.searchString || $stateParams.search;
        if(!SearchFactory.searchString) SearchFactory.searchString = $scope.search.string;

        $scope.search.lastBoard = SearchFactory.searchLastBoard || $stateParams.boardId;
        if( ! SearchFactory.searchLastBoard) {
          SearchFactory.searchLastBoard = $stateParams.boardId;
        }

        //var foundCards = ;
        var currBoard = $scope.search.lastBoard; //(Me.currentBoard && Me.currentBoard.$id) ? Me.currentBoard.$id : undefined;
        var currString = $stateParams.search || $scope.search.string;

        Me.$doneTryingToLoadTroop().then(function(){
          var search = SearchFactory.search(currString,currBoard,Me.troop.$id,Me.troopMember.$id);

          search.then(function(data){

            SearchFactory.searchResults.all = (data.results[0])? data.results[0].hits : undefined;
            SearchFactory.searchResults.curr = (data.results[2])? data.results[2].hits : undefined;
            SearchFactory.searchResults.chat = (data.results[1])? data.results[1].hits : undefined;

            var rawcards;
            switch($state.current.name){
              case 'home.dashboard.search.allboard':
                rawcards = SearchFactory.searchResults.all;
              break;
              case 'home.dashboard.search.currentboard':
                rawcards = SearchFactory.searchResults.curr;
              break;
            }

            var buildCard = function( rawcard, cb ) {

                var assetCount = rawcard.assets ? _.size(rawcard.assets) : 0;

                var assets = rawcard.assets;

                var orderedAssets = [];

                var betterAssetsObj = [];

                _.each( rawcard.assets,

                  function(value,key){
                    betterAssetsObj.push({'id':key,'order':value});
                  }

                );
                _.sortBy( betterAssetsObj, 'order' );

                _.each( betterAssetsObj,

                  function(value,index){
                    orderedAssets.push(rawcard.id);
                  }

                );


                //orderedAssets:rawcard.assets,

                var card = {
                  $$hashKey:rawcard.$$hashKey,
                  $id:rawcard.objectID,
                  $priority:rawcard.$priority,
                  assetCount: assetCount,
                  assets: assets,
                  orderedAssets: orderedAssets,
                  assetsExtra:rawcard.assetsExtra,
                  boardId:rawcard.board.id,
                  boardName: rawcard.board.name,
                  boardDescription: rawcard.board.description,
                  boardLabel: null,
                  cardName: rawcard._highlightResult.cardName ? rawcard._highlightResult.cardName.value : rawcard.cardName,
                  chatId:rawcard.chatId,
                  createdAt:rawcard.createdAt,
                  createdByMemberId:rawcard.createdByMember.id,
                  description: rawcard._highlightResult.description ? rawcard._highlightResult.description.value : rawcard.description,
                  order:rawcard.order,

                  orderedTags:rawcard.orderedTags,
                  troopId:rawcard.troop.id,
                  troopName:rawcard.troop.name,
                  updatedAt:rawcard.updatedAt
                }

                //$scope.cards.push(card);
                return card;
            }

            _.each( rawcards, function(rawcard){
              $scope.cards.push( buildCard(rawcard) );
            });

            //sort cards by the board
            _.sortBy($scope.cards,'boardName');

            var prevBoardLabel = undefined;

            _.each( $scope.cards, function(card){

              if( prevBoardLabel == undefined ||
                 (prevBoardLabel != undefined &&
                  prevBoardLabel != card.boardName ) )
              {

                prevBoardLabel = card.boardName;
                card.boardLabel = card.boardName;

              } else {

                card.boardLabel = false;

              }

            } );

          });
        });

        $scope.navToDetailCard = function(card,boardId) {
            // destroy current board
            Me.currentBoard = null;
            // destroy current search
            SearchFactory.searchString = '';
            SearchFactory.searchResults = {
              all:null,
              curr:null,
              chat:null
            };
            SearchFactory.searchLastBoard = boardId;

            Me.loadBoard(Me.troop.$id, boardId)
            .then(function waitForBoardToLoad() {

              return Me.currentBoard.$loaded();
            })
            .then(function() {

              Nav.toBoardCard(
                Me.troop.public,
                Me.troopMember.troopPermission !== 'guest',
                boardId,
                card.$id
              );
            });


            // $state.go('home.dashboard.board.card', {
            //   boardId: boardId,
            //   cardId: card.$id
            // });

            Me.multiCardScrollY = $('[data-ui-view=dashboardContent] > ul').scrollTop();

        };
      }
    ]
  );
