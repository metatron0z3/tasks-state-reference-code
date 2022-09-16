/* jshint strict: true */
/* jshint -W014 */

'use strict';

angular.module('webClientApp')

  .config(compileConfig)

  /**
   * Adds a special `whenAuthenticated` method onto $stateProvider. This special method,
   * when called, invokes Auth.$requireSignIn() service (see Auth.js).
   *
   * The promise either resolves to the authenticated user object and makes it available to
   * dependency injection (see AccountCtrl), or rejects the promise if user is not logged in,
   * forcing a redirect to the /login page
   */
  .config([
    '$stateProvider',
    'agLoggerProvider',
    'SECURED_ROUTES',
    function(
      $stateProvider,
      agLoggerProvider,
      SECURED_ROUTES
    ) {
      // credits for this idea: https://groups.google.com/forum/#!msg/angular/dPr9BpIZID0/MgWVluo_Tg8J
      // unfortunately, a decorator cannot be use here because they are not applied until after
      // the .config calls resolve, so they can't be used during route configuration, so we have
      // to hack it directly onto the $stateProvider object
      $stateProvider.whenAuthenticated = whenAuthenticated;
      $stateProvider.whenAuthenticatedOrAutoAnonAuth = whenAuthenticatedOrAutoAnonAuth;
      $stateProvider.whenHasBoard = whenHasBoard;

      var logConfig = {
        slug: 'core:       routes - ',
        path: [ 'core', 'routes.js']
      };

      return;

      function whenHasBoard(state, route) {


        route.resolve = route.resolve || {};
        route.resolve.checkForBoard = [
          '$stateParams',
          '$q',
          'Nav',
          'Me',
          'TroopLogger',
          function(
            $stateParams,
            $q,
            Nav,
            Me,
            TroopLogger
          ) {

            TroopLogger.debug(logConfig, 'whenHasBoard()');
            if (
              ( ! $stateParams )
              || ( ! $stateParams.boardId )
            ) {
              Nav.toAvailableBoards(false, true);
              return $q.reject({ code: 'MISSING_ROUTE_PARAM_BOARD_ID' });
            }

            var deferred = $q.defer();

            Me.$doneRedirecting()
            .catch(function redirectingErrors(error) {

              if ( error && error.code ) {

                switch (error.code) {

                  case 'SIGNING_IN':
                    // continue loading if signing up.
                    break;

                  default:
                    return $q.reject(error);
                }
              }
              else {
                return $q.reject(error);
              }
            })
            .then(function tryToLoadTrooper() {

              TroopLogger.debug(logConfig, route.name + ' - tryToLoadTrooper');
              return Me.$doneTryingToLoadTrooper();
            })
            .then(function waitForTrooperToLoad() {

              TroopLogger.debug(logConfig, route.name + ' - waitForTrooperToLoad');
              return Me.trooper.$loaded();
            })
            .then(function tryToLoadTroop() {

              TroopLogger.debug(logConfig, route.name + ' - tryToLoadTroop');
              return Me.$doneTryingToLoadTroop();
            })
            .then(function waitingForTroopToLoad() {

              TroopLogger.debug(logConfig, route.name + ' - waitingForTroopToLoad');
              return Me.troop.$loaded();
            })
            .then(function tryToLoadCurrentBoard() {

              TroopLogger.debug(logConfig, route.name + ' - tryToLoadCurrentBoard');

              if ( ! Me.currentBoard ) {

                return Me.loadBoard(Me.troop.$id, $stateParams.boardId);
              }
              else if ( Me.currentBoard.$id !== $stateParams.boardId) {

                return Me.loadBoard(Me.troop.$id, $stateParams.boardId);
              }
              else {

                return Me.$doneTryingToLoadBoard();
              }

            })
            .then(function waitForBoardToLoad() {

              TroopLogger.debug(logConfig, route.name + ' - waitForBoardToLoad');
              return Me.currentBoard.$loaded();
            })
            .then(function checkIfBoardArchived() {

              TroopLogger.debug(logConfig, route.name + ' - checkIfBoardArchived:', !!Me.currentBoard.archived);
              if ( Me.currentBoard.archived ) {
                var error = { code: 'BOARD_ARCHIVED' };
                TroopLogger.info(logConfig, route.name + ' - checkForBoard', error);
                deferred.reject(error);
                Nav.toAvailableBoards(false, true);
              }
              else {
                deferred.resolve(Me.currentBoard);
              }
            })
            .catch(function brokenDreamCatcher(error) {

              TroopLogger.info(logConfig, route.name + ' - catch', error);
              deferred.reject(error);
              Nav.toAvailableBoards(false, true);
            });

            return deferred.promise;

          }
        ];


        return whenAuthenticated(state, route);
      }

      function whenAuthenticated(state, route) {

        route.onEnter = route.onEnter || [
          '$rootScope',
          'TroopLogger',
          function(
            $rootScope,
            TroopLogger
          ) {
            TroopLogger.debug(logConfig, 'whenAuthenticated() - onEnter() ', state);

            $rootScope.showLoader = false;
          }
        ];

        route.resolve = route.resolve || {};

        route.resolve.isAuthenticated = [
          'Auth',
          'TroopLogger',
          function(
            Auth,
            TroopLogger
          ) {
            TroopLogger.debug(logConfig, 'isAuthenticated() ', state);

            return Auth.$requireSignIn();
          }
        ];

        $stateProvider.state(state, route);
        SECURED_ROUTES[state] = true;
        return $stateProvider;
      }

      function whenAuthenticatedOrAutoAnonAuth(state, route) {

        route.resolve = route.resolve || {};
        route.resolve.agLoggerProvider = [
          function() {
            return agLoggerProvider;
          }
        ];
        route.resolve.isAuthenticated = [
          'Auth',
          'TroopLogger',
          function(
            Auth,
            TroopLogger
          ) {

            Auth.$onAuthStateChanged(function(firebaseUser) {
              var auth = Auth.$getAuth();
              TroopLogger.debug(logConfig, 'whenAuthenticatedOrAutoAnonAuth() - route.resolve.isAuthenticated - ', auth);

              if ( ! auth ) {

                TroopLogger.debug(logConfig, 'route.js -- firebase.auth().signInAnonymously()')
                firebase.auth().signInAnonymously().catch(function(error) {
                  TroopLogger.error(logConfig, 'firebase.auth().signInAnonymously() - error - ', error);
                })
              }
            })

          }
        ];

        $stateProvider.state(state, route);
        SECURED_ROUTES[state] = true;
        return $stateProvider;
      }
    }
  ])
  // configure views; whenAuthenticated adds a resolve method to ensure users authenticate
  // before trying to access that route
  .config([
    '$stateProvider',
    '$urlRouterProvider',
    '$urlMatcherFactoryProvider',
    '$locationProvider',
    'agLoggerProvider',
    'LOG_LEVEL',
    function(
      $stateProvider,
      $urlRouterProvider,
      $urlMatcherFactoryProvider,
      $locationProvider,
      agLoggerProvider,
      LOG_LEVEL
    ) {

      $stateProvider
        .state('home', {
          url: '/',
          redirectTo: 'home.homepage.page',
          views: {
            'leftSidebar': {},
            'content': {
              templateUrl: '/views/home.html',
              controller: 'HomeCtrl as vm'
            }
          }
        })

        .state('home.homepage', {
          url: 'homepage',
          redirectTo: 'home.homepage.page',
          views: {
            'header@home': {
              templateUrl: '/views/home/header.html',
              controller: 'HomeHeaderCtrl'
            },
            'footer@home': {
              templateUrl: '/views/home/footer.html'
            }
          },
        })
        .state('home.homepage.page', {
          url: '^/home',
          views: {
            'home-page@home': {
              templateUrl: '/views/home/home-page.html'
            },
          },
        })

        // .state('home.homepage.product', {
        //   url: '^/product',
        //   views: {
        //     'home-page@home': {
        //       templateUrl: '/views/home/product.html'
        //     }
        //   },
        // })
        .state('home.homepage.support', {
          url: '^/support',
          views: {
            'home-page@home': {
              templateUrl: '/views/home/support.html',
              controller: 'SupportCtrl'
            }
          },
          onEnter: function() {
            location.hash = '#top';
          }
        })
        .state('home.homepage.privacy', {
          url: '^/privacy',
          views: {
            'home-page@home': {
              templateUrl: '/views/home/privacy.html'
            }
          },
          onEnter: function() {
            location.hash = '#top';
          }
        })
        .state('home.homepage.terms', {
          url: '^/terms',
          views: {
            'home-page@home': {
              templateUrl: '/views/home/terms.html'
            }
          },
          onEnter: function() {
            location.hash = '#top';
          }
        })

        .state('home.homepage.pricing', {
          url: '^/pricing',
          views: {
            'home-page@home': {
              templateUrl: '/views/home/pricing.html'
            }
          },
        })

        .whenAuthenticated('home.dashboard', {
          url: 'dashboard',
          redirectTo: 'home.dashboard.boards.available',
          views: {
            'notificationSidebar@': {
              templateUrl: '/views/dashboard/notification-sidebar.html',
              controller: 'NotificationSidebarCtrl as vm',
            },
            'troopSidebar@': {
              templateUrl: '/views/dashboard/troop-sidebar.html',
              controller: 'TroopSidebarCtrl',
            },
            'leftSidebar@': {
              templateUrl: '/views/dashboard/left-sidebar.html',
              controller: 'LeftSidebarCtrl as vm',
            },
            'content@': {
              templateUrl: '/views/dashboard/dashboard.html',
              controller: 'DashboardCtrl',
            },
            'dashboardHeader@home.dashboard': {
              templateUrl: '/views/dashboard/header.html'
            },

          },
        })

        .whenAuthenticated('home.dashboard.search', {
          url: '/search',
          redirectTo: 'home.dashboard.search.currentboard',
          views: {
            'dashboardHeader@home.dashboard': {
              templateUrl: '/views/dashboard/board/search-header.html',
              controller: 'BoardHeaderCtrl'
            },
            'dashboardRightSidebar@home.dashboard': {
              templateUrl: '/views/dashboard/board/right-sidebar.html',
              controller: 'BoardRightSidebarCtrl'
            }
          }
        })

        .whenAuthenticated('home.dashboard.search.allboard', {
          url: '/board/{boardId}/all/{search}',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/search-board.html',
              controller: 'SearchCardsCtrl'
            }
          }
        })
        .whenAuthenticated('home.dashboard.search.currentboard', {
          url: '/board/{boardId}/current/{search}',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/search-board.html',
              controller: 'SearchCardsCtrl'
            }
          }
        })

        .whenAuthenticated('home.dashboard.search.chat', {
          url: '/board/{boardId}/chat/{search}',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/search-chat.html',
              controller: 'SearchChatsCtrl'
            }
          }
        })

        .whenAuthenticated('home.dashboard.board', {
          url: '/board',
          params: {
            selectedTagName: null
          },
          redirectTo: 'home.dashboard.board.cards',
          views: {
            'dashboardHeader@home.dashboard': {
              templateUrl: '/views/dashboard/board/header.html',
              controller: 'BoardHeaderCtrl'
            },
            'dashboardRightSidebar@home.dashboard': {
              templateUrl: '/views/dashboard/board/right-sidebar.html',
              controller: 'BoardRightSidebarCtrl'
            }

          }
        })
        .whenHasBoard('home.dashboard.board.chat', {
          url: '/{boardId}/chat',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/chat.html',
              controller: 'BoardChatCtrl'
            }
          }

        })
        .whenHasBoard('home.dashboard.board.cards', {
          url: '/{boardId}/cards',
          params: {
            backState: false
          },
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/multi-card.html',
              controller: 'MultiCardCtrl as vm'
            }
          }
        })
        .whenHasBoard('home.dashboard.board.card', {
          url: '/{boardId}/card/{cardId}',
          params: {
            backState: false
          },
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/detail-card.html',
              controller: 'DetailCardCtrl'
            }
          }

        })
        .whenHasBoard('home.dashboard.board.tags', {
          url: '/{boardId}/list',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/list.html',
              controller: 'CardListCtrl as vm'
            }
          }

        })
        .whenHasBoard('home.dashboard.board.grid', {
          url: '/{boardId}/grid',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/grid.html',
              controller: 'CardGridCtrl'
            }
          }

        })

        .whenHasBoard('home.dashboard.board.document', {
          url: '/{boardId}/document',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/document.html',
              controller: 'DocumentCtrl'
            }
          }

        })
        .whenHasBoard('home.dashboard.board.table', {
          url: '/{boardId}/table',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/board/table.html',
              controller: 'TableCtrl as vm'
            }
          }

        })

        .whenAuthenticated('home.dashboard.boards', {
          url: '/boards',
          redirectTo: 'home.dashboard.boards.available',
          views: {
            'dashboardHeader@home.dashboard': {
              templateUrl: '/views/dashboard/boards/header.html',
              controller: 'BoardsHeaderCtrl'
            }
          }

        })
        .whenAuthenticated('home.dashboard.boards.available', {
          url: '/available',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/boards/team-boards.html',
              controller: 'TeamBoardsCtrl'
            }
          }

        })
        .whenAuthenticated('home.dashboard.boards.mine', {
          url: '/mine',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/boards/my-boards.html',
              controller: 'MyBoardsCtrl'
            }
          }

        })

        .whenAuthenticated('home.dashboard.troopMember', {
          url: '/troopMember',
          redirectTo: 'home.dashboard.troopMembers.list',
          params: {
            permission: 'member'
          },
          views: {
            'dashboardHeader@home.dashboard': {
              templateUrl: '/views/dashboard/troopMember/header.html',
              controller: 'TroopMemberHeaderCtrl'
            },
            'dashboardRightSidebar@home.dashboard': {
              templateUrl: '/views/dashboard/troopMember/profile-sidebar.html',
              controller: 'ProfileSidebarCtrl'
            }
          }
        })
        .whenAuthenticated('home.dashboard.troopMember.chat', {
          url: '/{troopMemberId}/chat',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/troopMember/chat.html',
              controller: 'TroopMemberChatCtrl'
            }
          }
        })

        .whenAuthenticated('home.dashboard.troopMembers', {
          url: '/troopMembers',
          redirectTo: 'home.dashboard.troopMembers.list',
          params: {
            permission: 'member'
          },
          views: {
            'dashboardHeader@home.dashboard': {
              templateUrl: '/views/dashboard/troopMembers/header.html',
              controller: 'TroopMembersHeaderCtrl'
            }
          }
        })
        .whenAuthenticated('home.dashboard.troopMembers.list', {
          url: '/list/{permission}',
          views: {
            'dashboardContent@home.dashboard': {
              templateUrl: '/views/dashboard/troopMembers/list.html',
              controller: 'TroopMembersCtrl'
            }
          }
        })

        .whenAuthenticatedOrAutoAnonAuth('public', {
          url: '/tr/{troopSlug}',
          views: {
            'content@': {
              // templateUrl: '/views/public-troop.html',
              controller: 'PublicTroopCtrl'
            }
          },
          resolve: {
            checkAuth: [
              '$stateParams',
              '$q',
              '$localStorage',
              'Auth',
              'Me',
              'TroopApi',
              'TroopLogger',
              'TroopFactory',
              function(
                $stateParams,
                $q,
                $localStorage,
                Auth,
                Me,
                TroopApi,
                TroopLogger,
                TroopFactory
              ) {

                var deferred = $q.defer();

                Auth.$loaded()
                .then(function loadTrooper(firebaseUser) {

                  return Me.loadTrooper(firebaseUser.uid);
                })

                .then(function waitForTrooperToLoad() {

                  return Me.trooper.$loaded();
                })
                .then(function setLocalToken() {

                  if (
                    ( ! TroopApi._token )
                    && $localStorage.token
                  ) {

                    TroopApi.setToken($localStorage.token, Me.trooper.loginId);
                  }
                })
                .then(function findTroopFromSlug() {

                  return TroopFactory.getTroopIdFromSlug($stateParams.troopSlug);
                })
                .then(function loadTroop(troopId) {

                  Me.loadTroop(troopId);

                  return Me.$doneTryingToLoadTroop();
                })
                .then(function waitForTroopToLoad() {

                  Me.addToRecentPublicTroops(Me.troop.$id, $stateParams.troopSlug)

                  return Me.troop.$loaded();
                })
                .then(function loadTroopMembers() {

                  return Me.$doneTryingToLoadTroopMembers();
                })
                .then(function waitForTroopMembersToLoad() {

                  return Me.troopMembers.$loaded();
                })
                .then(function loadAllTroopBoards() {

                  return Me.$doneTryingToLoadAllBoards();
                })
                .then(function waitForAllBoardsToLoad() {

                  return Me.allBoards.$loaded();
                })
                .then(function loadTroopMember() {

                  Me.loadTroopMember(Me.troop.$id, 'guest');

                  return Me.$doneTryingToLoadTroopMember();
                })
                .then(function waitForTroopMemberToLoad() {
                  return Me.troopMember.$loaded();
                })
                .then(function getFirstPublicBoard() {

                  return Me.getFirstPublicBoardId();
                })
                .then(function loadBoard(firstPublicBoardId) {

                  Me.loadBoard(Me.troop.$id, firstPublicBoardId);

                  return Me.$doneTryingToLoadBoard();
                })
                .then(function waitFOrBoardToLoad() {

                  return Me.currentBoard.$loaded();
                })
                .then(function doneCheckingAuth() {
                  if (
                    Me.trooper.hasOwnProperty('troops')
                    && Me.trooper.troops[Me.troop.$id]
                    && Me.trooper.troops[Me.troop.$id].troopPermission !== 'discharged'
                    && Me.trooper.troops[Me.troop.$id].troopPermission !== 'banned'
                  ) {
                    Me.switchToTroop(Me.troop.$id);
                  }

                  deferred.resolve();
                  Me.redirectingDeferred.resolve();
                })
                .catch(function(error) {

                  console.log(error);
                });

                return deferred.promise;

              }
            ]
          },
          onEnter: [
            '$state',
            '$stateParams',
            '$rootScope',
            'Nav',
            'Me',
            function(
              $state,
              $stateParams,
              $rootScope,
              Nav,
              Me
            ) {

              if (
                ( ! $stateParams )
                || ( ! $stateParams.troopSlug )
              ) {
                Nav.toLogin();
                return false;
              }



              $rootScope.showLoader = false;

            }
          ],
        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard', {
          url: '/dashboard',
          redirectTo: 'public.dashboard.boards.available',
          views: {
            'notificationSidebar@': {
              templateUrl: '/views/dashboard/notification-sidebar.html',
              controller: 'NotificationSidebarCtrl as vm',
            },
            'troopSidebar@': {
              templateUrl: '/views/dashboard/troop-sidebar.html',
              controller: 'TroopSidebarCtrl',
            },
            'leftSidebar@': {
              templateUrl: '/views/dashboard/left-sidebar.html',
              controller: 'LeftSidebarCtrl as vm',
            },
            'content@': {
              templateUrl: '/views/dashboard/dashboard.html',
              controller: 'DashboardCtrl',
            },
            'dashboardHeader@public.dashboard': {
              templateUrl: '/views/dashboard/header.html'
            },

          },
        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board', {
          url: '/board',
          redirectTo: 'public.dashboard.board.cards',
          views: {
            'dashboardHeader@public.dashboard': {
              templateUrl: '/views/dashboard/board/header.html',
              controller: 'BoardHeaderCtrl'
            },
            'dashboardRightSidebar@public.dashboard': {
              templateUrl: '/views/dashboard/board/right-sidebar.html',
              controller: 'BoardRightSidebarCtrl'
            }

          }
        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.chat', {
          url: '/{boardId}/chat',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/chat.html',
              controller: 'BoardChatCtrl'
            }
          }

        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.cards', {
          url: '/{boardId}/cards',
          onEnter: [
            '$state',
            '$stateParams',
            'Nav',
            function(
              $state,
              $stateParams,
              Nav
            ) {

              if (
                ( ! $stateParams )
                || ( ! $stateParams.boardId )
              ) {
                Nav.toAvailableBoards(true, false);

                return false;
              }
            }
          ],
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/multi-card.html',
              controller: 'MultiCardCtrl as vm'
            }
          }
        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.card', {
          url: '/{boardId}/card/{cardId}',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/detail-card.html',
              controller: 'DetailCardCtrl'
            }
          }

        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.tags', {
          url: '/{boardId}/list',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/list.html',
              controller: 'CardListCtrl as vm'
            }
          }

        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.grid', {
          url: '/{boardId}/grid',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/grid.html',
              controller: 'CardGridCtrl'
            }
          }

        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.table', {
          url: '/{boardId}/table',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/table.html',
              controller: 'TableCtrl as vm'
            }
          }

        })

        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.board.document', {
          url: '/{boardId}/document',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/board/document.html',
              controller: 'DocumentCtrl'
            }
          }

        })

        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.boards', {
          url: '/boards',
          redirectTo: 'public.dashboard.boards.available',
          views: {
            'dashboardHeader@public.dashboard': {
              templateUrl: '/views/dashboard/boards/header.html',
              controller: 'BoardsHeaderCtrl'
            }
          }

        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.boards.available', {
          url: '/available',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/boards/team-boards.html',
              controller: 'TeamBoardsCtrl'
            }
          }

        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.boards.mine', {
          url: '/mine',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/boards/my-boards.html',
              controller: 'MyBoardsCtrl'
            }
          }

        })

        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.troopMember', {
          url: '/troopMember',
          redirectTo: 'public.dashboard.troopMembers.list',
          params: {
            permission: 'member'
          },
          views: {
            'dashboardHeader@public.dashboard': {
              templateUrl: '/views/dashboard/troopMember/header.html',
              controller: 'TroopMemberHeaderCtrl'
            },
            'dashboardRightSidebar@public.dashboard': {
              templateUrl: '/views/dashboard/troopMember/profile-sidebar.html',
              controller: 'ProfileSidebarCtrl'
            }
          }
        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.troopMember.chat', {
          url: '/{troopMemberId}/chat',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/troopMember/chat.html',
              controller: 'TroopMemberChatCtrl'
            }
          }
        })

        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.troopMembers', {
          url: '/troopMembers',
          redirectTo: 'public.dashboard.troopMembers.list',
          params: {
            permission: 'member'
          },
          views: {
            'dashboardHeader@public.dashboard': {
              templateUrl: '/views/dashboard/troopMembers/header.html',
              controller: 'TroopMembersHeaderCtrl'
            }
          }
        })
        .whenAuthenticatedOrAutoAnonAuth('public.dashboard.troopMembers.list', {
          url: '/list/{permission}',
          views: {
            'dashboardContent@public.dashboard': {
              templateUrl: '/views/dashboard/troopMembers/list.html',
              controller: 'TroopMembersCtrl'
            }
          }
        })

        .whenAuthenticated('home.affiliate', {
          url: 'affiliate',
          // redirectTo: 'home.dashboard.boards.available',
          views: {
            'content@': {
              templateUrl: '/views/affiliate/dashboard.html',
              controller: 'AffiliateDashboardCtrl as vm',
            },
            'dashboardHeader@home.affiliate': {
              templateUrl: '/views/affiliate/header.html',
              controller: 'AffiliateHeaderCtrl as vm'
            },
            'dashboardContent@home.affiliate': {
              templateUrl: '/views/affiliate/table.html',
              controller: 'AffiliateTableCtrl as vm'
            }

          },
        })

        .state('invite', {
          url: '/invite/{inviteType}/{token}',
          views: {
            'content@': {
              templateUrl: '/views/invite.html',
              controller: 'InviteCtrl'
            }
          }

        })
        // .state('sign-up', {
        //   url: '/sign-up',
        //   views: {
        //     'content@': {
        //       templateUrl: '/views/sign-up.html',
        //       controller: 'SignUpCtrl'
        //     }
        //   }
        //
        // })
        .state('login', {
          url: '/login',
          views: {
            'content@': {
              templateUrl: '/views/login.html',
              controller: 'LoginCtrl as vm'
            }
          }

        })
        .state('auth', {
          url: '/auth',
          views: {
            'content@': {
              templateUrl: '/views/auth.html',
              controller: 'AuthCtrl as vm'
            }
          },
          // resolve: {
          //   AuthAction: [
          //     '$q',
          //     '$stateParams',
          //     function(
          //       $q,
          //       $stateParams
          //     ) {
          //
          //       console.log('$stateParams', $stateParams)
          //
          //       if ( ! $stateParams.action ) {
          //
          //         $stateParams.action = 'login';
          //       }
          //
          //       var approvedActions = ['login', 'sign-up', 'link-oauth'];
          //
          //       if ( approvedActions.indexOf($stateParams.action) === -1 ) {
          //
          //         $stateParams.action = 'login';
          //       }
          //
          //       return $stateParams.action;
          //     }
          //   ]
          // },

        })
        .state('auth.login', {
          url: '/login',
          // resolve: {
          //   AuthAction: [
          //     '$q',
          //     function($q) {
          //       var deferred = $q.defer();
          //       deferred.resolve('login');
          //       return deferred.promise;
          //       return 'login';
          //     }
          //   ]
          // }
        })
        .state('auth.sign-up', {
          url: '/sign-up',
          // resolve: {
          //   AuthAction: [
          //     function() {
          //       return 'sign-up';
          //     }
          //   ]
          // }
        })
        .state('auth.link-oauth', {
          url: '/link-oauth',
          // resolve: {
          //   AuthAction: [
          //     function() {
          //       return 'link-oauth';
          //     }
          //   ]
          // }
        })
        // .state('legacy-login', {
        //   url: '/legacy-login',
        //   views: {
        //     'content@': {
        //       templateUrl: '/views/legacy-login.html',
        //       controller: 'LegacyLoginCtrl'
        //     }
        //   }
        //
        // })
        .state('password-reset', {
          url: '/reset/{token}',
          views: {
            'content@': {
              templateUrl: '/views/password-reset.html',
              controller: 'PasswordResetCtrl'
            }
          }

        })

        .state('style-guide', {
          url: '/style-guide',
          views: {
            'content@': {
              templateUrl: '/views/style-guide.html',
              controller: 'StyleGuideCtrl'
            }
          }
        });

      $urlRouterProvider.otherwise('/dashboard');

      $urlMatcherFactoryProvider.strictMode(false);

      if ( window.history && window.history.pushState ) {

        $locationProvider.html5Mode({
          enabled: true,
          requireBase: false
        }).hashPrefix('!');
      }

      agLoggerProvider.setLogLevel(LOG_LEVEL);

  }])

  /**
   * Apply some route security. Any route's resolve method can reject the promise with
   * "AUTH_REQUIRED" to force a redirect. This method enforces that and also watches
   * for changes in auth status which might require us to navigate away from a path
   * that we can no longer view.
   */
  .run([
    '$rootScope',
    '$state',
    '$location',
    '$urlRouter',
    '$timeout',
    '$localStorage',
    'Auth',
    'SECURED_ROUTES',
    'Me',
    'Nav',
    function(
      $rootScope,
      $state,
      $location,
      $urlRouter,
      $timeout,
      $localStorage,
      Auth,
      SECURED_ROUTES,
      Me,
      Nav
    ) {
      $rootScope.debugInfoEnabled = false;

      var urlParams = $location.search();
      if ( urlParams.hasOwnProperty('tc') ) {

        $localStorage.tc = urlParams.tc;
      }


      // watch for login status changes and redirect if appropriate
      Me.offAuth = Auth.$onAuthStateChanged(function(firebaseUser) {

        if (Auth.isAuthenticated) {
          // already authenticated
          Auth.deferred.resolve(firebaseUser);
          return false;
        }

        if ( ! firebaseUser ) {
          // not authenticated
          if (
            ! (
              $location.$$path === '/'
              || $location.$$path === '/home'
              || $location.$$path === '/support'
              || $location.$$path === '/privacy'
              || $location.$$path === '/terms'
              || $location.$$path === '/sign-up'
              || $location.$$path === '/login'
              || $location.$$path === '/homepage'
              || $location.$$path === '/product'
              || $location.$$path === '/pricing'
              || ($location.$$path || '').indexOf('/auth/') > -1
              || ($location.$$path || '').indexOf('/tr/') > -1
              || ($location.$$path || '').indexOf('/invite') > -1
              || ($location.$$path || '').indexOf('/reset') > -1
            )
          ) {
            Nav.toHomepage();
          }
          return false;
        }
        else {

          if ( ($location.$$path || '').indexOf('/invite') !== -1 ) {
            Me.freeMe();
            Auth.logout(false);
            Auth.deferred.reject();
            return false;
          }

        }


        Auth.deferred.resolve(firebaseUser);
      });

      // $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
      //
      //   var newState = toState.redirectTo || toState.name;
      //   $state.go(newState);
      //   Me.saveState(newState, toParams);
      //   Me.prevState = fromState.name || null;
      //
      // });

      // some of our routes may reject resolve promises with the special {authRequired: true} error
      // this redirects to the login page whenever that is encountered
      $rootScope.$on('$stateChangeError', function(event, toState, toParams, fromState, fromParams, error) {

        if( error === 'AUTH_REQUIRED' ) {

          $state.go('home.homepage');
        }

      });
    }
  ])

  // used by route security
  .constant('SECURED_ROUTES', {});


  compileConfig.$inject = ['$compileProvider'];

  function compileConfig($compileProvider) {

    //$rootScope.debugInfoEnabled = true;
    $compileProvider.debugInfoEnabled(false);
    //$compileProvider.commentDirectivesEnabled(true);
    //$compileProvider.cssClassDirectivesEnabled(false);
    // will break ng-sortable
    // for very unknown reason !!!
  }
