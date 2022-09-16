/* jshint -W014 */

'use strict';

/**
 * @ngdoc service
 * @name webClientApp.SecurityFactory
 * @description
 * # SecurityFactory
 * Factory in the webClientApp.
 */
angular
  .module('webClientApp')
  .factory('SecurityFactory',SecurityFactory);


  SecurityFactory.$inject = [
    'Me',
    'DEMO_TROOP_ID',
    'HELP_TROOP_ID',
    'Auth'
  ];

  function SecurityFactory(
    Me,
    DEMO_TROOP_ID,
    HELP_TROOP_ID,
    Auth
  ) {



    var service = {
      membersDisplayCheck: membersDisplayCheck,
      accountCheck: accountCheck
    };

    return service;



    function membersDisplayCheck() {

      var can = false;

      if ( ! Me.troop ) {
        return false;
      }

      if (
        ( Me.troop.$id !== DEMO_TROOP_ID )
        && ( Me.troop.$id !== HELP_TROOP_ID )
      ) {
        // not DEMO or HELP troop, so members can see members
        can = true;
      }
      else if (
        ( Me.troopMember.troopPermission === 'admin' ) ||
        ( Me.trooper.$id === Me.troop.createdByUserId )
      ) {
        // is DEMO or HELP troop, and users is admin or creator
        can = true;
      }

      // otherwise can not view members
      return can;
    }

    function accountCheck(troopId) {

      var loggedIn = ! Me.firebaseUser.isAnonymous;
      var alreadyMemberOfTroop = false;
      var canJoinTroop = true;

      if (
        loggedIn
        && Me.trooper.hasOwnProperty('troops')
        && Me.trooper.troops.hasOwnProperty(troopId)
      ) {
        alreadyMemberOfTroop = true;

        if ( Me.troopMember.troopPermission === 'banned' ) {
          canJoinTroop = false;
        }
      }


      return {
        loggedIn: loggedIn,
        alreadyMemberOfTroop: alreadyMemberOfTroop,
        canJoinTroop: canJoinTroop
      };
    }
  }
