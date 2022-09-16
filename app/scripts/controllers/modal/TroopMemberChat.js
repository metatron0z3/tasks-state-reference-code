'use strict';

/**
 * @ngdoc function
 * @name webClientApp.controller:TroopMemberChatModalCtrl
 * @description
 * # TroopMemberChatModalCtrl
 * Controller of the webClientApp
 */
angular.module('webClientApp')
    .controller(
    'TroopMemberChatModalCtrl',
    [
      '$rootScope',
      '$scope',
      '$timeout',
      'Me',
      'ChatFactory',
      'ChatEntryFactory',
      'close',
      function (
        $rootScope,
        $scope,
        $timeout,
        Me,
        ChatFactory,
        ChatEntryFactory,
        close
      ) {

        var that = this;
        that.chatId = null;

        $scope.showModal = true;
        $scope.chatEntries = [];
        $scope.Me = Me;
        $scope.chatMenus = {};
        $scope.labels = {};
        $scope.currentTroopMember = null;
        $scope.entryToDelete = null;
        $scope.emptyInfo = {
          title: 'Empty chat title',
          description: 'Empty chat description'
        };
        $scope.modalData = {
          chatEntry: null,
          loading: false,
          isConfirmDelete: false
        };

        this.refreshLabels = function() {
          $scope.labels = {
            chatEntry: !$scope.modalData.chatEntry,

          };
        };
        that.setMember = function(member) {
          $scope.currentTroopMember = member;

          $scope.emptyInfo = {
            title: member.name,
            description: member.title
          };

          that.setChatEntries();
        };
        this.refreshLabels = function() {
          $scope.labels = {
            chatEntry: ! $scope.modalData.chatEntry
          };
        };
        this.setChatEntries = function() {

          if (
            Me.troopMember.memberChats
            && Me.troopMember.memberChats[$scope.currentTroopMember.$id]
          ) {
            that.chatId = Me.troopMember.memberChats[$scope.currentTroopMember.$id];

            $scope.chatEntries = ChatEntryFactory.getEntries(that.chatId);

            $scope.modalData.loading = false;

          }
          else {

            var chatRef = ChatFactory.create(
              {
                troopId: Me.troop.$id,
                memberId: Me.troopMember.$id,
                talkingToTroopMemberId: $scope.currentTroopMember.$id
              },
              function() {
                that.chatId = chatRef.key;

                $scope.chatEntries = ChatEntryFactory.getEntries(that.chatId);

                $scope.modalData.loading = false;
              }
            );
          }


        };

        $scope.close = function() {
          $scope.showModal = false;

          $timeout(close, 800);

        };
        $scope.hideLabel = function(labelName) {
          $scope.labels[labelName] = false;
        };
        $scope.showLabel = function(labelName) {
          $scope.labels[labelName] = true;
        };
        $scope.chatEntrySubmit = function() {

          if ( $scope.modalData.chatEntry ) {

            var chatEntryRef = ChatEntryFactory.create(
              {
                chatId: that.chatId,
                memberId: Me.troopMember.$id,
                text: $scope.modalData.chatEntry
              },
              function() {

              }
            );
          }
          $scope.modalData.chatEntry = '';
        };
        $scope.chatEntryBlur = function() {

          if ( ! $scope.modalData.chatEntry ) {
            $scope.showLabel('chatEntry');
          }

        };
        $scope.confirmEntryDelete = function(entry) {

          $scope.chatMenus[entry.$id] = false;
          $scope.modalData.isConfirmDelete = true;

          $scope.entryToDelete = entry;
        };
        $scope.acceptEntryDelete = function() {

          ChatEntryFactory.delete($scope.entryToDelete, function() {

            $scope.modalData.isConfirmDelete = false;
          });
        };



        this.refreshLabels();



      }
    ]
);
