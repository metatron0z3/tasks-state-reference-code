
(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:HomeCtrl
   * @description
   * # HomeCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('HomeCtrl', HomeCtrl);

  HomeCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$localStorage',
    'Me',
    'ModalService',
    'TROOP_VIDEO_1_URL'
  ];


  return;

  function HomeCtrl (
    $scope,
    $rootScope,
    $localStorage,
    Me,
    ModalService,
    TROOP_VIDEO_1_URL
  ) {

    var vm = this;

    vm.showAssetModal = showAssetModal;

    activate();

    return;

    function activate() {

      $rootScope.showLoader = false;
      $localStorage.lastInviteToken = null;
    }

    function showAssetModal() {

      if ( Me.modalIsOn ) {

        return;
      }

      ModalService.showModal({
        templateUrl: '/views/modal/multimedia.html',
        controller: 'MultimediaModalCtrl'
      })
      .then(function(modal) {
        var asset = {
          mimeType: 'video/mp4',
          fileType: 'file-video',
          originalUrl: TROOP_VIDEO_1_URL
        };

        modal.controller.setData({
          asset: asset
        });
      });
    }
  }

})();
