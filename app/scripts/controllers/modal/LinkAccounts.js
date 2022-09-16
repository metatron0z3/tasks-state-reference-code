'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:LinkAccountsModalCtrl
 * @description
 * # LinkAccountsModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
.controller('LinkAccountsModalCtrl', LinkAccountsModalCtrl);

LinkAccountsModalCtrl.$inject = [
  '$scope',
  '$timeout',
  'Me',
  'TroopApi',
  'TroopLogger',
  'close'
];
function LinkAccountsModalCtrl (
  $scope,
  $timeout,
  Me,
  TroopApi,
  TroopLogger,
  close
) {

  var logConfig = {
    slug: 'controllers: LinkAccounts - ',
    path: [ 'controllers', 'modal', 'LinkAccounts.js']
  };


  var vm = this;

  vm.close = closeModal;
  vm.linkOauth = linkOauth;

  activate();

  return;

  function activate() {

    vm.showModal = true;

    $scope.$on('onEscapeKey', function(event) {
      vm.close();
    })
  }

  function closeModal() {

    vm.showModal = false;

    $timeout(function() {
      close();
    }, 800);
  }

  function linkOauth(providerId) {

    var provider = getProvider(providerId);

    Me.firebaseUser.linkWithPopup(provider)
    .then(function(result) {

      TroopLogger.debug(logConfig, 'displayGoogleOauth', 'linkWithPopup', result);
      closeModal();
    })
    .catch(OauthBrokenDreamCatcher);

  }

  function getProvider(providerId) {

    var provider = null;

    switch (providerId) {

      case 'google.com':
        provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/userinfo.email');
        provider.addScope('https://www.googleapis.com/auth/userinfo.profile');
        provider.addScope('https://www.googleapis.com/auth/plus.me');
        provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
        break;

      case 'facebook.com':
        provider = new firebase.auth.FacebookAuthProvider();
        provider.addScope('email');
        provider.addScope('public_profile');
        provider.addScope('user_friends');
        break;

      case 'twitter.com':
        provider = new firebase.auth.TwitterAuthProvider();
        break;

      case 'github.com':
        provider = new firebase.auth.GithubAuthProvider();
        break;
    }

    return provider;
  }


  function OauthBrokenDreamCatcher(error) {


    // Handle Errors here.
    // var errorCode = error.code;
    // var errorMessage = error.message;
    // // The email of the user's account used.
    // var email = error.email;
    // // The firebase.auth.AuthCredential type that was used.
    // var credential = error.credential;

    TroopLogger.debug(logConfig, 'OauthBrokenDreamCatcher', error);
  }

}
