/**
 * @ngdoc function
 * @name webClientApp.directive:tpTroop
 * @description
 * # tpTroop
 * A directive that sets focus on first input element of every form
 */
angular.module('webClientApp')
.directive('tpTroop', [

  function(

  ) {
    var logConfig = {
      slug: 'directive: tpTroop - ',
      path: [ 'directives', 'troop', 'tpTroop.js']
    };

    var controller = [
      '$rootScope',
      '$scope',
      '$element',
      '$attrs',
      '$timeout',
      '$firebaseObject',
      '$firebaseArray',
      'TroopFirebaseObject',
      'Ref',
      'Me',
      'TroopLogger',
      function (
        $rootScope,
        $scope,
        $element,
        $attrs,
        $timeout,
        $firebaseObject,
        $firebaseArray,
        TroopFirebaseObject,
        Ref,
        Me,
        TroopLogger
      ) {

        var that = this;
        this.unWatchTroopChanges = null;

        $scope.Me = Me;

        this.onTroopChange = function() {

          Me.troop.$loaded()
          .then(function() {

            TroopLogger.debug(logConfig, 'onTroopChange()', 'Me.troop.$id: ' + Me.troop.$id, ' | $scope.$troop.$id: ' + $scope.$troop.$id);

          if (Me.troop.$id === $scope.$troop.$id) {

              $element.addClass('active');
            }
            else {

              $element.removeClass('active');
            }

          });


        };

        if ( $scope.troop instanceof $firebaseObject ) {

          $scope.$troop = $scope.troop;
        }
        else {
          // firebase object not passed in, assume id string
          $scope.$troop = new TroopFirebaseObject(
            Ref.child('troops')
            .child($scope.troop)
          );
        }

        $scope.$troop.$loaded()
        .then(function() {

          TroopLogger.debug(logConfig, '$scope.$troop.$loaded()', $scope.$troop.$id);

          that.onTroopChange();

          $element.attr('title', $scope.$troop.troopName);

          that.unWatchTroopChanges = $scope.$on('troop-changed', that.onTroopChange);
        });

        Me.$doneTryingToLoadNotifications()
        .then(function() {

          if (Me.troopMember.troopPermission !== 'guest' ){

            var troopMemberId = Me.trooper.troops[$scope.$troop.$id].memberId;
            $scope.troopMemberNotifications = Me.notifications[troopMemberId];
          }
        });


        $scope.$on('$destroy', function() {

          if ( that.unWatchTroopChanges ) {
            that.unWatchTroopChanges();
          }

          if ( $scope.$troop !== $scope.troop ) {
            // if this directive created the TroopFirebaseObject
            // then lets destroy it here
            $scope.$troop.$destroy();
          }


        });
      }
    ];

    return {
      restrict: 'A',
      scope: {
        troop: '=tpTroop'
      },
      controller: controller,
      templateUrl: '/views/directives/troop/tp-troop.html'

    };


  }
]);
