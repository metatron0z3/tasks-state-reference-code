/* global Firebase, _ */
/* jshint strict: true */
/* jshint -W014 */
(function() {
  'use strict';

  /**
   * @ngdoc function
   * @name webClientApp.controller:AffiliateHeaderCtrl
   * @description
   * # AffiliateHeaderCtrl
   * Controller of the webClientApp
   */
   angular
   .module('webClientApp')
   .controller('AffiliateHeaderCtrl', AffiliateHeaderCtrl);

   AffiliateHeaderCtrl.$inject = [
     '$scope',
     'Me'
   ];

   return;

   function AffiliateHeaderCtrl(
     $scope,
     Me
   ) {

     var vm = this;
     vm.Me = Me;

     vm.navToTroopDashboard = navToTroopDashboard;


     return;

     function navToTroopDashboard() {
       
       Me.redirect(Me.trooper.$id);
     }
   }



})();
