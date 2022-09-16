/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

(function() {
    'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:BoardHeaderCtrl
 * @description
 * # BoardHeaderCtrl
 * Controller of the webClientApp
 */
angular
.module('webClientApp')
.controller('BoardHeaderCtrl', BoardHeaderCtrl);

  BoardHeaderCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$state',
    '$stateParams',
    '$localStorage',
    '$timeout',
    '$q',
    'Auth',
    'Me',
    'Nav',
    'TroopApi',
    'TroopLogger',
    'BoardFactory',
    'ModalService',
    'UAParser',
    'SearchFactory',
    'SecurityFactory',
    'API_SERVER_URL',
    'ALGOLIA_SEARCH_KEY',
    'FB_APP',
    'HELP_TROOP_ID'
  ];

  return;

  function BoardHeaderCtrl(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $localStorage,
    $timeout,
    $q,
    Auth,
    Me,
    Nav,
    TroopApi,
    TroopLogger,
    BoardFactory,
    ModalService,
    UAParser,
    SearchFactory,
    SecurityFactory,
    API_SERVER_URL,
    ALGOLIA_SEARCH_KEY,
    FB_APP,
    HELP_TROOP_ID
  ) {

    var logConfig = {
      slug: 'controllers: Header - ',
      path: [ 'controllers', 'dashboard',  'board', 'Header.js']
    };

    var that = this;
    that.unwatchTroopMembers = null;

    $scope.showNotificationMenu = false;
    $scope.showActionMenu = false;
    $scope.Me = Me;
    $scope.view = null;
    $scope.exportUrl = API_SERVER_URL + '/board/export/' + FB_APP + '/';
    $scope.searchIsEnabled = ( ( ALGOLIA_SEARCH_KEY !== '' ) || undefined ) ? true : false;
    $scope.canDisplayMembers = false;
    $scope.memberLength = 0;
    $scope.showCardSettingsGear = false;
    $scope.mobileLink = {'url': 'https://itunes.apple.com/us/app/troop-app/id1025705328?mt=8' };

    if (UAParser.os.name === 'Android') {
      $scope.mobileLink.url = 'https://play.google.com/store/apps/details?id=work.troop.troop';
    }

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

        if( newData !== '' && newData !== null) {

          var myState = $state.current.name.indexOf('home.dashboard.search') === -1 ? 'home.dashboard.search.allboard' : $state.current;
          var boardId;

          if ( Me.currentBoard ) {

            boardId = Me.currentBoard.$id;
          }
          else {

            boardId = $scope.search.lastBoard;
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
            };
        }
      };


      $rootScope.$watch(
        function() {

          return SearchFactory.searchString;
        },
        function (newData, oldData) {

          $scope.search.string = newData;
        }
      );

      $rootScope.$watch(
        function() {

          return SearchFactory.searchResults;
        },
        function (newData, oldData) {

          $scope.search.results = newData;
        }
      );
      $rootScope.$watch(
        function() {

          return SearchFactory.searchLastBoard;
        },
        function (newData, oldData) {

            $scope.search.lastBoard = newData;
        }
      );
    }

    this.init = function() {

      that.getBoardMemberLength();

      if ( that.unwatchTroopMembers ) {
        that.unwatchTroopMembers();
      }

      that.unwatchTroopMembers = Me.troopMembers.$watch(function() {
        that.getBoardMemberLength();
      });


    };

    this.getBoardMemberLength = function() {
      var boardMemberCount = 0;

      Me.troopMembers.$loaded().then(function(){
        return Me.$doneTryingToLoadBoard();
      })
      .then(function(){

      _.each(Me.troopMembers, function(troopMember) {
        if (
          Me.currentBoard
          && troopMember.boards
          && troopMember.boards[Me.currentBoard.$id]
          && ( troopMember.boards[Me.currentBoard.$id].permission !== 'discharged'
          || troopMember.boards[Me.currentBoard.$id].permission !== 'banned' )
        ) {

          boardMemberCount++;
        }

      });

      $scope.memberLength = boardMemberCount;

      });
    };

    this.checkForBoardChats = function() {

      if (
        Me.currentBoard &&
        Me.notifications[Me.troopMember.$id].breakdown &&
        Me.notifications[Me.troopMember.$id].breakdown.boardMessage &&
        Me.notifications[Me.troopMember.$id].breakdown.boardMessage[Me.currentBoard.$id]
      ) {
        var totalNotifications = Me.notifications[Me.troopMember.$id].breakdown.boardMessage[Me.currentBoard.$id].total || 0;
        var totalReadNotifications = Me.notifications[Me.troopMember.$id].breakdown.boardMessage[Me.currentBoard.$id].read || 0;
        $scope.currentUnreadBoardNotificationCount = totalNotifications - totalReadNotifications;
      }
      else {
        $scope.currentUnreadBoardNotificationCount = 0;
      }

    };
    this.showMessageModal = function(message) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/message.html',
        controller: 'MessageModalCtrl'
      }).then(function(modal) {

        modal.scope.message = message;

        modal.scope.accept = function() {

          modal.scope.close();
        };

        modal.close.then(function(result) {

        });

      });
    };
    this.showLeaveBoardModal = function(board) {

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      }).then(function(modal) {

        modal.controller.extraClasses = 'leave-board-modal';
        modal.controller.header = 'Leave Board';
        modal.controller.message =
            'Are you sure you want to leave the "<b>'
            + board.boardName
            + '</b>" board?';
        modal.controller.actionTaken = ' Leave ';
        modal.controller.element = ' Board';


        modal.controller.cancel = function() {
          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          BoardFactory.leaveBoard({
            board: board,
            troopMember: Me.troopMember,
            boardId: board.$id
          })
          .then(function(){
            Me.currentBoard.$destroy();
            Me.currentBoard = null;
            TroopLogger.debug(logConfig, 'showLeaveBoardModal() - nav to avail boards')
            return Me.getFirstBoardId();
          })
          .then(function(resp) {
            modal.controller.closeModal();
            Nav.toMyBoards(
              Me.troop.public,
              Me.troopMember.troopPermission !== 'guest'
            );
          })

        };

        // modal.close.then(function(result) {
        //
        // });

      });
    };

    $scope.toggleLeftSidebar = function() {

      $rootScope.showLeftSideBar = ! $rootScope.showLeftSideBar;

      if (! $rootScope.showLeftSidebar ) {
        $rootScope.showTroopSideBar = $rootScope.showLeftSidebar;
      }
      //$rootScope.showTroopSideBar = $rootScope.showLeftSideBar;

      Me.showRightSidebar[$state.current.name] = false;
      $rootScope.showRightSidebar = false;
      $rootScope.showNotifications = false;
      $rootScope.showProfileSidebar = false;
    };
    $scope.toggleRightSidebar = function() {

      if ( ! Me.showRightSidebar ) {
        Me.showRightSidebar = {};
      }

      // if ($rootScope.showNotifications) {
      //
      //   Me.showRightSidebar[$state.current.name] = true;
      // }
      // else {
      //
      //   Me.showRightSidebar[$state.current.name] = ! Me.showRightSidebar[$state.current.name];
      // }
      Me.showRightSidebar[$state.current.name] = ! Me.showRightSidebar[$state.current.name];
      $rootScope.showRightSidebar = Me.showRightSidebar[$state.current.name];
      // $rootScope.showNotifications = false;
      $rootScope.showProfileSidebar = false;
    };
    $scope.toggleNotificationSidebar = function() {

      $rootScope.showNotifications = ! $rootScope.showNotifications;
      // $rootScope.showRightSidebar = false;
      // $rootScope.showProfileSidebar = false;
    };
    $scope.getMessageType = function(type) {
      var obj = {};
      obj[type] = true;
      return obj;
    };
    $scope.showSettingsModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }


      // edit board
      if (Nav.currentBoardView === 'cards') {
        ModalService.showModal({
          templateUrl: '/views/modal/card-view-settings.html',
          controller: 'CardViewSettingsModalCtrl'
        })
        .then(function(modal) {

        });
      }
      else if (Nav.currentBoardView === 'grid' ) {
        ModalService.showModal({
          templateUrl: '/views/modal/grid-view-settings.html',
          controller: 'GridViewSettingsModalCtrl'
        })
        .then(function(modal) {

        });
      }
      else if (Nav.currentBoardView === 'table' ) {
        ModalService.showModal({
          templateUrl: '/views/modal/table-view-settings.html',
          controller: 'TableViewSettingsModalCtrl as vm'
        })
        .then(function(modal) {

        });
      }
      else if (Nav.currentBoardView === 'tags' ) {
        ModalService.showModal({
          templateUrl: '/views/modal/tags-view-settings.html',
          controller: 'TagsViewSettingsModalCtrl'
        })
        .then(function(modal) {

        });
      }

    };
    $scope.showBoardModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      TroopLogger.debug(logConfig, 'showBoardModal() - action started');

      ModalService.showModal({
        templateUrl: '/views/modal/board.html',
        controller: 'BoardModalCtrl'
      })
      .then(function(modal) {

        TroopLogger.debug(logConfig, 'showBoardModal() - first promise resolved',modal);

        modal.controller.setBoard(Me.currentBoard);
        modal.scope.action = 'edit';

        modal.close.then(function(result) {

        });

      });
    };
    $scope.showBoardInviteModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/board-invite.html',
        controller: 'BoardInviteModalCtrl'
      }).then(function(modal) {

        modal.close.then(function(result) {

        });

      });
    };
    $scope.showDeleteBoardModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      if ( Me.allBoards.length > 1 ) {

        ModalService.showModal({
          templateUrl: '/views/modal/delete.html',
          controller: 'DeleteModalCtrl as vm'
        })
        .then(function(modal) {

          modal.controller.extraClasses = 'archive-board-modal';
          modal.controller.header = 'Delete Board';
          modal.controller.message =
              'Are you sure you want to delete the "<b>'
              + Me.currentBoard.boardName
              + '</b>" board?';
          modal.controller.actionTaken = ' Delete ';
          modal.controller.element = ' Board';


          modal.controller.cancel = function() {
            modal.controller.closeModal();
          };

          modal.controller.remove = function() {

            BoardFactory.archive(Me.currentBoard)
            .then(function() {

              Me.currentBoard.$destroy();
              Me.currentBoard = null;
              TroopLogger.debug(logConfig, 'showDeleteBoardModal() - nav to avail boards');

              return Me.getFirstBoardId();
            })
            .then(function(boardId) {

              return Me.loadBoard(Me.troop.$id, boardId);
            })
            .then(function() {

              var firstVisibleView = Me.currentBoard.getFirstVisibleView();

              Nav.toBoard(
                Me.currentBoard.viewMap[firstVisibleView],
                Me.troop.public,
                Me.troopMember.troopPermission !== 'guest',
                Me.currentBoard.$id
              );
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
      else {
        ModalService.showModal({
          templateUrl: '/views/modal/message.html',
          controller: 'MessageModalCtrl'
        })
        .then(function(modal) {

          modal.controller.header = 'Cannot Delete Board';
          modal.controller.message ='Every troop needs at least one board.';

          modal.controller.cancel = function() {
            modal.controller.closeModal();
          };

          modal.controller.accept = function() {

            modal.controller.closeModal();

          };

        });
      }
    };
    $scope.tryToLeaveBoard = function() {

      var board = Me.currentBoard;

      if (
        Me.troopMember.boards
        && Me.troopMember.boards.hasOwnProperty(board.$id)
        && Me.troopMember.boards[board.$id].permission === 'admin'
      ) {

        var adminCount = 0;

        _.each(Me.troopMembers, function(troopMember) {

          if (
            troopMember.boards
            && troopMember.boards.hasOwnProperty(board.$id)
            && troopMember.boards[board.$id].permission === 'admin'
          ) {
            adminCount++;
          }

        });

        if ( adminCount > 1 ) {
          that.showLeaveBoardModal(board);
        }
        else {
          that.showMessageModal('Please promote another member to moderator before you leave this board.');
        }

      }
      else {
        that.showLeaveBoardModal(board);
      }
    };
    $scope.showCardModal = function(action) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/card.html',
        controller: 'CardModalCtrl as vm'
      }).then(function(modal) {

        modal.controller.action = action;

        modal.close.then(function(result) {

        });

      });
    };
    $scope.navBack = function() {

      var view = Nav.lastBoardView;

      Nav.toBoard(
        view,
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        Me.currentBoard.$id,
        $stateParams.selectedTagName
      );

      // if ( Nav.history.length > 1 ) {
      //
      //   Nav.back($stateParams.selectedTagName);
      // }
      // else {
      //
      //   var firstVisibleView = Me.currentBoard.getFirstVisibleView();
      //
      //   Nav.toBoard(
      //     Me.currentBoard.viewMap[firstVisibleView],
      //     Me.troop.public,
      //     Me.troopMember.troopPermission !== 'guest',
      //     Me.currentBoard.$id,
      //     $stateParams.selectedTagName
      //   );
      // }

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
        })
        .then(function(modal) {

          modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

          modal.close.then(function(result) {

          });

        });
      }

    }

    // $scope.$on('detail-card-view-loaded', function(event, args) {
    //
    //   //console.log(Me.currentBoardCards)
    //   $scope.card = Me.currentBoardCards.$getRecord(args);
    //   //console.log($scope.card)
    //   that.prevView = $scope.view;
    //   $scope.view = 'detail-card';
    // });
    //
    // $scope.$on('multi-card-view-loaded', function() {
    //   that.prevView = $scope.view;
    //   $scope.view = 'multi-card';
    // });
    //
    // $scope.$on('grid-view-loaded', function() {
    //   that.prevView = $scope.view;
    //   $scope.view = 'grid';
    // });
    //
    // $scope.$on('table-view-loaded', function() {
    //   that.prevView = $scope.view;
    //   $scope.view = 'table';
    // });
    //
    // $scope.$on('card-list-view-loaded', function() {
    //   that.prevView = $scope.view;
    //   $scope.view = 'list';
    // });
    //
    // $scope.$on('list-sort-view-loaded', function() {
    //   that.prevView = $scope.view;
    //   $scope.view = 'list-view';
    // });
    //
    // $scope.$on('board-chat-view-loaded', function() {
    //   that.prevView = $scope.view;
    //   $scope.view = 'chat';
    // });

    $scope.$on('troop-member-changed', function() {

      // Me.troopMember
      //   .$loaded()
      //   .then(function(){
      //
          // console.log(' ');
          // console.log('Me.troop.$id',Me.troop.$id);
          // console.log('Me.troopMember.$id',Me.troopMember.$id);
          // console.log('***** canDisplayMembers',SecurityFactory.membersDisplayCheck());
          // console.log(' ');

          if (
            //( Me.troop.$id === DEMO_TROOP_ID )
            Me.troop.$id === HELP_TROOP_ID
          ) {
            $rootScope.showRightSidebar = false;
            $rootScope.showNotifications = false;
          }

          $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();
      //  });

    });

    $scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
      that.getBoardMemberLength();
    });

    $rootScope.$on('board-changed',function(){
      that.getBoardMemberLength();
    });


    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

      $scope.view = Nav.currentBoardView;

      if (
        toState.name === 'home.dashboard.board.cards'
        || toState.name === 'home.dashboard.board.grid'
        || toState.name === 'home.dashboard.board.table'
        || toState.name === 'home.dashboard.board.tags'
      ) {
        if (
            ( Me.currentBoard.createdByMemberId === Me.troopMember.$id ) ||
            ( Me.troopMember.boards[Me.currentBoard.$id].permission === 'admin' )
        ){
          $scope.showCardSettingsGear = true;
        }
        else {
          $scope.showCardSettingsGear = false;
        }

      }
      else {
        $scope.showCardSettingsGear = false;
      }
    });


    $scope.$on('$destroy', function() {

      if ( that.unwatchTroopMembers ) {

        that.unwatchTroopMembers();
      }
    });

    Auth.$loaded()
    .then(function() {

      return Me.$doneTryingToLoadTrooper();
    })
    .then(function() {

      return Me.trooper.$loaded();
    })
    .then(function() {

      // clear current troop member ( 1-1 chat guy )
      Me.loadCurrentTroopMember(null);

      return Me.$doneTryingToLoadBoard();
    })
    .then(function() {

      return Me.currentBoard.$loaded();
    })
    .then(function() {

      return Me.$doneTryingToLoadNotifications();
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
      that.init();
      $scope.canDisplayMembers = SecurityFactory.membersDisplayCheck();

    });




  }

})(); // end of file
