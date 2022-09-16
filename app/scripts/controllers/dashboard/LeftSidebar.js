/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
/* jshint -W109 */

(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:LeftSidebarCtrl
   * @description
   * # LeftSidebarCtrl
   * Controller of the webClientApp
   */
  angular.module('webClientApp')
  .controller('LeftSidebarCtrl', LeftSidebarCtrl);

  LeftSidebarCtrl.$inject = [
    '$rootScope',
    '$scope',
    '$state',
    '$localStorage',
    '$firebaseArray',
    '$q',
    'Me',
    'Nav',
    'Ref',
    'Auth',
    'ModalService',
    'BoardFactory',
    'TroopApi',
    'TroopFactory',
    'TroopMemberFactory',
    'UAParser',
    'SearchFactory',
    'SecurityFactory',
    '$timeout',
    'agLogger',
    'TroopLogger',
    'DEMO_TROOP_ID',
    'HELP_TROOP_ID'
  ];

  function LeftSidebarCtrl(
    $rootScope,
    $scope,
    $state,
    $localStorage,
    $firebaseArray,
    $q,
    Me,
    Nav,
    Ref,
    Auth,
    ModalService,
    BoardFactory,
    TroopApi,
    TroopFactory,
    TroopMemberFactory,
    UAParser,
    SearchFactory,
    SecurityFactory,
    $timeout,
    agLogger,
    TroopLogger,
    DEMO_TROOP_ID,
    HELP_TROOP_ID
  ) {

    var logConfig = {
      slug: 'controller: LeftSidebar - ',
      path: [ 'controllers', 'dashboard', 'core', 'LeftSidebar.js']
    };

    var vm = this;
    vm.troopMembers = [];
    vm.troopPermissionMap = {
      admin: 'Full Member',
      member: 'Guest'
    };
    vm.demoTroopId = DEMO_TROOP_ID;
    vm.helpTroopId = HELP_TROOP_ID;


    vm.closeDirectMessage = closeDirectMessage;
    vm.navToChat = navToChat;
    vm.navToTroopMembers = navToTroopMembers;
    vm.navToAffiliateDashboard = navToAffiliateDashboard;


    var that = this;
    this.currentTroopId = null;
    this.cardView = 'cards';
    this.unwatchAllBoards = null;
    this.unwatchTroopMember = null;
    this.unwatchTroopMembers = null;


    $scope.data = {
      boardHeaderSelected: false,
      troopMemberHeaderSelected: false,
      troopAdminHeaderSelected: false,
    };
    $scope.isLoading = true;
    $scope.showTroopList = false;
    $scope.showTrooperMenu = false;
    $scope.fetchingTroopMembers = false;

    $scope.Me = Me;
    $scope.err = null;
    $scope.storage = $localStorage;
    $scope.showModal = true;


    $scope.troopJustMembers = [];
    $scope.troopAdmins = [];
    $scope.boards = [];
    $scope.availBoards = [];

    this.orderBoards = function(troopMemberBoards) {

      // agLogger.info('this.orderBoards()', Me.troop.$id );
      // agLogger.info('Me.troopMember.boards', $.extend({}, Me.troopMember.boards) );
      TroopLogger.debug(logConfig, 'this.orderBoards()', Me.troop.$id);
      TroopLogger.debug(logConfig, 'Me.troopMember.boards', $.extend({}, Me.troopMember.boards));

      if ( ! Me.allBoards ) {
        $scope.availBoards = [];
        return false;
      }

      // $timeout(function(){
      /// ^  this is not the cleanest solution but it works with no extra delay

      if ( ! troopMemberBoards && Me.troopMember ) {

          troopMemberBoards = Me.troopMember.boards;

      }

      var boards = [];
      if ( ( ! troopMemberBoards ) || troopMemberBoards.length === 0) {
        $scope.availBoards = [];
        $scope.boards = boards;
        return false;
      }

      $scope.availBoards = _.filter(Me.allBoards, function(board) {

        return board.private === false || Me.troopMember.boards[board.$id];
      });

      _.each(troopMemberBoards, function(obj, boardId) {

        var board = Me.allBoards.$getRecord(boardId);
        if (board) {
          boards.push(board);
        }

      });

      $scope.boards = _.sortBy(boards, function (i) {

        if (
          Me.notifications
          && Me.notifications[Me.troopMember.$id]
          && Me.notifications[Me.troopMember.$id].breakdown
          && Me.notifications[Me.troopMember.$id].breakdown.boardMessage
          && Me.notifications[Me.troopMember.$id].breakdown.boardMessage[i.$id]
        ) {
          i.totalNotifications = Me.notifications[Me.troopMember.$id].breakdown.boardMessage[i.$id].total;
          i.totalReadNotifications = Me.notifications[Me.troopMember.$id].breakdown.boardMessage[i.$id].read;
          i.totalUnReadNotifications = i.totalNotifications - i.totalReadNotifications;
          i.hasNotfications = i.totalUnReadNotifications > 0;
        }

        return i.boardName.toLowerCase();
      });

      if (Me.troopMember.troopPermission === 'guest') {

          $scope.boards = $scope.availBoards =  _.filter(Me.allBoards, function(board) {

            return board.private === false;
          });
        }

      ///  end of $timeout
      ///  this is not the cleanest solution but it works with no extra delay
      // });

      // agLogger.info('result of this.orderBoards()', $.extend({}, $scope.boards) );
    };

    $scope.membersDisplayCheck = SecurityFactory.membersDisplayCheck;
    $scope.showTroopMemberChatModal = function(member) {

      if ( Me.modalIsOn ) {

        return;
      }

      if (member.$id === Me.troopMember.$id) {
        return false;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/troop-member-chat.html',
        controller: 'TroopMemberChatModalCtrl'
      }).then(function(modal) {

        modal.controller.setMember(member);

        modal.close.then(function(result) {

        });

      });
    }
    $scope.showTroopMemberProfileModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      if (! Me.firebaseUser.isAnonymous) {
        ModalService.showModal({
          templateUrl: '/views/modal/troop-member-profile.html',
          controller: 'TroopMemberProfileModalCtrl'
        })
        .then(function(modal) {

          modal.controller.setTroopMember(Me.troopMember);

        });
      }
      else {
        ModalService.showModal({
          templateUrl: '/views/modal/public-troop-join.html',
          controller: 'PublicTroopJoinModalCtrl as vm'
        }).then(function(modal) {

          modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

          modal.close.then(function(result) {

          });

        });
      }


    };

    $scope.toggleMobileProfile = function(clickEvent) {
      $scope.showMobile = !$scope.showMobile;
      //
      // $timeout(function() {
      //   var parentElm = angular.element(clickEvent.target.parentNode);
      //   // parentElm.find('ul').css('width', Me.screen.width)
      //   // parentElm.find('ul').css('height', Me.screen.height + 10)
      //
      // }, 100);
    }

    $scope.toggleSideBar = function() {
      if (Me.firebaseUser.isAnonymous) {
        $scope.showPublicTroopJoinModal();
      }
      else{
        $scope.$root.showTroopSideBar = ! $scope.$root.showTroopSideBar;
      }
    }

    $scope.showAccountSettingsModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/account-settings.html',
        controller: 'AccountSettingsModalCtrl'
      }).then(function(modal) {

        //modal.controller.setAccountSettings(Me.troopMember);

        modal.close.then(function(result) {

        });
      });

    }

    $scope.showTroopModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/troop.html',
        controller: 'TroopModalCtrl'
      }).then(function(modal) {

        modal.controller.setTroop(Me.troop);
        modal.close.then(function(result) {

        });
      });
    };
    $scope.showTroopInviteModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/troop-invite.html',
        controller: 'TroopInviteModalCtrl as vm'
      });

    };
    $scope.showBoardModal = function(action) {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/board.html',
        controller: 'BoardModalCtrl'
      }).then(function(modal) {

        modal.scope.action = action;

        modal.close.then(function(result) {

        });
      });
    };
    $scope.showPublicTroopShareModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/public-troop-share.html',
        controller: 'PublicTroopShareModalCtrl as vm'
      }).then(function(modal) {

        modal.close.then(function(result) {

        });

      });

    };
    $scope.showPublicTroopJoinModal = function() {

      ModalService.showModal({
        templateUrl: '/views/modal/public-troop-join.html',
        controller: 'PublicTroopJoinModalCtrl as vm'
      }).then(function(modal) {

        modal.controller.setMessage('Log in or Sign up to join the community. Members can chat, add notes, create cards and boards, and much more.');

        modal.close.then(function(result) {

        });

      });
    };
    $scope.logout = function() {
      Me.stopMonitoringConnection();
      Me.freeMe();
      Auth.logout();
    };
    $scope.switchBoard = function(board) {

      if (
        Me.currentBoard
        && ( board.$id === Me.currentBoard.$id )
      ) {

        var view = Me.currentBoard.getFirstVisibleView();
        if (Nav.currentBoardView !== 'card') {
          view = Nav.currentBoardView;
        }
        else if (Nav.currentBoardView === 'card' ) {
          view = Nav.lastBoardView;
        }

        Nav.toBoard(
          view,
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          Me.currentBoard.$id
        );

        return false;
      }

      if ( SearchFactory ) {
        // errase search field
        SearchFactory.searchString = null;
        SearchFactory.searchResults = {
          all: null,
          curr: null,
          chat: null
        };
        SearchFactory.searchLastBoard = board.$id;
      }



      Me.currentTagFilter = null;

      Me.loadBoard(board.troopId, board.$id)
      .then(function waitForBoardToLoad() {

        return Me.currentBoard.$loaded();
      })
      .then(function() {

        var view = Nav.currentBoardView;

        if (view === 'card') {
          view = Nav.lastBoardView;
        }

        if ( ! Me.currentBoard.viewSettings[Nav.viewSettingsHash[view]].visible ) {
          view = 'cards';
        }


        Nav.toBoard(
          Nav.navHash[view],
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          Me.currentBoard.$id
        );

        //console.log('broadcast event');
        $rootScope.$broadcast('board-changed');
      })
      .catch(function brokenDreamCatcher(error) {

        TroopLogger.error(logConfig, 'switchBoard - loadBoard', error);
      });




      // if (
      //   Me.notifications[Me.troopMember.$id]
      //   && Me.notifications[Me.troopMember.$id].breakdown
      //   && Me.notifications[Me.troopMember.$id].breakdown.boardMessageNotifications
      //   && Me.notifications[Me.troopMember.$id].breakdown.boardMessage[board.$id]
      //   && Me.notifications[Me.troopMember.$id].breakdown.boardMessage[board.$id].unread
      // ) {
      //   that.cardView = 'chat';
      // }




      // $state.go('home.dashboard.board.' + that.cardView, { boardId: board.$id });


    };
    $scope.navToTroopMember = function(troopMemberId) {

      if (Me.troopMember.troopPermission === 'guest'){
        $scope.showPublicTroopJoinModal();
        return false;
      }

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

      if(SearchFactory){
        // errase search field
        SearchFactory.searchString = null;
        SearchFactory.searchResults = {
          all:null,
          curr:null,
          chat:null
        };
        SearchFactory.searchLastBoard = null;
      }

      Nav.toMemberChat(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest',
        troopMemberId
      );
      // $state.go('home.dashboard.troopMember.chat', { troopMemberId: troopMemberId });

    };
    $scope.showLeaveTroopMemberModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      })
      .then(function(modal) {

        modal.controller.extraClasses = 'remove-troop-member-modal';
        modal.controller.header = 'Warning';
        modal.controller.message = 'You are about to permanently leave this Troop. Are you sure?';
        modal.controller.actionTaken = ' Leave ';
        modal.controller.element = ' Troop';

        modal.controller.cancel = function() {
          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          TroopApi.removeFromTroop({
            uid: Me.troopMember.userId,
            memberId: Me.troopMember.$id,
            troopId: Me.troopMember.troopId,
            troopPermission: 'discharged'
          })
          .then(function() {

            var firstTroop = Me.getFirstTroop();
            Me.switchToTroop(firstTroop.troopId);
            modal.controller.closeModal();

          })
          .catch(function(error) {

            console.log(error);
          });

        };


      });
    };
    $scope.showDeleteTroopMemberModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      })
      .then(function(modal) {

        modal.controller.extraClasses = 'remove-troop-member-modal';
        modal.controller.header = 'Warning';
        modal.controller.message = 'You are about to delete this Troop. Are you sure?';
        modal.controller.actionTaken = ' Delete ';
        modal.controller.element = ' Troop'

        modal.controller.cancel = function() {

          modal.controller.closeModal();
        };

        modal.controller.remove = function() {

          var troopsLength = _.size(_.filter(Me.troops, function(value) {

            if (
              Me.trooper.troops
              && Me.trooper.troops[value.$id].troopPermission !== 'discharged'
              && Me.trooper.troops[value.$id].troopPermission !== 'banned'
            ) {

              return true;
            }
          }))

          if (troopsLength > 1) {

            TroopFactory.archive(Me.troop)
            .then(function(res) {

              var firstTroop = Me.getFirstTroop();

              Me.switchToTroop(firstTroop.troopId);
              modal.controller.closeModal();
            })
            .catch(function(error) {

              console.log(error);
            });
          }
          else {

            modal.controller.closeModal();

            ModalService.showModal({
              templateUrl: '/views/modal/message.html',
              controller: 'MessageModalCtrl'
            })
            .then(function(modal) {

              modal.scope.header = "One Troop";

              modal.scope.message = "Sorry, you cannot delete this troop. You have to have at least one troop.";

              modal.scope.accept = function() {

                modal.scope.close();
              };


            });
          }

        };



      });
    };
    $scope.showJhSettings = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/konami.html',
        controller: 'KonamiModalCtrl'
      });
    }
    $scope.goToBoards = function() {
      if ( ! $rootScope.readOnlyMode ) {
        Nav.toBoards(
          Me.troopMember.troopPermission === 'guest' ? 'mine' : 'available',
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest'
        );

        $scope.clearSearchInput();
      }
    };

    $scope.clearSearchInput = function(){

      if(SearchFactory){
        // errase search field
        SearchFactory.searchString = null;
        SearchFactory.searchResults = {
          all:null,
          curr:null,
          chat:null
        };
        SearchFactory.searchLastBoard = null;
      }

    };


    activate();

    return;

    function activate() {

      // $scope.$on('card-list-view-loaded', function() {
      //
      //   that.cardView = 'list';
      // });
      // $scope.$on('multi-card-view-loaded', function() {
      //
      //   that.cardView = 'cards';
      // });
      // $scope.$on('detail-card-view-loaded', function() {
      //
      //   that.cardView = 'cards';
      // });
      // $scope.$on('board-chat-view-loaded', function() {
      //
      //   that.cardView = 'chat';
      // });
      $scope.$on('notification', function(event, data) {

        if (
          data
          && data.notification
          && data.notification.boardId
          && Me.notifications[Me.troopMember.$id]
          && Me.notifications[Me.troopMember.$id].breakdown
          && Me.notifications[Me.troopMember.$id].breakdown.boardMessage
          && Me.notifications[Me.troopMember.$id].breakdown.boardMessage[data.notification.boardId]
        ) {

          that.orderBoards();
        }

        if (
          data
          && data.notification
          && data.notification.fromMemberId
          && Me.notifications[Me.troopMember.$id]
          && Me.notifications[Me.troopMember.$id].breakdown
          && Me.notifications[Me.troopMember.$id].breakdown.directMessage
          && Me.notifications[Me.troopMember.$id].breakdown.directMessage[data.notification.fromMemberId]
        ) {

          sortTroopMembers();
        }

      });

      $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {

        $scope.data.boardHeaderSelected = (
          ( toState.name.indexOf('dashboard.boards.mine') !== -1 )
          || ( toState.name.indexOf('dashboard.boards.available') !== -1 )
        );

        $scope.data.troopAdminHeaderSelected = (
          ( toState.name.indexOf('dashboard.troopMembers.list') !== -1 )
          && ( 'admin' === toParams.permission )
        );

        $scope.data.troopMemberHeaderSelected = ( toState.name.indexOf('dashboard.troopMembers.list') !== -1 );


        if (Me.screen.size === 'mobile') {
          $rootScope.showLeftSideBar = false;
        }
        else {
          $rootScope.showLeftSideBar = true;
        }

        that.cardView = Nav.currentBoardView;

        if (that.cardView === 'card') {
          that.cardView = 'cards';
        }

      });

      Auth.$loaded()
      .then(function waitingForRedirecting() {
        // agLogger.info('Auth.$loaded()');

        return Me.$doneRedirecting();
      })
      .catch(function catchSignIn(error) {

        if ( error && error.code ) {

          switch (error.code) {

            case 'SIGNING_IN':
              // continue loading if signing in
              return this;

            default:
              agLogger.error(error);
              break;
          }
        }

        // otherwise skip loading
        return $q.reject(error);
      })
      .then(function waitingForTrooperToLoad() {

        // agLogger.info('Me.$doneRedirecting()');
        return Me.trooper.$loaded();
      })
      .then(function tryToLoadTroop() {


        // agLogger.info('Me.trooper.$loaded()');
        return Me.$doneTryingToLoadTroop();
      })
      .then(function waitingForTroopToLoad() {

        // agLogger.info('Me.$doneTryingToLoadTroop()');
        return Me.troop.$loaded();
      })
      .then(function tryToLoadTroopMember() {

        // agLogger.info('Me.troop.$loaded()');
        return Me.$doneTryingToLoadTroopMember();
      })
      .then(function waitingForTroopMemberToLoad() {

        // agLogger.info('Me.$doneTryingToLoadTroopMember()');
        return Me.troopMember.$loaded();
      })
      .then(function waitingForAllBoardsToLoad() {

        if (
          ( ! Me.firebaseUser.isAnonymous )
          && ( ! Me.firebaseUser.email )
        ) {
          showLinkModal();
        }

        // agLogger.info('Me.troopMember.$loaded()');
        return Me.allBoards.$loaded();
      })
      .then(function initializeSidebar() {


        // agLogger.info('Me.allBoards.$loaded()');
        init();

        $scope.boardSortableOptions = {
          //disabled: Me.troopMember.boards[Me.currentBoard.$id].permission !== 'admin',
          //delay: mobile ? 100 : 0,
          dropSort: false,
          dropAdd: false,
          //dropRemove: false,
          dropUpdate: false,
          dropRevert: true,
          group: 'card-list',
          handle: '.fake-handle',
          //draggable: '.card',
          //scrollSensitivity: 220,
          onEnd: function (/**Event*/evt) {

          }
        };


        $scope.$on('troop-changed', function() {
          // agLogger.info('troop-changed');

          init();
        });

      })
      .catch(function brokenDreamCatcher(error) {
        // agLogger.error('Loading sidebar', error);
      });

    }

    function init() {

      TroopLogger.debug(logConfig, 'init');

      $scope.showMembers = false;

      initBoards();

      // members (PLURAL)
      initMembers();

      initMember();

      $scope.isLoading = false;
    }

    function initBoards() {
      TroopLogger.debug(logConfig, 'initBoards');

      if (that.unwatchAllBoards) {

        that.unwatchAllBoards();
        that.unwatchAllBoards = null;
      }

      Me.$doneTryingToLoadAllBoards()
      .then(function waitForAllBoardsToLoad() {
        TroopLogger.debug(logConfig, 'waitForAllBoardsToLoad()');
        return Me.allBoards.$loaded();
      })
      .then(function sortAndWatchBoards() {
        TroopLogger.debug(logConfig, 'sortAndWatchBoards()', Me.allBoards);
        that.orderBoards();

        if ( ! that.unwatchAllBoards ) {
          that.unwatchAllBoards = Me.allBoards.$watch(function(event) {
            // agLogger.info('Me.allBoards.$watch()', event);

             that.orderBoards();

            switch (event.event) {

              case 'child_changed':
              // agLogger.info(Me.allBoards.$getRecord(event.key));
              break;
            }

          });
        }
      });



    }

    function initMembers() {
      TroopLogger.debug(logConfig, 'initMembers');

      $scope.fetchingTroopMembers = false;

      if (that.unwatchTroopMembers) {

        that.unwatchTroopMembers();
        that.unwatchTroopMembers = null;
      }

      Me.$doneTryingToLoadTroopMembers()
      .then(function waitForTroopMembersToLoad() {
        return Me.troopMembers.$loaded();
      })
      .then(function sortAndWatchTroopMembers() {

        TroopLogger.debug(logConfig, 'initMembers - sortAndWatchTroopMembers');

        sortTroopMembers();

        if ( ! that.unwatchTroopMembers ) {

          that.unwatchTroopMembers = Me.troopMembers.$watch(function(event) {

            TroopLogger.debug(logConfig, 'initMembers - Me.troopMembers.$watch', event);

            sortTroopMembers();
          });
        }
      });


    }

    function initMember() {
      TroopLogger.debug(logConfig, 'initMember');

      if (that.unwatchTroopMember) {

        that.unwatchTroopMember();
        that.unwatchTroopMember = null;
      }

      Me.$doneTryingToLoadTroopMember()
      .then(function waitForTroopMemberToLoad() {

        return Me.troopMember.$loaded();
      })
      .then(function watchForTroopMemberUpdates() {

        if ( ! that.unwatchTroopMember ) {

          var oldTroopMemberBoards = Me.troopMember.boards;

          that.unwatchTroopMember = Me.troopMember.$watch(function(event) {

            TroopLogger.debug(logConfig, 'LeftSidebar - Me.troopMember.watch',  Me.troopMember);
            if (
              Me.troopMember.troopPermission === 'discharged'
              || Me.troopMember.troopPermission === 'banned'
            ) {

                TroopLogger.debug(logConfig, 'LeftSidebar - Me.troopMember.$watch is banned or discharged', Me.troopMember);

                Me.switchToTroop(Me.getFirstTroop().troopId);
              }

            if ( ! _.isEqual(oldTroopMemberBoards, Me.troopMember.boards) ) {
              // agLogger.info('oldTroopMemberBoards !== Me.troopMember.boards', _.keys(oldTroopMemberBoards), _.keys(Me.troopMember.boards));

              that.orderBoards();
            }

          });
        }
      });

    }

    function sortTroopMembers() {
      TroopLogger.debug(logConfig, 'sortTroopMembers');
      $scope.fetchingTroopMembers = true;

      vm.troopMembers = _.sortBy(Me.troopMembers, function (member) {

        if (
          Me.notifications
          && Me.notifications[Me.troopMember.$id]
          && Me.notifications[Me.troopMember.$id].breakdown
          && Me.notifications[Me.troopMember.$id].breakdown.directMessage
          && Me.notifications[Me.troopMember.$id].breakdown.directMessage[member.$id]
        ) {
          member.totalNotifications = Me.notifications[Me.troopMember.$id].breakdown.directMessage[member.$id].total;
          member.totalReadNotifications = Me.notifications[Me.troopMember.$id].breakdown.directMessage[member.$id].read;
          member.totalUnReadNotifications = member.totalNotifications - member.totalReadNotifications;
          member.hasNotfications = member.totalUnReadNotifications > 0;
        }

        if (
          Me.troopMember.hasOwnProperty('directMessaging')
          && !! Me.troopMember.directMessaging[member.$id]
        ) {
          member.isDirectMessaging = true;
        }
        else {
          member.isDirectMessaging = false;
        }

        if (member.devices) {
          $.each(member.devices, function(val, deviceId) {
            if (val) {
              member.present = true;
              return false;
            }
          });
        }

        if ( ! member.name ) {
          // agLogger.warning('missing first name');
          // agLogger.info(i);
        }

        return (member.name || '').toLowerCase();
      });

      vm.troopMembers = _.filter(vm.troopMembers, function(member) {

        return member.isDirectMessaging;
      });

    }

    function showLinkModal() {
      TroopLogger.debug(logConfig, 'showLinkModal');

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/link-accounts.html',
        controller: 'LinkAccountsModalCtrl as vm'
      })
      .then(function(modal) {

        modal.scope.accept = function() {

          modal.scope.close();
        };

      });
    }

    function closeDirectMessage($event, memberId) {

      TroopLogger.debug(logConfig, 'closeDirectMessage');
      $event.stopPropagation();

      Me.troopMember.directMessaging[memberId] = false;
      Me.troopMember.$save();
    }

    function navToChat($event, board) {

      TroopLogger.debug(logConfig, 'navToChat', $event, board);

      $event.preventDefault();
      $event.stopPropagation();

      if (
        board.hasOwnProperty('viewSettings')
        && board.viewSettings.hasOwnProperty('chat')
        && board.viewSettings.chat.visible
      ) {

        Nav.toBoardChat(
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          board.$id
        );
      }



    }

    function navToTroopMembers() {

      $scope.clearSearchInput();
      Nav.toAdminList(
        Me.troop.public,
        Me.troopMember.troopPermission !== 'guest'
      );
    }

    function navToAffiliateDashboard() {

      Nav.toAffiliateDashboard();
    }
  }

})();
