/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
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
    'SearchChatsCtrl',
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
      function SearchChatsCtrl(
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
        $scope.data = {
            chatEntries: []
        };

        $scope.search = {};
        $scope.search.string = SearchFactory.searchString || $stateParams.search;
        if ( ! SearchFactory.searchString ) {

          SearchFactory.searchString = $scope.search.string;
        }

        $scope.search.lastBoard = SearchFactory.searchLastBoard || $stateParams.boardId;
        if( ! SearchFactory.searchLastBoard ) {

          SearchFactory.searchLastBoard = $stateParams.boardId;
        }

        //var foundCards = ;
        var currBoard = $scope.search.lastBoard; //(Me.currentBoard && Me.currentBoard.$id) ? Me.currentBoard.$id : undefined;
        var currString = $stateParams.search || $scope.search.string;


        Me.$doneTryingToLoadTroop()
        .then(function() {

          var search = SearchFactory.search(currString,currBoard,Me.troop.$id,Me.troopMember.$id);
          search.then(function(data){

            SearchFactory.searchResults.all = (data.results[0])? data.results[0].hits : undefined;
            SearchFactory.searchResults.curr = (data.results[2])? data.results[2].hits : undefined;
            SearchFactory.searchResults.chat = (data.results[1])? data.results[1].hits : undefined;

            var rawChats = SearchFactory.searchResults.chat

            var buildCard = function( _rawchat ) {
              var chatEntry = _rawchat;
              chatEntry.$id = _rawchat.objectID;
              chatEntry.memberId = _rawchat.member.id;
              chatEntry.text = _rawchat.text ? _rawchat._highlightResult.text.value : undefined;

              return chatEntry;
            }

            // we need to filter out all the chat messages that
            // are boardChat and current user is not a member of that board

            _.each( rawChats, function(rawchat) {

              if ( rawchat.boardId !== 'unknown' ) {
                // this is a board chat
                _.each( rawchat.board.members, function(_memberId) {

                  if ( _memberId === rawchat.member.id ) {

                    rawchat.clickAction = $scope.navToBoardChat
                    $scope.data.chatEntries.push( buildCard(rawchat) );
                  }
                });

              }
              else{
                // not a board chat
                rawchat.clickAction = $scope.navToTroopMemberChat
                $scope.data.chatEntries.push( buildCard(rawchat) );
              }
            });

          });
        });


        $scope.navToTroopMemberChat = function(entry) {

          Nav.toMemberChat(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            entry.otherMember
          );
          // $state.go('home.dashboard.troopMember.chat', {
          //   troopMemberId: entry.otherMember
          // });
        };
        $scope.navToBoardChat = function(entry) {

          Nav.toBoardChat(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            entry.boardId
          );
          // $state.go('home.dashboard.board.chat', {
          //   boardId: entry.boardId
          // });
        };
        $scope.navToDetailCard = function(card,boardId) {
          // destroy current board
          Me.currentBoard = null;
          // destroy current search
          SearchFactory.searchString = '';
          SearchFactory.searchResults = {
            all: null,
            curr: null,
            chat: null
          };
          SearchFactory.searchLastBoard = boardId;

          Me.loadBoard(Me.troop.$id, boardId);

          Nav.toBoardCard(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            boardId,
            card.$id
          );
          // $state.go('home.dashboard.board.card', {
          //   boardId: boardId,
          //   cardId: card.$id
          // });

          Me.multiCardScrollY = $('[data-ui-view=dashboardContent] > ul').scrollTop();

        }; // end navToDetailCard

      }
    ]
  );
