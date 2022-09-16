/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */

'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpObserver
 * @description
 * # tpObserver
 */
angular.module('webClientApp')
.directive('tpObserver',
[
  '$rootScope',
  '$window',
  '$document',
  '$q',
  '$localStorage',
  'UAParser',
  'Me',
  'Auth',
  'TroopLogger',
  function (
    $rootScope,
    $window,
    $document,
    $q,
    $localStorage,
    UAParser,
    Me,
    Auth,
    TroopLogger
  ) {
    var logConfig = {
      slug: 'directive:  tpObserver - ',
      path: [ 'directives', 'troop', 'tpObserver.js']
    };

    return {
      link: function(scope, element, attrs) {

        // grab browser and os
        element.attr('data-browser-name', UAParser.browser.name);
        element.attr('data-browser-version', UAParser.browser.version);
        element.attr('data-os-name', UAParser.os.name);
        element.attr('data-os-version', UAParser.os.version);

        // track screen size
        var w = angular.element($window);
        var d = angular.element($document);

        var checkResize = function () {

          var size = 'desktop';
          var sizeChanged = false;
          var width = w.width();
          var height = w.height();

          if (width <= 540) {
            size = 'mobile';
          }
          else if (width < 1025) {
            size = 'tablet';
            element.addClass('read-only-mode');
          }
          else {
            element.removeClass('read-only-mode');
          }


          if (Me.screen.width !== width) {
            Me.screen.width = width
            element.attr('data-window-width', Me.screen.width);
            //changed = true;
          }

          if (Me.screen.height !== height) {
            Me.screen.height = height;
            element.attr('data-window-height', Me.screen.height);
            //changed = true;
          }


          if (Me.screen.size !== size) {
            Me.screen.size = size;
            element.attr('data-window-size', Me.screen.size);
            $rootScope.$broadcast('window-size-changed', size);

            // switch (size) {
            //   case 'desktop':
            //     break;
            //   case 'tablet':
            //   case 'mobile':
            //     $rootScope.$broadcast('window-size-changed', size);
            //     break;
            // }
          }

        };

        w.bind('resize', checkResize);
        checkResize();


        // catch global key bindinds
        // w.bind('keydown', function(evt) {
        //   // evt.preventDefault();
        // });

        // track navigation
        $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
          // TroopLogger.debug(logConfig, '$stateChangeStart - ', toState);
          element.addClass('navigating');
        });
        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
          // TroopLogger.debug(logConfig, '$stateChangeSuccess - ', toState);
          element.removeClass('navigating');

          var newState = toState.redirectTo || toState.name;
          element.attr('data-state', newState || 'unknown');

          Me.currentRouteState = newState;
        });

        // default right side bar to show.
        $rootScope.showRightSidebar = true;
        // track right sidebar
        $rootScope.$watch('showRightSidebar', function() {

          if ($rootScope.showRightSidebar) {

            element.addClass('showing-right-sidebar');
          }
          else {
            element.removeClass('showing-right-sidebar');
          }

        });

        // default right side bar to show.
        $rootScope.showProfileSidebar = true;
        // track right sidebar
        $rootScope.$watch('showProfileSidebar', function() {

          if ($rootScope.showProfileSidebar) {
            element.addClass('showing-profile-sidebar');
          }
          else {
            element.removeClass('showing-profile-sidebar');
          }

        });

        // default notification side bar to show.
        $rootScope.showNotifications = false;
        // track notification sidebar
        $rootScope.$watch('showNotifications', function() {

          if ($rootScope.showNotifications) {
            element.addClass('showing-notification-sidebar');
          }
          else {
            element.removeClass('showing-notification-sidebar');
          }

        });

        // track authentication
        $rootScope.$watch('isAuthenticated', function() {

          if ($rootScope.isAuthenticated) {
            element.addClass('authenticated');

            Me.$doneTryingToLoadTroopMember()
            .then(function() {
              if ( ! Me.troopMember ) {
                return $q.reject({ code: 'MISSING_TROOP_MEMBER'});
              }

              return Me.troopMember.$loaded();
            })
            .then(function() {

              if ( Me.troopMember.troopPermission === 'guest' ) {
                element.addClass('guest');
              }
              else {
                element.removeClass('guest');
              }
            })
          }
          else {
            element.removeClass('authenticated');
          }

        });

        // track login menu
        $rootScope.$watch('showLoginMenu', function() {

          if ($rootScope.showLoginMenu) {
            element.addClass('showing-login-menu');
          }
          else {
            element.removeClass('showing-login-menu');
          }

        });

        // track left sidebar
        $rootScope.$watch('showLeftSideBar', function() {

          if ($rootScope.showLeftSideBar) {
            element.addClass('showing-left-sidebar');
          }
          else {
            element.removeClass('showing-left-sidebar');
          }

        });

        // track troop sidebar
        $rootScope.$watch('showTroopSideBar', function() {

          if ($rootScope.showTroopSideBar) {
            element.addClass('showing-troop-sidebar');
          }
          else {
            element.removeClass('showing-troop-sidebar');
          }

        });

        // track header search bar
        $rootScope.$watch('showSearch', function() {

          if ($rootScope.showSearch) {
            element.addClass('showing-search-bar');
          }
          else {
            element.removeClass('showing-search-bar');
          }
        });

        // track detail card comments in mobile
        $rootScope.$watch('showDetailCardComments', function() {

          if ($rootScope.showDetailCardComments) {
            element.addClass('showing-detail-card-comments');
          }
          else {
            element.removeClass('showing-detail-card-comments');
          }
        });

        if ( ! $localStorage.jhSettings ) {
          $localStorage.jhSettings = {
            colorScheme: 1
          };
        }

        $rootScope.$watch(function() {
          element.attr('color-scheme', $localStorage.jhSettings.colorScheme);
        });

        element.on('click.observer', function(event) {

          $rootScope.$broadcast('onBodyClick', event);
        });

        element.bind('keydown.observer keypress.observer', function(event) {
          var keyCode = event.which || event.keyCode;

          if (keyCode === 13) { // If enter key is pressed

            $rootScope.$broadcast('onEnterKey', event);
          }
          else if (keyCode === 27) { // If esc key is pressed

            $rootScope.$broadcast('onEscapeKey', event);
          }
          else if (keyCode === 37) { // If left arrow key is pressed

            $rootScope.$broadcast('onLeftArrow', event);
          }
          else if (keyCode === 38) { // If up arrow key is pressed

            $rootScope.$broadcast('onUpArrow', event);

          }
          else if (keyCode === 39) { // If right arrow key is pressed

            $rootScope.$broadcast('onRightArrow', event);
          }
          else if (keyCode === 40) { // If down arrow key is pressed
            $rootScope.$broadcast('onDownArrow', event);
          }
        });

        var $audioEl = element.find('#notification-sound');
        var now = new Date().getTime();
        $rootScope.$on('notification', function(event, data) {

          if (
            data.event.event === 'child_added'
            && data.notification.createdAt > now
          ) {
            $audioEl[0].play();
          }
        });


        $rootScope.showLoader = true;
        $rootScope.$watch('showLoader', function() {

          if ( $rootScope.showLoader ) {
            element.addClass('loading');
          }
          else {
            element.removeClass('loading');
          }

        });

        $rootScope.readOnlyMode = false;
        $rootScope.$watch('readOnlyMode', function() {

          if (w.width() < 1025) {
            $rootScope.readOnlyMode = true;
            element.addClass('read-only-mode');
          }
          else {
            $rootScope.readOnlyMode = false;
            element.removeClass('read-only-mode');
          }


        });

        Auth.$loaded()
        .then(function tryToLoadTrooper() {
          TroopLogger.debug(logConfig, 'tryToLoadTrooper');
          return Me.$doneTryingToLoadTrooper();
        })
        .then(function waitingForTrooperToLoad() {
          TroopLogger.debug(logConfig, 'waitingForTrooperToLoad');
          return Me.trooper.$loaded();
        })
        .then(function tryingToLoadTroops() {
          TroopLogger.debug(logConfig, 'tryingToLoadTroops');
          return Me.$doneTryingToLoadTroops();
        })
        .then(function tryingToLoadTroop() {
          TroopLogger.debug(logConfig, 'tryingToLoadTroop');
          return Me.$doneTryingToLoadTroop();
        })
        .then(function waitingForTroopToLoad() {
          TroopLogger.debug(logConfig, 'waitingForTroopToLoad');
          return Me.troop.$loaded();
        })
        .then(function tryingToLoadTroopMembers() {
          TroopLogger.debug(logConfig, 'tryingToLoadTroopMembers');
          return Me.$doneTryingToLoadTroopMembers();
        })
        .then(function waitingForTroopMemberToLoad() {
          TroopLogger.debug(logConfig, 'waitingForTroopMemberToLoad');
          return Me.troopMembers.$loaded();
        })
        .then(function tryingToLoadAllBoards() {
          TroopLogger.debug(logConfig, 'tryingToLoadAllBoards');
          return Me.$doneTryingToLoadAllBoards();
        })
        .then(function waitingForAllBoardsToLoad() {
          TroopLogger.debug(logConfig, 'waitingForAllBoardsToLoad');
          return Me.allBoards.$loaded();
        })
        .then(function tryingToLoadAllTroopMember() {
          TroopLogger.debug(logConfig, 'tryingToLoadAllTroopMember');
          return Me.$doneTryingToLoadTroopMember();
        })
        .then(function waitingForTroopMemberToLoad() {
          TroopLogger.debug(logConfig, 'waitingForTroopMemberToLoad');
          return Me.troopMember.$loaded();
        })
        // .then(function() {
        //
        //   return Me.$doneTryingToLoadNotifications();
        // })
        .then(function() {
          TroopLogger.debug(logConfig, 'Me.troopMember.$loaded()');

          var deferred = $q.defer();

          if (Me.currentBoard) {

            Me.$doneTryingToLoadBoard()
            .then(function waitForBoardToLoad() {
              TroopLogger.debug(logConfig, 'waitForBoardToLoad');

              return Me.currentBoard.$loaded();
            })
            .then(function waitForBoardCardsToLoad() {
              TroopLogger.debug(logConfig, 'waitForBoardCardsToLoad');

              return Me.currentBoardCards.$loaded();
            })
            .then(function waitForBoardAssetsToLoad() {
              TroopLogger.debug(logConfig, 'waitForBoardAssetsToLoad');

              return Me.currentBoardAssets.$loaded();
            })
            .then(function doneLoadingBoard() {
              TroopLogger.debug(logConfig, 'doneLoadingBoard');

              deferred.resolve();
            })
            .catch(function loadBoardCatcher(error) {
              TroopLogger.error(logConfig, 'loadBoardCatcher', error);

              deferred.reject(error);
            });
          }
          else if (Me.currentTroopMember) {

            Me.$doneTryingToLoadCurrentTroopMember()
            .then(function() {
              TroopLogger.debug(logConfig, '$doneTryingToLoadCurrentTroopMember()');

              return Me.currentTroopMember.$loaded();
            })
            .then(function() {
              TroopLogger.debug(logConfig, 'Me.currentTroopMember.$loaded()');

              deferred.resolve();
            })
            .catch(function(error) {
              TroopLogger.error(logConfig, '- catch()', error);
              deferred.reject(error);
            });
          }
          else {

            deferred.resolve();
          }

          return deferred.promise;
        })
        .catch(function brokenDreamCatcher(error) {

          if ( error && error.code ) {

            switch (error.code) {

              default:
                TroopLogger.error(logConfig, 'catch', error);
                break;
            }
          }
          else {
            TroopLogger.error(logConfig, 'catch', error);
          }
        });
      }
    };

  }
]);
