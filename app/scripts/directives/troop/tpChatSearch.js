/**
 * @ngdoc function
 * @name webClientApp.directive:tpChatEntry
 * @description
 * # tpChatEntry
 */
angular.module('webClientApp')
.directive('tpChatSearch', [
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
      'Ref',
      'Me',
      'FileFactory',
      'ChatEntryFactory',
      'ModalService',
      function (
        $rootScope,
        $scope,
        $element,
        $attrs,
        $timeout,
        $firebaseObject,
        Ref,
        Me,
        FileFactory,
        ChatEntryFactory,
        ModalService
      ) {

        $scope.editing = false;
        $scope.Me = Me;
        $scope.chatMenus = {};
        $scope.$entry = $scope.entry;
        var $parent = $element.parent();
        if($scope.showContext) {
          $scope.preventry = false;
          $scope.nextentry = false;
          $scope.chat = ChatEntryFactory.getEntries($scope.entry.troopId, $scope.entry.chatId);
          $scope.chat.$loaded().then(function() {
            var currEntryIndex = null;
            _.each($scope.chat,function(val,index){
              if(val.$id == $scope.entry.$id) {
                currEntryIndex = index;
              }
            });
            $scope.preventry = $scope.chat[ currEntryIndex - 1 ];
            $scope.nextentry = $scope.chat[ currEntryIndex + 1 ];



            if($scope.preventry && $scope.preventry.text){
              if($scope.preventry.text.length > 180){
                $scope.preventry.text = $scope.preventry.text.truncateOnWord(110, 'right' );
              }
            }

            if($scope.nextentry && $scope.nextentry.text){
              if($scope.nextentry.text.length > 180){
                $scope.nextentry.text = $scope.nextentry.text.truncateOnWord(110, 'right' );
              }
            }

          });


        }

        $scope.$watch('entry', function() {

          if ($scope.isLast) {

            $timeout(function() {

              $parent.scrollTop($parent[0].scrollHeight);
            }, 100);
          }


          //var prevEntryDayOfYear = moment($scope.previousEntry.createdAt).format('DDD');
          var currEntryDayOfYear = moment($scope.entry.createdAt).format('DDD');
          //var dayDiff = currEntryDayOfYear - prevEntryDayOfYear;

          var today = moment(Date.now()).format('DDD');

          var text;
          if ( today === currEntryDayOfYear ) {
            text = 'Today';
          }
          else if ( ( today - currEntryDayOfYear ) === 1 ) {
            text = 'Yesterday';
          }
          else {
            text = $filter('moment')($scope.entry.createdAt, 'MMM DD, YYYY');
          }


          if($scope.entry.text.length > 180){
            var hitlength = $scope.entry._highlightResult.text.matchedWords[0].length;
            var pos = $scope.entry.text.indexOf('*');

            if(pos > 180) {
              // truncate on both sides
              $scope.entry.text = $scope.entry.text.truncateOnWord( pos + ( hitlength + 1 ) + 45, 'right' );
              $scope.entry.text = $scope.entry.text.truncateOnWord( pos - 125, 'left' );


            }else{
              // truncate only on the end
              $scope.entry.text.truncateOnWord(170, 'right');
              // truncate value is shorter to account for
              // the variable word lenght and `...`

            }

          }

          // var chatTypeLabel = 'Board';
          // var chatNameLabel = 'General';

          var chatTypeLabel = '';
          var chatNameLabel = '';

          if ( $scope.entry.boardId !== 'unknown' ) {

            chatTypeLabel = "Board";
            chatNameLabel = $scope.entry.board.name;
          }
          else if ( $scope.entry.otherMember ) {

            chatTypeLabel = "Private Chat";
            chatNameLabel = $scope.entry.otherMemberDetails.name;
          }

          $element.prepend(
            '<div class="subHeader">' +
              '<div class="wrapper flex-row">' +
                '<span class="label">' +
                  '<span class="type">' +
                    chatTypeLabel +
                  '</span>' +
                  '<span class="name">' +
                    chatNameLabel +
                  '</span>' +
                '</span>' +
                '<span class="date">' +
                  text +
                '</span>' +
              '</div>' +
            '</div>'
          );

        });

      }
    ];


    return {
      restrict: 'A',
      scope: {
        entry: '=tpChatSearch',
        isSearchResult: '=tpChatSearchResult',
        showContext: '=tpChatSearchShowContext',
        isFirst: '=tpChatSearchFirst',
        isLast: '=tpChatSearchLast',
        previousSearchEntry: '=tpChatSearchPrevious',
        asset: '=tpChatSearchAsset',
        showHeaderInfo: '=tpChatSearchHeaderInfo',
        triggerScroll: '=tpChatSearchScrollToWhen'
      },
      controller: controller,
      templateUrl: '/views/directives/troop/tp-chat-search.html'

    };
  }
]);
