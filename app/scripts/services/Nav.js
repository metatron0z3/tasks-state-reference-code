/* global _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
    'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.Nav
   * @description
   * # Nav
   * Factory of the webClientApp
   */
  angular
  .module('webClientApp')
  .factory('Nav', Nav);

  Nav.$inject = [
    '$rootScope',
    '$state',
    '$q',
    'TroopLogger'
  ];

  return;

  function Nav(
    $rootScope,
    $state,
    $q,
    TroopLogger
  ){

    var logConfig = {
      slug: 'service:    Nav - ',
      path: [ 'services', 'Nav.js']
    };

    var service = {
      history: [],
      lastBoardView: null,
      currentBoardView: null,
      viewSettingsHash: {
        'cards': 'card',
        'card': 'card',
        'tags': 'tag',
        'table': 'list',
        'grid': 'grid',
        'document': 'document',
        'chat': 'chat'
      },
      navHash: {
        'card': 'cards',
        'cards': 'cards',
        'tags': 'tags',
        'table': 'table',
        'grid': 'grid',
        'document': 'document',
        'chat': 'chat'
      },
      back: back,
      toBoard: toBoard,
      toBoardCards: toBoardCards,
      toBoardCard: toBoardCard,
      toBoardTags: toBoardTags,
      toBoardGrid: toBoardGrid,
      toBoardChat: toBoardChat,
      toBoardTable: toBoardTable,
      toBoardDocument: toBoardDocument,
      toMemberChat: toMemberChat,
      toBoards: toBoards,
      toMyBoards: toMyBoards,
      toAvailableBoards: toAvailableBoards,
      toMemberList: toMemberList,
      toAdminList: toAdminList,
      toPublicTroop: toPublicTroop,
      toLogin: toLogin,
      toSignUp: toSignUp,
      toHomepage: toHomepage,
      toAffiliateDashboard: toAffiliateDashboard
    };

    activate();

    return service;

    function activate() {

      // $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      //   console.log("Nav - $rootScope.$on('$stateChangeStart')", event, toState, toParams, fromState, fromParams)
      //
      // });

      $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

        var newState = toState.redirectTo || toState.name;


        //if user is just navigating between views, the current view should
        //be preserved when switching board
        var currentState = newState;

        var oldState = fromState.redirectTo || fromState.name;





        $state.go(newState,toParams);

        if ( ! toParams.backState ) {

          service.history.push({
            state: newState,
            params: toParams
          });

        }

        switch (currentState) {
          case 'home.dashboard.board.cards':
          case 'public.dashboard.board.cards':
            service.currentBoardView = 'cards'
            break;

          case 'home.dashboard.board.grid':
          case 'public.dashboard.board.grid':
            service.currentBoardView = 'grid'
            break;

          case 'home.dashboard.board.table':
          case 'public.dashboard.board.table':
            service.currentBoardView = 'table'
            break;

          case 'home.dashboard.board.tags':
          case 'public.dashboard.board.tags':
            service.currentBoardView = 'tags'
            break;

          case 'home.dashboard.board.document':
          case 'public.dashboard.board.document':
            service.currentBoardView = 'document'
            break;

          case 'home.dashboard.board.chat':
          case 'public.dashboard.board.chat':
            service.currentBoardView = 'chat'
            break;

          case 'home.dashboard.board.card':
          case 'public.dashboard.board.card':
            service.currentBoardView = 'card'
            break;

          default :
            service.currentBoardView = 'cards'
            break;
        }

        switch (oldState) {
          case 'home.dashboard.board.cards':
          case 'public.dashboard.board.cards':
            service.lastBoardView = 'cards'
            break;

          case 'home.dashboard.board.grid':
          case 'public.dashboard.board.grid':
            service.lastBoardView = 'grid'
            break;

          case 'home.dashboard.board.table':
          case 'public.dashboard.board.table':
            service.lastBoardView = 'table'
            break;

          case 'home.dashboard.board.tags':
          case 'public.dashboard.board.tags':
            service.lastBoardView = 'tags'
            break;

          case 'home.dashboard.board.document':
          case 'public.dashboard.board.document':
            service.lastBoardView = 'document'
            break;

          case 'home.dashboard.board.chat':
          case 'public.dashboard.board.chat':
            service.lastBoardView = 'chat'
            break;

          default :
            service.lastBoardView = 'cards'
            break;
        }

      });
    }

    /**
     * [prefix description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {Promise}                  A promise representing the state of the new transition.
     */
    function prefix(isPublic, isMemberOfTroop) {

      return isPublic && ( ! isMemberOfTroop ) ? 'public' : 'home';
    }

    /**
     * [back description]
     * @return {Promise} A promise representing the state of the new transition.
     */
    function back(selectedTagName) {

      if ( service.history.length > 1 ) {

        var prev = service.history[service.history.length - 2];

        service.history.pop();

        prev.params.backState = true;

        if ( selectedTagName ) {
          prev.params.selectedTagName = selectedTagName;
        }

        return $state.go( prev.state, prev.params );
      }
    }

    /**
     * [toBoard description]
     * @param  {[type]}  view            [description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @param  {[type]}  cardId          [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoard(view, isPublic, isMemberOfTroop, boardId, cardId, selectedTagName) {
      TroopLogger.debug(logConfig, 'toBoard()', view, boardId, cardId, selectedTagName);

      var state = [
        prefix(isPublic, isMemberOfTroop),
        'dashboard',
        'board',
        view || 'cards' // default to cards view
      ];

      var params = {
        boardId: boardId,
        selectedTagName: selectedTagName
      };

      if ( cardId ) {
        params.cardId = cardId;
      }

      return $state.go(state.join('.'), params);
    }

    /**
     * [toBoardCards description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardCards(isPublic, isMemberOfTroop, boardId, selectedTagName) {

      return toBoard('cards', isPublic, isMemberOfTroop, boardId, false, selectedTagName);
    }

    /**
     * [toBoardCard description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @param  {[type]}  cardId          [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardCard(isPublic, isMemberOfTroop, boardId, cardId, selectedTagName) {

      return toBoard('card', isPublic, isMemberOfTroop, boardId, cardId, selectedTagName);
    }

    /**
     * [toBoardChat description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardChat(isPublic, isMemberOfTroop, boardId) {

      return toBoard('chat', isPublic, isMemberOfTroop, boardId);
    }

    /**
     * [toBoardTags description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardTags(isPublic, isMemberOfTroop, boardId) {

      return toBoard('tags', isPublic, isMemberOfTroop, boardId);
    }

    /**
     * [toBoardGrid description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardGrid(isPublic, isMemberOfTroop, boardId) {

      return toBoard('grid', isPublic, isMemberOfTroop, boardId);
    }

    /**
     * [toBoardGrid description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardTable(isPublic, isMemberOfTroop, boardId) {

      return toBoard('table', isPublic, isMemberOfTroop, boardId);
    }

    /**
     * [toBoardDocument description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  boardId         [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoardDocument(isPublic, isMemberOfTroop, boardId) {

      return toBoard('document', isPublic, isMemberOfTroop, boardId);
    }


    /**
     * [toBoards description]
     * @param  {[type]}  view            [description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toBoards(view, isPublic, isMemberOfTroop) {

      var state = [
        prefix(isPublic, isMemberOfTroop),
        'dashboard',
        'boards',
        view || 'available' // default to available boards view
      ];
      return $state.go(state.join('.'));
    }

    /**
     * [toMyBoards description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {[type]}                  [description]
     */
    function toMyBoards(isPublic, isMemberOfTroop) {

      return toBoards('mine', isPublic, isMemberOfTroop);
    }

    /**
     * [toAvailableBoards description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {[type]}                  [description]
     */
    function toAvailableBoards(isPublic, isMemberOfTroop) {

      return toBoards('available', isPublic, isMemberOfTroop);
    }

    /**
     * [toMemberChat description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @param  {[type]}  troopMemberId   [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toMemberChat(isPublic, isMemberOfTroop, troopMemberId) {

      if ( isPublic && ! isMemberOfTroop ) {
        // prevent nav to member chat when troop is public
        return $q.reject({ code: 'GUEST_NOT_ALLOWED' });
      }

      var state = [
        prefix(isPublic, isMemberOfTroop),
        'dashboard',
        'troopMember',
        'chat'
      ];

      var params = {
        troopMemberId: troopMemberId
      };

      return $state.go(state.join('.'), params);
    }

    /**
     * [toTroopMembers description]
     * @param  {[type]}  view            [description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toTroopMembers(view, isPublic, isMemberOfTroop) {

      var state = [
        prefix(isPublic, isMemberOfTroop),
        'dashboard',
        'troopMembers',
        'list'
      ];

      var params = {
        permission: view || 'admin'
      };

      return $state.go(state.join('.'), params);
    }

    /**
     * [toMemberList description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toMemberList(isPublic, isMemberOfTroop) {

      return toTroopMembers('member', isPublic, isMemberOfTroop);
    }

    /**
     * [toAdminList description]
     * @param  {Boolean} isPublic        [description]
     * @param  {Boolean} isMemberOfTroop [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */
    function toAdminList(isPublic, isMemberOfTroop) {

      return toTroopMembers('admin', isPublic, isMemberOfTroop);
    }

    /**
     * [toPublicTroop description]
     * @param  {[type]}  troopSlug       [description]
     * @return {Promise}                 A promise representing the state of the new transition.
     */

    function toPublicTroop(troopSlug) {

      return $state.go( 'public', {troopSlug: troopSlug} );
    }

    /**
    *
    *
    *
    */
    function toLogin() {

      return $state.go('auth.login');
    }

    /**
    *
    *
    *
    */
    function toSignUp() {

      return $state.go('auth.sign-up');
    }

    function toHomepage() {

      return $state.go('home.homepage');
    }

    function toAffiliateDashboard() {

      return $state.go('home.affiliate');
    }

  }

})(); // end of file
