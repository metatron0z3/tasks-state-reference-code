'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TroopMemberHeaderCtrl
 * @description
 * # TroopMemberHeaderCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'TroopMemberHeaderCtrl',
    [
      '$rootScope',
      '$scope',
      '$state',
      '$stateParams',
      '$localStorage',
      '$timeout',
      'Auth',
      'Me',
      'Ref',
      '$firebaseObject',
      'UAParser',
      'SearchFactory',
      'SecurityFactory',
      'API_SERVER_URL',
      'ALGOLIA_SEARCH_KEY',
      function TroopMemberHeaderCtrl(
        $rootScope,
        $scope,
        $state,
        $stateParams,
        $localStorage,
        $timeout,
        Auth,
        Me,
        Ref,
        $firebaseObject,
        UAParser,
        SearchFactory,
        SecurityFactory,
        API_SERVER_URL,
        ALGOLIA_SEARCH_KEY
      ) {

        var that = this;
        that.prevTroopMemberId = null;

        $scope.Me = Me;
        $scope.showActionMenu = false;
        $scope.showNotificationMenu = false;
        $scope.searchIsEnabled = ( ( ALGOLIA_SEARCH_KEY !== '' ) || undefined ) ? true : false;
        $scope.canDisplayMembers = false;

        if ( $scope.searchIsEnabled ) {

          $scope.search = {
            string: SearchFactory.searchString || $stateParams.search,
            results: {
              all: SearchFactory.searchResults.all,
              curr: SearchFactory.searchResults.curr,
              chat: SearchFactory.searchResults.chat
            },
            lastBoard: SearchFactory.searchLastBoard
          };

          $scope.doSearch = function() {

            var newData = $scope.search.string;

            if( newData !== "" && newData !== null) {

                var myState = $state.current.name.indexOf('home.dashboard.search') === -1 ? 'home.dashboard.search.allboard' : $state.current;

                if ( Me.currentBoard ) {

                  var boardId = Me.currentBoard.$id;

                }else{

                  var boardId = $scope.search.lastBoard;

                }

                $state.go(
                  myState ,
                  {
                    'boardId': boardId,
                    'search': newData
                  },
                  {
                    reload:$state.current
                  }
                ); //, notify:false



                SearchFactory.searchString = newData;
                $scope.search = {
                  string: SearchFactory.searchString,
                  results: {
                    all: SearchFactory.searchResults.all,
                    curr: SearchFactory.searchResults.curr,
                    chat: SearchFactory.searchResults.chat
                  }
                }
            }
          };


          $rootScope.$watch(function() {
            return SearchFactory.searchString
          }, function (newData, oldData) {
              $scope.search.string = newData;
          });

          $rootScope.$watch(function() {
            return SearchFactory.searchResults
          }, function (newData, oldData) {
              $scope.search.results = newData;
          });
          $rootScope.$watch(function() {
            return SearchFactory.searchLastBoard
          }, function (newData, oldData) {
              $scope.search.lastBoard = newData;
          });
        } // if $scope.searchIsEnabled end

        $scope.toggleLeftSidebar = function() {

          $rootScope.showLeftSideBar = ! $rootScope.showLeftSideBar;
          $rootScope.showTroopSideBar = $rootScope.showLeftSideBar;

          $rootScope.showRightSidebar = false;
          $rootScope.showNotifications = false;
          $rootScope.showProfileSidebar = false;
        };

        $scope.toggleProfileSidebar = function() {

          $rootScope.showProfileSidebar = ! $rootScope.showProfileSidebar;
          $rootScope.showNotifications = false;
          $rootScope.showRightSidebar = false;

        };
        $scope.toggleNotificationSidebar = function() {

          $rootScope.showNotifications = ! $rootScope.showNotifications;
          // $rootScope.showRightSidebar = false;
          // $rootScope.showProfileSidebar = false;
        };

        $scope.$on('troop-changed', function() {

          Me.$doneTryingToLoadTroopMember()
          .then(function() {
            return Me.troopMember.$loaded();
          })
          .then(function() {
            $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
          });

        });

        Auth.$loaded()
        .then(function() {

          return Me.$doneTryingToLoadTrooper();
        })
        .then(function() {

          return Me.trooper.$loaded();
        })
        .then(function() {

          return Me.$doneTryingToLoadTroop();
        })
        .then(function() {

          return Me.troop.$loaded();
        })
        .then(function() {

          return Me.$doneTryingToLoadTroopMember();
        })
        .then(function() {

          return Me.troopMember.$loaded();
        })
        .then(function() {

          Me.loadBoard(null);
          $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
        });

      }
    ]
  );
