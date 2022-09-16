/* global _, $, URI */
/* jshint strict: true */
/* jshint -W014 */

(function() {

  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:TrackingCodeModalCtrl
   * @description
   * # TrackingCodeModalCtrl
   * Controller of the webClientApp
   */
  angular
  .module('webClientApp')
  .controller('TrackingCodeModalCtrl', TrackingCodeModalCtrl);

  TrackingCodeModalCtrl.$inject = [
    '$scope',
    '$rootScope',
    '$localStorage',
    '$timeout',
    'Me',
    'TroopApi',
    'Ref',
    'Slug',
    'close'
  ];

  function TrackingCodeModalCtrl(
    $scope,
    $rootScope,
    $localStorage,
    $timeout,
    Me,
    TroopApi,
    Ref,
    Slug,
    close
  ) {

    var vm = this;

    vm.Me = Me;
    vm.isSaving = false;
    vm.showModal = true;
    vm.isExistingSlug = false;
    vm.newCode = '';
    vm.oldCode = '';

    vm.closeModal = closeModal;
    vm.save = save;

    // $scope.$on('onEnterKey', function(event) {
    //
    //   $timeout(function() {
    //
    //     vm.save($scope.trackingCodeModalForm);
    //
    //   }, 0 );
    // });
    //
    $scope.$on('onEscapeKey', function(event) {
      vm.closeModal();
    });

    return;

    function closeModal() {

      vm.showModal = false;
      $timeout(function() {

        close();
      }, 800);

    }

    function save(form) {

      form.$setSubmitted();

      if ( form.$invalid ) {

        _.each(form.$error, function( errors, errorType) {

          _.each(errors, function(field) {

            field.$setDirty();
            field.$setTouched();
          });
        });

        return false;
      }

      vm.isSaving = true;
      vm.isExistingSlug = false;
      vm.oldCode = '';

      var codeSlug = Slug.slugify(vm.newCode);

      TroopApi.validateTrackingCode({
        code: codeSlug
      })
      .then(function(resp) {
        
        if ( resp.data === codeSlug ) {
          assignTrackingCode(codeSlug);
        }
        else {

          $timeout(function() {
            vm.isExistingSlug = true;
            vm.oldCode = codeSlug;
            vm.newCode = resp.data;
          });
        }
      })
      .catch(function(error) {

        console.log(error);
      })


    }

    function assignTrackingCode(codeSlug) {

      Ref.child('trackingCodes')
      .child(codeSlug)
      .set({
        userId: Me.trooper.$id,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });

      closeModal();
    }

  }

})();
