'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:BoardsHeaderCtrl
 * @description
 * # BoardsHeaderCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
    'BoardsHeaderCtrl',
    [
      '$rootScope',
      '$scope',
      '$state',
      '$stateParams',
      '$localStorage',
      'BoardFactory',
      'CardFactory',
      'Auth',
      'Me',
      'Nav',
      'JSZip',
      'ModalService',
      'SearchFactory',
      'SecurityFactory',
      'API_SERVER_URL',
      'ALGOLIA_SEARCH_KEY',
      function BoardsHeaderCtrl(
        $rootScope,
        $scope,
        $state,
        $stateParams,
        $localStorage,
        BoardFactory,
        CardFactory,
        Auth,
        Me,
        Nav,
        JSZip,
        ModalService,
        SearchFactory,
        SecurityFactory,
        API_SERVER_URL,
        ALGOLIA_SEARCH_KEY
      ) {
        var that = this;

        $scope.showActionMenu = false;
        $scope.searchText = '';

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

            if( newData ) {

                var myState = $state.current.name.indexOf('home.dashboard.search') === -1
                                ? 'home.dashboard.search.allboard'
                                : $state.current;

                if ( Me.currentBoard ) {

                  var boardId = Me.currentBoard.$id;
                }
                else {

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

        }
        // Private Functions

        this.onError = function(error) {

          $scope.err = error;

        };

        this.readZipFile = function(file) {

          var reader = new FileReader();
          reader.onload = function(e) {

            var arrayBuffer = reader.result;

            var zipFile = JSZip(arrayBuffer);

            BoardFactory.importBoard({
              jsZipFile: zipFile,
              troopId: Me.troop.$id,
              troopMemberId: Me.troopMember.$id,
              createdByUserId: Me.trooper.$id
            })
            .then(function(board) {

              if ( Me.modalIsOn ) {

                return;
              }

              ModalService.showModal({
                templateUrl: '/views/modal/board-import.html',
                controller: 'BoardImportModalCtrl'
              })
              .then(function(modal) {

                $scope.modal = modal;

                modal.scope.setBoard(board);

                modal.close.then(function(result) {

                  Me.loadBoard(Me.troop.$id, board.$id)
                  .then(function() {

                    return Me.currentBoard.$loaded();
                  })
                  .then(function() {

                    var firstVisibleView = Me.currentBoard.getFirstVisibleView();

                    Nav.toBoard(
                      Me.currentBoard.viewMap[firstVisibleView],
                      Me.troop.public,
                      Me.troopMember.troopPermission !== 'guest',
                      Me.currentBoard.$id
                    );

                  });


                });

              });

            })
            .catch(function(error) {

              console.log(error);
            });


          };

          reader.readAsArrayBuffer(file);

        };

        $scope.toggleLeftSidebar = function() {

          $rootScope.showLeftSideBar = !$rootScope.showLeftSideBar;
        };

        $scope.searchBlur = function() {

          if ( ! $scope.searchText ) {
            $scope.showLabel('search');
          }

        };

        $scope.uploadFiles = function(file) {

          $scope.f = file;
          if (file && !file.$error) {


            that.readZipFile(file);

          }
        }

        $scope.showBoardModal = function(action) {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/board.html',
            controller: 'BoardModalCtrl'
          })
          .then(function(modal) {

            modal.scope.action = action;

            modal.close.then(function(result) {

            });

          });
        };

        $scope.$on('troop-changed', function() {

          $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
        });

        Auth.$loaded().then(function() {

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
          Me.loadBoard(null);


        });

      }
    ]
  );
