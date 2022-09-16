'use strict';

/**
 * @ngdoc directive
 * @name webClientApp.directive:tpTroopMemberProfile
 * @description
 * # tpTroopMemberProfile
 */
angular.module('webClientApp').directive(
  'tpTroopMemberProfile',
  [
    'Ref',
    function tpTroopMemberProfile(
      Ref
    ) {

      var uniqueId = 1;

      var controller = [
        '$scope',
        '$element',
        '$timeout',
        'Me',
        'TroopMemberFactory',
        'DEFAULT_AVATAR_ICON_URL',
        'ANIMAL_AVATARS',
        function tpTroopMemberProfileController(
          $scope,
          $element,
          $timeout,
          Me,
          TroopMemberFactory,
          DEFAULT_AVATAR_ICON_URL,
          ANIMAL_AVATARS
        ) {
          var that = this;
          that.unwatchTroopMemberId = null;
          this.lastAvatarAssetId = null;

          $scope.uniqueId = uniqueId++;
          $scope.troopMemberLoaded = false;
          $scope.$troopMember = null;

          this.generateAvatar = TroopMemberFactory.generateAvatar;

          // function() {
          //
          //   var memberIdMD5 = CryptoJS.MD5($scope.troopMemberId).toString();
          //   var index = parseInt(memberIdMD5.charCodeAt(0)) % ANIMAL_AVATARS.length;
          //
          //   return ANIMAL_AVATARS[index];
          // }

          $scope.defaultAvatarIconUrl = this.generateAvatar($scope.troopMemberId);

          that.unwatchTroopMemberId = $scope.$watch('troopMemberId', function() {

            if ( ! ( $scope.troopId && $scope.troopMemberId ) ) {
              // if troop id or member id isn't loaded yet then lets wait for both of them
              return false;
            }

            var oldTroopMember = null;

            if ( $scope.$troopMember ) {

              if ( $scope.$troopMember.$id === $scope.troopMemberId ) {
                // member already loaded
                return false;
              }

              oldTroopMember = $scope.$troopMember;
            }

            $scope.troopMemberLoaded = false;
            $scope.$troopMember = TroopMemberFactory.getFirebaseObjectByKey($scope.troopId, $scope.troopMemberId);

            if ( oldTroopMember ) {

              oldTroopMember.$destroy();
            }

            $scope.$troopMember.$loaded().then(function() {
              // if ( $scope.$troopMember.userId ) {
              //
              //     Ref.child('users')
              //     .child($scope.$troopMember.userId)
              //     // .child('')
              //     .once('value')
              //     .then(function(snap){
              //       if ( snap.exists() ) {
              //         $scope.$troopMember.avatarAssetId = snap.val().avatarAssetId;
              //         //console.log(snap.val().avatarAssetId);
              //       }
              //     });
              //
              // }

              $scope.troopMemberLoaded = true;
              that.lastAvatarAssetId = $scope.$troopMember.avatarAssetId;
            });
          });

          $scope.$on('$destroy', function() {

            if (that.unwatchTroopMemberId) {

              that.unwatchTroopMemberId();
              that.unwatchTroopMemberId = null;
            }

            if ( $scope.$troopMember ) {
              $scope.$troopMember.$destroy();
              $scope.$troopMember = null;
            }

          });

        }
      ];

      return {
        restrict: 'A',
        scope: {
          troopMemberId: '=tpTroopMemberProfile',
          troopId: '=tpTroopMemberTroopId'
        },
        controller: controller,
        templateUrl: '/views/directives/troop/tp-troop-member-profile.html'
      };
    }
  ]
);
