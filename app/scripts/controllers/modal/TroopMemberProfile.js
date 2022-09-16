'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TroopMemberProfileModalCtrl
 * @description
 * # TroopMemberProfileModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
  .controller(
  'TroopMemberProfileModalCtrl',
  [
    '$scope',
    '$timeout',
    'Me',
    'TroopMemberFactory',
    'TroopLogger',
    'Slug',
    'close',
    'TroopApi',
    function (
      $scope,
      $timeout,
      Me,
      TroopMemberFactory,
      TroopLogger,
      Slug,
      close,
      TroopApi
    ) {
      var logConfig = {
        slug: 'controllers: TroopMemberProfileModalCtrl - ',
        path: [ 'controllers', 'modal',  'TroopMemberProfile.js']
      };
      var that = this;

      $scope.Me = Me;
      $scope.showModal = true;
      $scope.$file = null;
      $scope.hasPassword = false;
      $scope.isProcessing = false;
      $scope.formVals = {
        oldPassword: '',
        newPassword: '',
        errorMsg: ''
      }
      $scope.troopMember = {
        name: '',
        memberName: '',
        title: '',
        blurb: '',
        groupString: '',
        email: ''
      };



      this.init = function() {
        _.each(Me.firebaseUser.providerData, function(provider) {

          if (provider.providerId === 'password') {
            $scope.hasPassword = true;
          }
        })
      }

      this.setTroopMember = function(troopMember) {

        that.origTroopMember = troopMember;

        $scope.troopMember = _.clone(troopMember);
        $scope.groupString = that.generateGroupString($scope.troopMember.groups);


      };
      this.uploadFile = function($file) {

        //refactor to api call!

        // TroopMemberFactory.uploadAvatarAsset({
        //   $file: $file,
        //   troopId: Me.troop.$id,
        //   memberId: $scope.troopMember.$id,
        //   mimeType: $file.type,
        //   fileName: $file.name,
        //   createdByUserId: Me.trooper.$id,
        //   uid: Me.firebaseUser.uid,
        //   token: Me.firebaseUser.token
        // })

        TroopApi.uploadAvatar({
            $file: $file
        })
        .then(function(resp) {

          //console.log(resp);

          $scope.$file = null;
          // $file.progress = 0;

          // assetRef.child('/upload/state').on('value', function(snap) {
          //
          //   if ( snap.exists() ) {
          //
          //     var state = snap.val();
          //
          //     if (
          //       state
          //       && 'finished' === state
          //     ) {
          //       $scope.$file = null;
          //       $scope.close();
          //     }
          //   }
          // });
        })
        .catch(function(error) {

          console.log(error);
        });



      };
      this.updateTroopMember = function() {
        // var groups = that.parseGroupString($scope.troopMember.groupString);

        //refactor to API call
        $scope.isProcessing = true;

        TroopMemberFactory.update({
          troopId: $scope.troopMember.troopId,
          avatarAssetId: $scope.troopMember.avatarAssetId || null,
          memberId: $scope.troopMember.$id,
          memberName: $scope.troopMember.memberName,
          name: $scope.troopMember.name,
          title: $scope.troopMember.title || null,
          blurb: $scope.troopMember.blurb || null
        })
        .then(function() {
          TroopLogger.debug(logConfig, 'member updated')
          if (
            $scope.formVals.oldPassword &&
            $scope.formVals.newPassword )
            {
              that.updatePassword()
            }
          else {
            $scope.close();
            if ( ! $scope.$file ) {
              $scope.close();
            }
          }
        })
      };
      this.updatePassword = function() {
        //sign in with email/password again to make sure the pass is valid

        firebase.auth().signInWithEmailAndPassword(Me.firebaseUser.email, $scope.formVals.oldPassword)
        .then(function() {
          TroopLogger.debug(logConfig, 'password verified')
          Me.firebaseUser.updatePassword($scope.formVals.newPassword)
          .then(function() {
            //update pass
            TroopLogger.debug(logConfig, 'password updated');
            $scope.close();
          }, function(error) {
              $scope.formVals.errorMsg = error.code;
          });
        })
        .catch(function(error) {
          $timeout(function() {
            $scope.formVals.errorMsg = error.code;
            $scope.isProcessing = false;
          }, 0);
        })
      }
      this.parseGroupString = function(groupString) {
        // process groups string

        if ( ( ! groupString ) || groupString.indexOf('@') === -1 ) {
          return null;
        }

        var groupArray = groupString.split("@");
        var groupObj = {};
        _.each(groupArray, function(group) {
          group = $.trim(group);
          if (',' === group.slice(-1)) {
            group = group.slice(0, -1);
          }

          if (group) {
            var colonIndex = group.indexOf(':');

            var groupName;
            var groupValue;

            if (colonIndex === -1) {
              groupName = group;
              groupValue = '';
            }
            else {
              groupName = group.substr(0, colonIndex);
              groupValue = group.substr(colonIndex + 1);
            }

            var groupIntValue = parseInt(groupValue);
            var groupFloatValue = parseFloat(groupValue);


            if (groupValue.indexOf('"') !== -1) {
              // quotes found, must be string, remove quotes
              groupValue = groupValue.replace(/"/g, '');

              // TODO: check for date string
            }
            else if (isNaN(groupIntValue)) {
              // not a number, must be string

              // TODO: check for date string
            }
            else if (groupIntValue === groupFloatValue) {
              // must be int
              groupValue = groupIntValue;
            }
            else if (groupIntValue !== groupFloatValue) {
              // must be float
              groupValue = groupFloatValue;
            }

            // slugify name
            groupName = Slug.slugify(groupName);

            groupObj[groupName] = groupValue;
          }

        });

        return groupObj;
      };
      this.generateGroupString = function(groupObj) {
        var groups = '';

        _.each(groupObj, function(groupValue, groupName) {
          groups += '@' + groupName;

          if (groupValue) {
            groups += ':' + groupValue;
          }

          groups += ' ';
        });

        return groups;
      },

      $scope.updateErrors = function() {
        $timeout(function() {
          $scope.formVals.errorMsg = '';
        }, 0);
      }

      $scope.close = function() {
        $scope.showModal = false;
        $timeout(function() {
          $scope.isProcessing = false;
          close();
        }, 800);

      }


      $scope.save = function(form) {

        if (form.$valid) {

          if ($scope.$file) {

            that.uploadFile($scope.$file);
          }

          that.updateTroopMember();
        }
      };
      $scope.fileAdded = function($file) {
        $scope.$file = $file;
      }

      $scope.$on('onEnterKey', function(event) {

        $timeout(function() {

          $scope.save(troopMemberProfileForm);

        }, 0 );
      });

      $scope.$on('onEscapeKey', function(event) {
        $scope.close();
      })

      that.init()

    }
  ]
);
