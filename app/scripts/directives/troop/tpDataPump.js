/* global _,$ */
/* jshint strict: true */
/* jshint -W014 */

(function () {
  'use strict';

angular
  .module('webClientApp')
  .directive('tpDataPump', dataPump);

  function dataPump() {

  	var directive = {
      restrict: 'A',
      scope: {
        inputEntries: '=tpDataPump',
        loadStyle: '=?tpDataPumpLoadStyle',           // *optional - string [chat,regular] | default: regular
        scrollDown: '=?tpDataPumpScrollDown',     // *optional - boolean
        scrollUp: '=?tpDataPumpScrollUp',         // *optional - boolean
        loadLimit: '=?tpDataPumpLimit',           // *optional - integer
        reload: '=?tpDataPumpReload'
      },
      controller: controllerFunc,
      controllerAs: 'vm',
      bindToController: true
    };

    controllerFunc.$inject = ['$window', '$rootScope', '$scope', 'Me', '$element', '$timeout', '$q', 'TroopLogger'];

    return directive;


    /* ********** */


    function controllerFunc($window, $rootScope, $scope, Me, $element, $timeout, $q, TroopLogger) {

      var logConfig = {
        slug: 'directive: tpDataPump - ',
        path: [ 'directives', 'troop', 'tpDataPump.js']
      };

      //var stayOnBottom = true;
      $scope.vm.scroll = ($scope.vm.scrollDown || $scope.vm.scrollUp) ? true : false;
      $scope.vm.autoCheckInterval = 400;
      $scope.vm.nextIndex = 0;
      $scope.vm.int;
      $scope.vm.entries = [];
      $scope.vm.elClass = _.first($element.attr('class').split(' '));
      $scope.vm.isNotifications = ($element.attr('class').indexOf('notification') !== -1) ? true : false;
      $scope.vm.isCards = ($element.attr('class').indexOf('card-list') !== -1) ? true : false;
      $scope.vm.processing = false;
      $scope.vm.stop = false;
      $scope.vm.uidle = true;
      $scope.vm.mouseIdleIntrval = null;
      $scope.vm.counter = 0;
      $scope.vm.firstChunk = true;
      $scope.vm.loadingMessageIsShowing = false;
      $scope.vm.scrolledToTheBottom = false;
      $scope.vm.isFirefox = $('body').data('browserName') === "Firefox";

      //console.log($('body').data('browserName'));

      init();

      $scope.$watch('vm.inputEntries',function(newData,oldData){

        if ( newData !== oldData ) {

          TroopLogger.warn(logConfig,'re-initializing content - triggering on Element:',$element.attr('class'));

          $scope.vm.nextIndex = 0;
          $scope.vm.entries = [];
          clearInterval($scope.vm.int);

          init();
        }
      });

      $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {

        if ( $scope.vm.entries.length > 0 ) {

          TroopLogger.warn(logConfig,'Stopping load-cycle',toState.name + ' - boardId:' + toParams.boardId, 'triggering on Element:',$scope.vm.elClass);

          $scope.vm.nextIndex = 0;
          $scope.vm.entries = [];
          clearInterval($scope.vm.int);
        }
      });

      $scope.$on('tag-filter-apply', function(){
        if ( $scope.vm.isCards ) {

          //console.log('tag-filter-apply');
          //console.log($scope.vm.loadingMessageIsShowing);

          clearInterval($scope.vm.int);
          $scope.$parent.$parent.tpDataPumpItems = [];
          loadingMessage(false);

          $scope.vm.entries.map(function(entry){

            Array.prototype.splice.apply(
              $scope.$parent.$parent.tpDataPumpItems,
              [0,0].concat(entry)
            );
          });

          $scope.vm.nextIndex = $scope.vm.entries.length;
        }
      });

      $rootScope.$on('modal-open', function(event, modal){

        if ( $scope.vm.processing && $scope.vm.isCards ) {

          TroopLogger.debug(logConfig,modal.controllerName,'modal open detected',$element.attr('class'));

          $scope.vm.stop = true;

        }
      });

      $rootScope.$on('modal-close', function(event, modal){

        if (
          ( ! $scope.vm.processing )
          && $scope.vm.stop
          && $scope.vm.isCards
        ) {

          TroopLogger.debug(logConfig,modal.controllerName,'modal close detected',$element.attr('class'));

          $scope.vm.stop = false;
          if ( $scope.vm.nextIndex !== $scope.vm.entries.length ) {

            interval();
          }
        }
      });

      return;

      function init() {
        $scope.vm.processing = true;
        logConfig.slug = 'directive: tpDataPump - '+$scope.vm.elClass; //isNotifications ? 'notifications - ' : '';

        $scope.vm.inputEntries = ( ! $scope.vm.inputEntries ) ? [] : $scope.vm.inputEntries;
        $scope.vm.loadLimit = ( ! $scope.vm.loadLimit ) ? 20 : $scope.vm.loadLimit;
        $scope.vm.loadStyle = ( ! $scope.vm.loadStyle ) ? 'regular' : $scope.vm.loadStyle;

        //console.log($.extend({},$scope.vm.inputEntries));
        //console.log($scope.vm.inputEntries.hasOwnProperty('$loaded'));
        // console.log($.extend({},$scope.vm));
        // console.log($scope.vm);

        $scope.$parent.$parent.tpDataPumpItems = [];

        if ( $scope.vm.isNotifications && ! $scope.vm.inputEntries.hasOwnProperty('$loaded') ) {
          TroopLogger.debug(logConfig,'weird input entries for notifications: ',$scope.vm.inputEntries);
        }

        if ( $scope.vm.inputEntries.hasOwnProperty('$loaded') ) {

          TroopLogger.debug(logConfig,'inputEntries.$loaded found',$.extend({}, $scope.vm.inputEntries.$loaded()));

          $scope.vm.inputEntries
            .$loaded()
            .then(function(){
              TroopLogger.debug(logConfig,'all intems $loaded()');
              return chunckIt();
            })
            .then(function(){

              interval();
            });
        }
        else {

          TroopLogger.debug(logConfig,'NO inputEntries.$loaded found');

          chunckIt()
          .then(function(){
            interval();
          });
        }

        // idle detection:
        /* *************** */

        // starting to track
        mouseMoveHandler();

        $element.bind('mousewheel', mouseWheelHandler);
        $element.bind('DOMMouseScroll', mouseWheelHandler);
        $element.bind('scroll', scrollHandler);
        $('body').bind('mousemove', mouseMoveHandler);

      }

      function chunckIt() {
        var deferred = $q.defer();

        TroopLogger.debug(logConfig,'chunkIt - loadstyle',$scope.vm.loadStyle);
        TroopLogger.debug(logConfig,'chunkIt - items going in',$scope.vm.inputEntries.length);
        TroopLogger.debug(logConfig,'chunkIt - chunk length',$scope.vm.loadLimit);

        if ( $scope.vm.loadStyle === 'chat' ) {

          $scope.vm.entries = _.chain($scope.vm.inputEntries)
                     .groupBy(function(e, index){ return Math.floor(index/$scope.vm.loadLimit); })
                     .toArray()
                     .reverse()
                     .value();

          TroopLogger.debug(logConfig,'chunks = '+$scope.vm.entries.length);

          deferred.resolve($scope.vm.entries);
        }
        else {

          $scope.vm.entries = _.chain($scope.vm.inputEntries)
                     .groupBy(function(e, index){ return Math.floor(index/$scope.vm.loadLimit); })
                     .toArray()
                     .value();

          TroopLogger.debug(logConfig,'chunks = '+$scope.vm.entries.length);

          deferred.resolve($scope.vm.entries);
        }

        return deferred.promise;
      }

      function processData() {

        if ( $scope.$parent.$parent ) {

          TroopLogger.debug(logConfig,'processing chunk',$scope.vm.nextIndex);

          if ( $scope.vm.loadStyle === 'chat' ) {

            Array.prototype.splice.apply(
              $scope.$parent.$parent.tpDataPumpItems,
              [0,0].concat($scope.vm.entries[$scope.vm.nextIndex])
            );
          }
          else {

            if ( $scope.vm.firstChunk && $scope.vm.isCards) {

              $scope.vm.firstChunk = false;
              var bigChunk = ($scope.vm.isFirefox) ? 3 : 10;
              $scope.vm.nextIndex += bigChunk / $scope.vm.loadLimit;
              //console.log('*** $scope.vm.nextIndex',$scope.vm.nextIndex);
              var firstChunkLength =  ($scope.vm.nextIndex > $scope.vm.entries.length) ? $scope.vm.entries.length : $scope.vm.nextIndex;
              var firstChunkData = [];
              for ( var i = 0 ; i < firstChunkLength ; i++ ){
                Array.prototype.push.apply(
                  firstChunkData,
                  $scope.vm.entries[i]
                );
              }
              // console.log(firstChunkData);
              // return;

              Array.prototype.push.apply(
                $scope.$parent.$parent.tpDataPumpItems,
                firstChunkData
              );
            }
            else {
              Array.prototype.push.apply(
                $scope.$parent.$parent.tpDataPumpItems,
                $scope.vm.entries[$scope.vm.nextIndex]
              );
            }
          }


          $scope.vm.nextIndex++;

          if( ! $scope.$parent.$parent.$$phase ) {

            $scope.$parent.$parent.$digest();
          }

          switch (true) {

            case ($scope.vm.scrollDown === true && $scope.vm.scroll === true):
              $element.scrollTop($element[0].scrollHeight);
              TroopLogger.debug(logConfig,'scrolling DOWN');
            break;

            case ($scope.vm.scrollUp === true && $scope.vm.scroll === true):
              $element.scrollTop(0);
              TroopLogger.debug(logConfig,'scrolling UP');
            break;

          }
        }
      }

      function interval() {
        $scope.vm.int = setInterval(function() {

          if (
            $scope.vm.nextIndex >= $scope.vm.entries.length // all items has been loaded stop interval
            || ($scope.vm.stop === true && $scope.vm.isCards === true) // modal window is open stop loading
            || ($scope.vm.uidle === false && $scope.vm.isCards === true) // user is active stop loading
          ){

            TroopLogger.debug(logConfig,'stopping dataProcess interval');
            clearInterval($scope.vm.int);
            $scope.vm.processing = false;
            TroopLogger.debug(logConfig,'loading STOPED');

            if ( $scope.vm.nextIndex >= $scope.vm.entries.length ) {

              TroopLogger.debug(logConfig,'All DONE');
              loadingMessage(false);
              $element.unbind('scroll');
            }
            else {

              TroopLogger.debug(logConfig,'only',$scope.vm.nextIndex + 1,'chunks has been loaded');
            }

            return;
          }
          processData();
          loadingMessage(true);
        }, $scope.vm.autoCheckInterval);
      }

      function mouseMoveHandler(){

        if( $scope.vm.uidle && $scope.vm.isCards && ! $scope.vm.firstChunk ){
          TroopLogger.debug(logConfig,'User activity detected stopping the chunck load.');

          clearInterval($scope.vm.mouseIdleIntrval);

          $scope.vm.mouseIdleIntrval = null;
          $scope.vm.counter = 0;
          $scope.vm.uidle = false;
        }

        if(
          $scope.vm.mouseIdleIntrval === null
          && $scope.vm.nextIndex < $scope.vm.entries.length
          && $scope.vm.isCards
          && ! $scope.vm.firstChunk
        ) {

          $scope.vm.mouseIdleIntrval = setInterval(function(){

            // console.log('interval idle',$scope.vm.uidle, 'counter',$scope.vm.counter, 'element',$scope.vm.elClass);

            if(
              $scope.vm.counter === 3
              || $scope.vm.firstChunk
              && $scope.vm.nextIndex < $scope.vm.entries.length
            ){

              TroopLogger.debug(logConfig,'User idle detected starting the chunck load.');
              $scope.vm.uidle = true;
              interval();
            }

            $scope.vm.counter++;
          }, 300);
        }
      }

      function mouseWheelHandler() {

        if ( $scope.vm.scroll ) {
          $scope.vm.scroll = false;
        }

        mouseMoveHandler();

      }

      function scrollHandler(e){

        var absPos = e.target.scrollTop+e.target.offsetHeight;
        var sHeight = $element[0].scrollHeight;

        if(
          absPos === sHeight
          && $scope.vm.nextIndex < $scope.vm.entries.length
          && $scope.vm.isCards
        ) {
          $scope.vm.scrolledToTheBottom = true;
          $scope.vm.firstChunk = true;

          processData();

        } else {
          $scope.vm.scrolledToTheBottom = false;
        }
      }

      function loadingMessage(attach) {
        if (attach && ! $scope.vm.loadingMessageIsShowing) {
          $element.find('.bottom').before('<li class="loader">loading...</li>');
          $scope.vm.loadingMessageIsShowing = true;
        }

        if (! attach && $scope.vm.loadingMessageIsShowing) {

          $element.find('.loader').remove();
          $scope.vm.loadingMessageIsShowing = false;
        }
      }


    }
  }

})(); // end of file
