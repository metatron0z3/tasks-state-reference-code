/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */

/**
 * @ngdoc function
 * @name webClientApp.directive:tpCardNote
 * @description
 * # tpCardNote
 */
angular.module('webClientApp')
.directive('tpCardNote', [
  '$filter',
  function(
    $filter
  ) {

    var controller = [
      '$rootScope',
      '$scope',
      '$element',
      '$attrs',
      '$timeout',
      '$firebaseObject',
      '$firebaseUtils',
      '$log',
      '$state',
      'Ref',
      'Me',
      'Nav',
      'FileFactory',
      'TroopMemberFactory',
      'ModalService',
      'WEB_SERVER_URL',
      'UAParser',
      function (
        $rootScope,
        $scope,
        $element,
        $attrs,
        $timeout,
        $firebaseObject,
        $firebaseUtils,
        $log,
        $state,
        Ref,
        Me,
        Nav,
        FileFactory,
        TroopMemberFactory,
        ModalService,
        WEB_SERVER_URL,
        UAParser
      ) {
        $scope.editing = false;
        $scope.Me = Me;
        $scope.noteMenus = {};
        $scope.needsOverflow = false;
        $scope.noteEntryTypingDebounce = null;

        $scope.mobile = ('iOS' === UAParser.os.name) || ('Android' === UAParser.os.name);

        $scope.$note = new $firebaseObject.$extend({

          $loaded: function(resolve, reject) {
            var promise = this.$$conf.sync.ready();

            var that = this;
            that.troopId = $scope.note.troopId;
            that.cardId = $scope.note.cardId;


            promise.then(function() {
              //... do something
              $timeout(function() {
              },0);
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

              this.troopId = $scope.note.troopId;
              this.cardId = $scope.note.cardId;

            }

            // return whether or not changes occurred
            return changed;
          },
          $save: function () {

            var self = this;
            var ref = self.$ref();
            var data = $firebaseUtils.toJSON(self);

            data.updatedAt = firebase.database.ServerValue.TIMESTAMP;

            return $firebaseUtils.doSet(ref, data).then(function() {
              self.$$notify();
              return self.$ref();
            });
          },
          $$error: function (err) {
            console.log('tpCardNote', this.$ref().toString(), $.extend({}, err));
            // prints an error to the console (via Angular's logger)
            // $log.error(err);
            // frees memory and cancels any remaining listeners
            this.$destroy(err);
          },
        })(
          Ref.child('cards')
            .child($scope.note.troopId)
            .child($scope.note.cardId)
            .child('notes')
            .child($scope.note.$id)
        );
        var $parent = $element.parent();

        $element.attr('id', $scope.note.$id);

        $scope.$note.$loaded().then(function() {
          // plug to ensure firing of $loaded in extended object
          $scope.noteAuthor = TroopMemberFactory.getFirebaseObjectByKey(
            $scope.$note.troopId,
            $scope.$note.memberId
          );

          $scope.noteAuthor.$loaded()
          .then(function() {
            if(Me.troopMember.$id !== $scope.$note.memberId
              && Me.screen.width > 1024
              && ! $scope.mobile )
            {
              $scope.authorLink = '[' + $scope.noteAuthor.name + '](' + WEB_SERVER_URL + '/dashboard/troopMember/' + $scope.noteAuthor.$id + '/chat)  '
            }
            else {
              $scope.authorLink = '**' + $scope.noteAuthor.name + '**  ';
            }
          })

          $scope.$note.cleanedText = $scope.$note.text;
          if ($state.current.name === 'home.dashboard.board.cards' && $scope.$note.text.length > 140) {
            $scope.needsOverflow = true;
            $scope.$note.cleanedText = $scope.$note.text.substring(0, 140) + '...'  ;
          }

          if ($scope.$note.cleanedText.charAt(0) === '#'
             || $scope.$note.cleanedText.charAt(0) === '*'
             || $scope.$note.cleanedText.charAt(0) === '+'
             || $scope.$note.cleanedText.charAt(0) === '-'
             || $scope.$note.cleanedText.charAt(0) === '>'
             || $scope.$note.cleanedText.charAt(0) === '_'
             || $scope.$note.cleanedText.charAt(0) === '['
             || $scope.$note.cleanedText.charAt(0) === '`'
             || $scope.$note.cleanedText.charAt(0) === '!'
             || ($scope.$note.cleanedText.charAt(0).match(/[1-9]/g)) ) {
            $scope.$note.cleanedText = '\n' + $scope.$note.text;
          }


        });
        $scope.navToDetailCard = function(note) {

          Nav.toBoardCard(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            Me.currentBoard.$id,
            note.cardId
          );
          //
          // $state.go('home.dashboard.board.card', {
          //   boardId: Me.currentBoard.$id,
          //   cardId: card.$id
          // });

          Me.multiCardScrollY = $('[data-ui-view=dashboardContent] > ul').scrollTop();
        };
        $scope.showDeleteCardNoteModal = function() {

          if ( Me.modalIsOn ) {

            return;
          }

          ModalService.showModal({
            templateUrl: '/views/modal/delete.html',
            controller: 'DeleteModalCtrl as vm'
          })
          .then(function(modalCtrl) {

            modalCtrl.controller.extraClasses = 'delete-card-note-modal';
            modalCtrl.controller.header = 'Delete Note';
            modalCtrl.controller.actionTaken = ' Delete ';
            modalCtrl.controller.element = ' Note';

            if ($scope.$note.text) {

              modalCtrl.controller.message =
                'Are you sure you want to delete the "<b>'
                + $scope.$note.text
                + '</b>" note?';
            }
            else {

              modalCtrl.controller.message =
                'Are you sure you want to delete this note?';
            }



            modalCtrl.controller.cancel = function() {

              modalCtrl.controller.closeModal();
            };

            modalCtrl.controller.remove = function() {

              $scope.$note.$remove()
              .then(function() {

                modalCtrl.controller.closeModal();
              });
            };
          });
        };
        $scope.navToTroopMember = function() {

          if (Me.troopMember.$id === $scope.$note.memberId
             || Me.screen.width < 1025 ) {
            return false;
          }

          Me.loadCurrentTroopMember($scope.$note.memberId);
          Nav.toMemberChat(
            Me.troop.public,
            Me.troopMember.troopPermission !== 'guest',
            $scope.$note.memberId
          );

        };
        $scope.edit = function() {


          $scope.noteMenus[$scope.note.$id] = false;
          $scope.oldText = $scope.$note.text;
          $scope.editing = true;
          $element.addClass('editing');
        };
        $scope.save = function() {
          $scope.$note.$save();
          $scope.oldText = null;
          $scope.editing = false;
          Me.setCurrentNoteEntry('', $scope.$note.cardId);
          $element.removeClass('editing');
        };
        $scope.cancel = function() {

          $scope.$note.text = $scope.oldText;
          Me.setCurrentNoteEntry('', $scope.$note.cardId);
          $scope.oldText = null;
          $scope.editing = false;
          $element.removeClass('editing');
        };
        $scope.noteEntryTyping = function() {


          if ( $scope.noteEntryTypingDebounce ) {
            $timeout.cancel($scope.noteEntryTypingDebounce);
          }

          $scope.noteEntryTypingDebounce = $timeout(function(){


            Me.setCurrentNoteEntry($scope.$note.text, $scope.$note.cardId)

            $scope.noteEntryTypingDebounce = null;

          }, 1000);
        };

        if ( Me.troopMember.$id === $scope.note.memberId ) {

          $element.addClass('mine');
        }

        $scope.$watch('note', function() {

          var $mainParent = $parent.parent().parent();

          if ($scope.isLast) {

            // $timeout(function() {
            //   $mainParent.scrollTop($mainParent[0].scrollHeight);
            //   //$parent.scrollTop($parent[0].scrollHeight+100);
            // }, 100);
          }

        });


        $scope.$on('$destroy', function() {

          $scope.$note.$destroy();

        });
      }
    ];

    return {
      restrict: 'A',
      scope: {
        note: '=tpCardNote',
        isSearchResult: '=tpCardNoteSearchResult',
        isFirst: '=tpCardNoteFirst',
        isLast: '=tpCardNoteLast',
        showHeaderInfo: '=tpCardNoteHeaderInfo',
        triggerScroll: '=tpCardNoteScrollToWhen'
      },
      controller: controller,
      templateUrl: '/views/directives/troop/tp-card-note.html'
    };

  }
]);
