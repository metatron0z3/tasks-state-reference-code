/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

/**
 * @ngdoc function
 * @name webClientApp.directive:tpChatEntry
 * @description
 * # tpChatEntry
 */
angular
  .module('webClientApp')
  .directive('tpChatEntry', tpChatEntry);

  //tpChatEntry.$inject = [];
  function tpChatEntry(){
    return {
      restrict: 'A',
      scope: {
        entry: '=tpChatEntry',
        isSearchResult: '=tpChatEntrySearchResult',
        isFirst: '=tpChatEntryFirst',
        isLast: '=tpChatEntryLast',
        previousEntry: '=tpChatEntryPrevious',
        asset: '=tpChatEntryAsset',
        showHeaderInfo: '=tpChatEntryHeaderInfo',
        triggerScroll: '=tpChatEntryScrollToWhen'
      },
      controller: tpChatEntryController,
      templateUrl: '/views/directives/troop/tp-chat-entry.html'
    };
  }


  tpChatEntryController.$inject = [
    '$rootScope',
    '$scope',
    '$state',
    '$element',
    '$attrs',
    '$timeout',
    '$firebaseObject',
    '$firebaseUtils',
    '$filter',
    '$log',
    'Ref',
    'Me',
    'Nav',
    'FileFactory',
    'ChatEntryFactory',
    'ModalService',
    'SecurityFactory',
    'TroopLogger'
  ];

  function tpChatEntryController(
    $rootScope,
    $scope,
    $state,
    $element,
    $attrs,
    $timeout,
    $firebaseObject,
    $firebaseUtils,
    $filter,
    $log,
    Ref,
    Me,
    Nav,
    FileFactory,
    ChatEntryFactory,
    ModalService,
    SecurityFactory,
    TroopLogger
  ) {

    var logConfig = {
      slug: 'directive: tpChatEntry - ',
      path: [ 'directives', 'troop', 'tpChatEntry.js']
    };

    var that = this;
    this.canNavToMember = null;
    this.$troopMember = null;


    $scope.editing = false;
    $scope.Me = Me;
    $scope.chatMenus = {};
    $scope.$entry = new $firebaseObject.$extend({
      $loaded: function(resolve, reject) {
        var promise = this.$$conf.sync.ready();

        var that = this;
        that.troopId = $scope.entry.troopId;


        promise.then(function() {
          //... do something
        });

        if (arguments.length) {
          // allow this method to be called just like .then
          // by passing any arguments on to .then
          promise = promise.then.call(promise, resolve, reject);
        }
        return promise;
      },
      // each time an update arrives from the server, apply the change locally

      $$updated: function(snap) {
        // apply the changes using the super method
        var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);

        if (changed) {

          this.troopId = $scope.entry.troopId;
        }

        // return whether or not changes occurred
        return changed;
      },
      $save: function () {
        var self = this;
        var ref = self.$ref();
        var data = $firebaseUtils.toJSON(self);

        delete data.troopId;

        data.updatedAt = firebase.database.ServerValue.TIMESTAMP;

        return $firebaseUtils.doSet(ref, data).then(function() {
          self.$$notify();
          return self.$ref();
        });
      },
      $$error: function (err) {
        TroopLogger.debug(logConfig, 'tpChatEntry', this.$ref().toString(), $.extend({}, err))
        // prints an error to the console (via Angular's logger)
        $log.error(err);
        // frees memory and cancels any remaining listeners
        this.$destroy(err);
      },
    })(
      Ref.child('chatEntries')
        .child($scope.entry.troopId)
        .child($scope.entry.$id)
    );

    var $parent = $element.parent();

    $element.attr('id', $scope.entry.$id);

    $scope.showDeleteChatEntryModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/delete.html',
        controller: 'DeleteModalCtrl as vm'
      }).then(function(modalCtrl) {

        modalCtrl.controller.extraClasses = 'delete-chat-entry-modal'
        modalCtrl.controller.header = 'Delete Message';
        modalCtrl.controller.actionTaken = ' Delete ';
        modalCtrl.controller.element = ' Message';

        if ($scope.$entry.text) {
          modalCtrl.controller.message =
            'Are you sure you want to delete the message?';
        }
        else {
          modalCtrl.controller.message =
            'Are you sure you want to delete this message?';
        }



        modalCtrl.controller.cancel = function() {
          modalCtrl.controller.closeModal();
        };

        modalCtrl.controller.remove = function() {

          ChatEntryFactory.delete($scope.$entry)
            .then(function() {

              if ($scope.$entry.assetId) {

                return AssetFactory.delete({
                  assetId: $scope.$entry.assetId
                });

              }

            })
            .then(function() {
              modalCtrl.controller.closeModal();
            });
          };
      });
    };

    $scope.showAssetsModal = function() {

      if ( Me.modalIsOn ) {

        return;
      }

      Ref.child('assets')
        .child($scope.entry.troopId)
        .child($scope.entry.assetId)
        .once('value', function(snap) {

          if ( snap.exists() ) {

            var asset = snap.val();
            asset.$id = snap.key;
            asset.troopId = $scope.$entry.troopId;
            var mimeType = asset.mimeType;

            if ( ! mimeType && asset.fileName ) {
              var ext = asset.fileName.split('.').pop();
              mimeType = MIME_TYPES[ext];
            }

            var fileType = null;
            if ( mimeType ) {
              fileType = FileFactory.fileTypeClass(mimeType);
            }

            if (
              ( asset.metaData && asset.metaData.videoIframe )
              || 'file-video' === fileType
            ) {
              ModalService.showModal({
                templateUrl: '/views/modal/multimedia.html',
                controller: 'MultimediaModalCtrl'
              }).then(function(modal) {

                asset.mimeType = mimeType;
                asset.fileType = fileType;

                modal.controller.setData({
                  asset: asset
                });

                modal.close.then(function(result) {

                });

              });
            }
            else if (FileFactory.isImageFileType(mimeType)) {
              ModalService.showModal({
                templateUrl: '/views/modal/assets.html',
                controller: 'AssetsModalCtrl'
              }).then(function(modal) {

                var cardAssets = {};
                cardAssets[asset.$id] = asset;


                modal.controller.setData({
                  card: {
                    assets: cardAssets
                  },
                  assetId: asset.$id,
                  troopId: $scope.$entry.troopId
                });

                modal.close.then(function(result) {

                });

              });
            }
            else {
              window.open(asset.originalUrl, '_blank');
              //win.focus();
            }

          }

        });
    };

    $scope.navToTroopMember = function() {

      if (Me.troopMember.$id === $scope.$entry.memberId) {

        return false;
      }

      if ( that.canNavToMember ) {

        Me.loadCurrentTroopMember($scope.$entry.memberId);
        Nav.toMemberChat(
          Me.troop.public,
          Me.troopMember.troopPermission !== 'guest',
          $scope.$entry.memberId
        );
        // $state.go('home.dashboard.troopMember.chat', { troopMemberId: $scope.$entry.memberId });
      }
    };
    $scope.edit = function() {

      $scope.oldText = $scope.$entry.text;
      $scope.editing = true;
      $element.addClass('editing');
    };
    $scope.save = function() {

      $scope.$entry.$save();
      $scope.oldText = null;
      $scope.editing = false;
      $element.removeClass('editing');
    };
    $scope.cancel = function() {

      $scope.$entry.text = $scope.oldText;
      $scope.oldText = null;
      $scope.editing = false;
      $element.removeClass('editing');
    };

    if ( Me.troopMember.$id === $scope.entry.memberId ) {

      $element.addClass('mine');
    }

    $scope.$watch('asset', function() {

      if ( ! $scope.asset ) {
        return false;
      }



      $element.addClass($scope.asset.fileType);
      if ($scope.asset.fileType === 'file-image') {

        $element.removeClass('file-non-image');
        $element.addClass('file-image');
      }
      else {

        $element.removeClass('file-image');
        $element.addClass('file-non-image');
      }
    });

    $scope.$watch('entry', function() {

      if ($scope.isLast) {

        $timeout(function() {

          $parent.scrollTop($parent[0].scrollHeight);
        }, 100);
      }

      TroopLogger.debug(logConfig, $scope.entry.prevEntry);

      if ($scope.entry.prevEntry) {

        $scope.$entry.$loaded().then(function() {


          TroopLogger.debug(logConfig, 'prevEntryDayOfYear',moment($scope.entry.prevEntry.createdAt).format('DDD'));


          var prevEntryDayOfYear = moment($scope.entry.prevEntry.createdAt).format('DDD');
          var currEntryDayOfYear = moment($scope.$entry.createdAt).format('DDD');
          var dayDiff = currEntryDayOfYear - prevEntryDayOfYear;

          var today = moment(Date.now()).format('DDD');

          var text;
          if ( today === currEntryDayOfYear ) {
            text = 'Today';
          }
          else if ( ( today - currEntryDayOfYear ) === 1 ) {
            text = 'Yesterday';
          }
          else {
            text = $filter('moment')($scope.$entry.createdAt, 'MMM DD, YYYY');
          }

          TroopLogger.debug(logConfig, 'dayDiff',dayDiff);

          if (dayDiff > 0) {
            $element.prepend(
              '<div class="date-spacer">' +
                '<div class="wrapper flex-row">' +
                  '<span class="text">' +
                    text +
                  '</span>' +
                '</div>' +
              '</div>'
            );
            $element.addClass('has-date-spacer');
          }
        });
      }
      else if ( $scope.isFirst ) {
        $element.prepend(
          '<div class="date-spacer">' +
            '<div class="wrapper flex-row">' +
              '<span class="text">' +
                $filter('moment')($scope.entry.createdAt, 'MMM DD, YYYY') +
              '</span>' +
            '</div>' +
          '</div>'
        );
        $element.addClass('has-date-spacer');
      }

    });

    $scope.$on('$destroy', function() {

      $scope.$entry.$destroy();

    });

    Me.$doneTryingToLoadTroopMembers()
    .then(function() {

      return Me.troopMembers.$loaded();
    })
    .then(function() {

      return $scope.$entry.$loaded();
    })
    .then(function() {
      that.$troopMember = Me.troopMembers.$getRecord($scope.$entry.memberId);

      that.canNavToMember = SecurityFactory.membersDisplayCheck();

      if (
        ( that.canNavToMember === false )
        && (
          ( that.$troopMember.troopPermission === 'admin' )
          || ( that.$troopMember.userId === Me.troop.createdByUserId )
        )
      ) {

        that.canNavToMember = true;
      }

      if ( that.canNavToMember ) {

        $element.addClass('can-nav-to');
      }

    });
  }

})(); // end of file
