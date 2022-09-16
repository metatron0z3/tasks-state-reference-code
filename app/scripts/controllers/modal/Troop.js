/* global Clipboard, Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:TroopModalCtrl
   * @description
   * # TroopModalCtrl
   * Controller of the webClientApp
   */
  angular
    .module('webClientApp')
    .controller('TroopModalCtrl', TroopModalCtrl);

    TroopModalCtrl.$inject = [
      '$scope',
      '$state',
      '$q',
      'Ref',
      '$timeout',
      '$notification',
      'Me',
      'Nav',
      'TroopApi',
      'TroopFactory',
      'TroopMemberFactory',
      'BoardFactory',
      'AssetFactory',
      'TROOP_CLIPBOARD',
      'WEB_SERVER_URL',
      'Slug',
      'close',
      'TroopLogger'
    ];

    function TroopModalCtrl (
      $scope,
      $state,
      $q,
      Ref,
      $timeout,
      $notification,
      Me,
      Nav,
      TroopApi,
      TroopFactory,
      TroopMemberFactory,
      BoardFactory,
      AssetFactory,
      TROOP_CLIPBOARD,
      WEB_SERVER_URL,
      Slug,
      close,
      TroopLogger
    ) {
      var logConfig = {
        slug: 'controller: Troop Modal - ',
        path: [ 'controllers', 'modal', 'Troop.js']
      };
      /*jshint validthis: true */
      var that = this;

      waitForElementToDisplay('.copy-btn', 100);

      function waitForElementToDisplay(selector, time) {


        if ( document.querySelector(selector) !== null ) {

          that.clipboard = new Clipboard( $('.copy-btn')[0] );
          return;
        }
        else {
          setTimeout(function() {

            waitForElementToDisplay(selector, time);
          }, time);
        }
      }


      this.origTroop = null;
      $scope.processing = false;

      $scope.showModal = true;

      $scope.newTroop = false;

      $scope.$on('onEscapeKey', function(event) {
        $scope.close();
      })

      $scope.publicUrl = {
        baseUrl: WEB_SERVER_URL + '/tr/',
        troopSlug: '',
        baseUrlShow: true,
        availSlug: '',
        duplicate: false,
        error: false
      };

      $scope.troop = {
        public: false,
        troopName: '',
        publicUrl: ''
      };

      $scope.data = {
        action: 'switch-troop'
      };

      $scope.labels = {};

      this.refreshLabels = function() {

        $scope.labels = {
          troopName: ! $scope.troop.troopName
        };
      };

      this.updateTroop = function() {

        TroopFactory.update(
          {
            troopId: $scope.troop.$id,
            troopName: $scope.troop.troopName
          },
          function(error) {

            console.log(error);
          }
        )
        .then(function() {

          if (
            that.origTroop.public !== true && $scope.troop.public === true
          ) {
            // was not public, but now wants to be
            return TroopApi.makeTroopPublic({
              troopId: $scope.troop.$id,
              slug: $scope.publicUrl.troopSlug
            });
          }

          else if (
            that.origTroop.public === true && $scope.troop.public !== true
          ) {
            // was public, now wants to be private
            return TroopApi.makeTroopPrivate({
              troopId: $scope.troop.$id
            });
          }
          else if (that.origTroop.troopSlug && that.origTroop.troopSlug !== $scope.publicUrl.troopSlug) {
            // was public, but user made a change to the slug
            return TroopApi.makeTroopPublic({
              troopId: $scope.troop.$id,
              slug: $scope.publicUrl.troopSlug
            });
          }
          else {
            // either was private and stayed private or was public and stayed public with the same URL
            // just putting this in here so I remember how all this works, nothing needs to happen
          }

          return;
        })
        .then(function() {
          if (Me.allBoards.length === 0) {
            that.createGeneralBoard(Me.troop.$id);
          }
          else {
            $scope.close();
          }
        })
        .catch(function(error) {

          console.log(error);

        });
      };

      this.setTroop = function(troop) {

        that.origTroop = troop;

        $scope.troop = _.clone(troop);

        if ($scope.troop.public) {

          $scope.publicUrl.troopSlug = that.origTroop.troopSlug;
        }

        that.refreshLabels();
      };

      this.setKindOfModal = function(kind) {

        if (kind === 'new') {

          $scope.newTroop = true;
        }
        if (kind === 'editing') {

          $scope.newTroop = false;
        }
      };

      $scope.copyNotification = function() {

        TroopLogger.debug(logConfig, 'copyNotification clicked');

        $notification(
          'Success!',
          {
            body: 'You copied: ' + $scope.publicUrl.baseUrl + $scope.publicUrl.troopSlug + ' to your clipboard.',
            dir: 'auto',
            lang: 'en',
            //tag: 'my-tag',
            icon: TROOP_CLIPBOARD,
            delay: 5000, // in ms
            focusWindowOnClick: false // focus the window on click
          }
        );

        that.clipboard.on('success', function(e) {
            // console.info('Action:', e.action);
            // console.info('Text:', e.text);
            // console.info('Trigger:', e.trigger);
            TroopLogger.debug(logConfig, 'clipboard success');
            e.clearSelection();
        });

        that.clipboard.on('error', function(e) {
            TroopLogger.error(logConfig, 'clipboard error',e);
            //console.error('Action:', e.action);
            //console.error('Trigger:', e.trigger);
        });
      };

      $scope.goPublicPrivate = function(form) {

        if (form.$error) {
          //check that user has filled out Troop Name before attempting to make troop Public
          _.each(form.$error.required, function(field) {

            if ( field.$name === 'troopName' ) {

              field.$setDirty();
              field.$setTouched();
              $scope.troop.public = false;
            }
          });
        }

        if ($scope.troop.public) {

          //checks if troop name has been used already.
          if ( $scope.publicUrl.troopSlug === '' ) {

            $scope.publicUrl.troopSlug = Slug.slugify($scope.troop.troopName);
          }
          $scope.validateSlug();
        }
        else {
          //put in route for privatizing troop.
        }


      };

      $scope.validateSlug = function() {

        $scope.publicUrl.baseUrlShow = true;
        $scope.publicUrl.error = false;


        if ($scope.publicUrl.troopSlug.length > 128 ) {

          $scope.publicUrl.duplicate = false;
          $scope.publicUrl.error = true;
          $scope.errorMsg = 'Your public url is too long.';
          return false;
        }
        else {

          $scope.publicUrl.troopSlug = Slug.slugify($scope.publicUrl.troopSlug);
        }

        TroopApi.validateSlug({
          slug: $scope.publicUrl.troopSlug
        })
        .then(function(res) {

          if ( res.data === true || (that.origTroop && that.origTroop.troopSlug === $scope.publicUrl.troopSlug) )
          {
            $scope.publicUrl.duplicate = false;
          }
          else {

            $scope.publicUrl.duplicate = true;
            $scope.publicUrl.availSlug = res.data;
          }
        })
        .catch(function(error) {

          $scope.publicUrl.duplicate = false;
          $scope.publicUrl.error = true;
          if ( $scope.publicUrl.troopSlug === '' ) {

            $scope.errorMsg = 'A public url is required.';
          }
          else if ($scope.publicUrl.troopSlug.length > 128) {

            $scope.errorMsg = 'Your public url is too long.';
          }

          return $q.reject({ code: 'generating url did not work' });
        });
      };
      $scope.injectAvailSlug = function() {
        $scope.publicUrl.troopSlug = $scope.publicUrl.availSlug;
        $scope.validateSlug();
      };
      $scope.hideLabel = function(labelName) {
        $scope.labels[labelName] = false;
      };
      $scope.showLabel = function(labelName) {
        $scope.labels[labelName] = true;
      };
      $scope.close = function() {

        $scope.showModal = false;

        $timeout(function() {
          close();
        }, 800).then(function() {
          $scope.processing = false;
        })

      };
      $scope.focusCallback = function(focusEvent) {
        if (focusEvent && focusEvent.currentTarget.name === 'troopSlug'){
          $scope.publicUrl.baseUrlShow = false;
        }
      };

      $scope.save = function(form) {

        if (! $scope.processing) {

          $scope.processing = true;

          _.each(form.$error.required, function(field) {

            field.$setDirty();
            field.$setTouched();
          });

          if (
            form.$valid
            && ( ! $scope.newTroop )
            && ( ! $scope.publicUrl.error )
            && ( ! $scope.publicUrl.duplicate )
          ) {

            that.updateTroop();
          }

          if (
            form.$valid
            && $scope.newTroop
            && ( ! $scope.publicUrl.error )
            && ( ! $scope.publicUrl.duplicate )
          ) {

            createTroop();
          }
        }
        else {
          //do nothing already making a troop
        }

      };

      // $scope.$on('onEnterKey', function(event) {
      //
      //   $timeout(function() {
      //
      //     $scope.save(troopSettingsForm);
      //
      //   }, 0 );
      // });

      this.refreshLabels();

      return;

      function createTroop() {
        TroopLogger.debug(logConfig, 'createTroop()');

        TroopFactory.create({
          troopName: $scope.troop.troopName,
          createdByUserId: Me.trooper.$id
        })
        .then(function addTroopToUser(troopRef) {

          TroopLogger.debug(logConfig, 'addTroopToUser()', that.troopId);
          that.troopRef = troopRef;
          that.troopId = that.troopRef.key;
          that.troopMemberId = generatePushID();

          return TroopApi.addTroop({
            uid: Me.firebaseUser.uid,
            troopId: that.troopId,
            troopPermission: 'admin',
            troopMemberId: that.troopMemberId,
            troopMemberName: Slug.slugify(Me.trooper.name)
          });
        })
        .then(function copyAvatar() {
          TroopLogger.debug(logConfig, 'copyAvatar()');

          return copyTroopMemberAvatar();
        })
        .catch(function failedAvatarCopy(error) {
          TroopLogger.debug(logConfig, 'failedAvatarCopy()', error);
          if ( error && error.code ) {

            switch (error.code) {

              case 'AVATAR_ASSET_DOES_NOT_EXIST':
                // continue forward in promise chain without an assetId
                that.avatarAssetId = null;
                break;

              default:
                // unknown error, skip to end
                return $q.reject(error);
            }
          }
        })
        .then(function createTroopMember() {
          TroopLogger.debug(logConfig, 'createTroopMember()');
          return TroopMemberFactory.create({
            troopMemberId: that.troopMemberId,
            troopId: that.troopId,
            memberName: Slug.slugify(Me.trooper.name),
            userId: Me.firebaseUser.uid,
            name: Me.trooper.name,
            troopPermission: 'admin',
            avatarAssetId: Me.trooper.avatarAssetId
          });
        })
        .then(function generateDefaultBoard(troopMemberRef) {
          TroopLogger.debug(logConfig, 'generateDefaultBoard()');
          that.troopMemberRef = troopMemberRef;

          return BoardFactory.createDefault({
            troopId: that.troopId,
            troopMemberId: that.troopMemberId
          });
        })
        .then(function tryToLoadTroop(boardRef) {
          TroopLogger.debug(logConfig, 'tryToLoadTroop()', that.troopId);

          that.boardRef = boardRef;
          that.boardId = boardRef.key;

          return Me.loadTroop(that.troopId);
        })
        .then(function waitForTroopToLoad() {
          TroopLogger.debug(logConfig, 'waitForTroopToLoad()');

          return Me.troop.$loaded();
        })
        .then(function setDevices() {


            //Me.setDevices(oldTroopId, oldMemberId, that.troopId)


            return;
        })
        .then(function makeTroopPublicAndTryToLoadTroopMember() {
          TroopLogger.debug(logConfig, 'makeTroopPublicAndTryToLoadTroopMember()');

          if ( $scope.troop.public ) {
            TroopLogger.debug(logConfig, 'makeTroopPublicAndTryToLoadTroopMember() - make public');


            TroopApi.makeTroopPublic({
              troopId: that.troopId,
              slug: $scope.publicUrl.troopSlug
            })
            .catch(function brokenDreamCatcher(error) {

              TroopLogger.debug(logConfig, 'makeTroopPublicAndTryToLoadTroopMember() - failed to make troop public', error);
            });
          }

          return Me.loadTroopMember(that.troopId, that.troopMemberId);
        })
        .then(function waitForTroopMemberToLoad() {
          TroopLogger.debug(logConfig, 'waitForTroopMemberToLoad()');

          return Me.troopMember.$loaded();
        })
        .then(function waitForBoardToLoad() {

          return Me.loadBoard(that.troopId, that.boardId);
        })
        .then(function () {

          return Me.currentBoard.$loaded();
        })
        .then(function navToBoard() {

          var firstVisibleView = Me.currentBoard.getFirstVisibleView();

          Nav.toBoard(
            Me.currentBoard.viewMap[firstVisibleView],
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            Me.currentBoard.$id
          );

          $scope.close();
        })
        .catch(function brokenDreamCatcher(error) {

          TroopLogger.debug(logConfig, 'createTroop() - brokenDreamCatcher()', error);
        });
      }

      function copyTroopMemberAvatar() {

        if ( ! Me.troopMember.hasOwnProperty('avatarAssetId') ) {

          return $q.reject({ code: 'AVATAR_ASSET_DOES_NOT_EXIST' });
        }

        TroopLogger.debug(logConfig, 'copyTroopMemberAvatar()', Me.troopMember.troopId, Me.troopMember.avatarAssetId);


        var deferred = $q.defer();

        Ref.child('assets')
          .child(Me.troopMember.troopId)
          .child(Me.troopMember.avatarAssetId)
          .once('value', function(snap) {

            if ( ! snap.exists() ) {
              deferred.reject({ code: 'AVATAR_ASSET_DOES_NOT_EXIST' });
              return false;
            }

            var existingAvatarAsset = snap.val();
            TroopLogger.debug(logConfig, 'copyTroopMemberAvatar() - got existing asset');

            AssetFactory.create({
              troopId: that.troopId,
              createdByUserId: Me.trooper.$id,
              mimeType: existingAvatarAsset.mimeType,
              fileName: existingAvatarAsset.fileName
            })
            .then(function(assetRef) {
              TroopLogger.debug(logConfig, 'copyTroopMemberAvatar() - new asset created');

              that.assetRef = assetRef;
              that.avatarAssetId = assetRef.key;

              return TroopApi.uploadFromUrl({
                url: existingAvatarAsset.originalUrl,
                uid: Me.troopMember.userId,
                assetId: that.avatarAssetId,
                troopId: that.troopId
              });

            })
            .then(function() {
              TroopLogger.debug(logConfig, 'copyTroopMemberAvatar() - file uploaded');

              deferred.resolve();
            })
            .catch(function(error) {

              deferred.reject(error);
            });
          });


        return deferred.promise;
      }
    }
})(); // end of file
