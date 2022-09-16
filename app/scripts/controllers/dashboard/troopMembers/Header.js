'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TroopMembersHeaderCtrl
 * @description
 * # TroopMembersHeaderCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'TroopMembersHeaderCtrl',
    [
      '$rootScope',
      '$scope',
      '$state',
      '$stateParams',
      '$localStorage',
      'Auth',
      'Me',
      'UAParser',
      'ModalService',
      'SearchFactory',
      'SecurityFactory',
      'API_SERVER_URL',
      'ALGOLIA_SEARCH_KEY',
      function TroopMembersHeaderCtrl(
        $rootScope,
        $scope,
        $state,
        $stateParams,
        $localStorage,
        Auth,
        Me,
        UAParser,
        ModalService,
        SearchFactory,
        SecurityFactory,
        API_SERVER_URL,
        ALGOLIA_SEARCH_KEY
      ) {
        var that = this;

        $scope.searchIsEnabled = ( ( ALGOLIA_SEARCH_KEY !== '' ) || undefined ) ? true : false
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

        $scope.showActionMenu = false;

        $scope.toggleLeftSidebar = function() {

          $rootScope.showLeftSideBar = !$rootScope.showLeftSideBar;
        };
        $scope.showTroopInviteModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/troop-invite.html',
            controller: 'TroopInviteModalCtrl'
          }).then(function(modal) {

            modal.close.then(function(result) {

            });

          });
        };

        $scope.$on('troop-changed', function() {

          $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
        });

        Auth.$loaded().then(function() {

          return Me.$doneRedirecting();
        })
        .catch(function(error) {
          console.log(error)

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

          Me.troopMember.$watch(function() {

            if (
              Me.troopMember
              && Me.troopMember.totalNotifications
            ) {
              $scope.hasNotifications = Me.troopMember.totalNotifications > Me.troopMember.totalReadNotifications;
            }
            else {
              $scope.hasNotifications = false;;
            }
          });

          Me.loadCurrentTroopMember(null);
          $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();

        });




      }
    ]
  );
