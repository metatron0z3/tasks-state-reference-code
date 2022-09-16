'use strict';

/**
 * @ngdoc service
 * @name webClientApp.SearchFactory
 * @description
 * # SearchFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'SearchFactory',
    [
      'ALGOLIA_SEARCH_KEY',
      'ALGOLIA_SEARCH_APP_ID',
      'algolia',
      '$q',
      function(
        ALGOLIA_SEARCH_KEY,
        ALGOLIA_SEARCH_APP_ID,
        algolia,
        $q
      ) {
        if(ALGOLIA_SEARCH_KEY !== '' || undefined){
          var algolia = algolia.Client(ALGOLIA_SEARCH_APP_ID, ALGOLIA_SEARCH_KEY);
          return {
            searchString: null,
            searchResults: {
              all:null,
              curr:null,
              chat:null
            },
            searchLastBoard: null,

            search: function(string,boardId,troopId,memberId) {

                var deferred = $q.defer();

                var self = this;

                var queries = [{
                  indexName: 'cards',
                  query: string,
                  params: {
                    hitsPerPage: 100000,
                    filters: 'troop.id:' + troopId
                  }
                }, {
                  indexName: 'chats',
                  query: string,
                  params: {
                    facets: 'chatId',
                    hitsPerPage: 100000,
                    filters: 'troopId:'+troopId+
                             ' AND '+
                             '( member.id:'+memberId+' OR '+
                             '  otherMember:'+memberId+
                             ')'
                             // OR '+
                             // '  member.id:'+Me.troopMember.$id+' AND NOT '+
                             // '  boardId:unknown '+
                  },
                  ranking: 'createdAt'
                }, {
                  indexName: 'cards',
                  query: string,
                  params: {
                    hitsPerPage: 100000,
                    filters: 'board.id:'+boardId+' AND troop.id:'+troopId
                  }
                }];

                if( !boardId ) {

                  queries = _.without(queries, _.last(queries));

                }

                //if(boardId) queries = _.filter(queries, function(num,index){ return index !== 2; });

                deferred.resolve(algolia.search(queries));

                return deferred.promise;
              //}) // promise end
            }
          };
        }else{
          return '';
        }
      }
    ]
  );
