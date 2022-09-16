'use strict';

/**
 * @ngdoc service
 * @name webClientApp.BoardListFactory
 * @description
 * # BoardListFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
  'BoardListFactory',
  [
    '$q',
    '$log',
    '$firebaseArray',
    '$firebaseUtils',
    'agLogger',
    function(
      $q,
      $log,
      $firebaseArray,
      $firebaseUtils,
      agLogger
    ) {


      var BoardListFactory = $firebaseArray.$extend({

        $loaded: function(resolve, reject) {
          // agLogger.info('BoardListFactory loading...');
          var promise = this._sync.ready();
          if( arguments.length ) {
            // allow this method to be called just like .then
            // by passing any arguments on to .then
            promise = promise.then.call(promise, resolve, reject);
          }
          promise.then(function() {
            // agLogger.info('BoardListFactory.$loaded()');
          });
          return promise;
        },
        $$added: function(snap, prevChild) {

          var added = false;
          var key = snap.key;

          // check to make sure record does not exist
          var i = this.$indexFor(key);

          if( i === -1 ) {
            // parse data and create record
            var board = snap.val();
            if( ! angular.isObject(board) ) {
              board = { $value: board };
            }
            // agLogger.info('BoardListFactory.$$added()', key, board.archived);

            if ( ! board.archived) {

              board.$id = key;
              board.$priority = snap.getPriority();
              board.troopId = this.$ref().ref.key;

              $firebaseUtils.applyDefaults(board, this.$$defaults);

              added = board;
            }
          }

          return added;
        },
        $$updated: function(snap) {
          // agLogger.info('BoardListFactory.$$updated()');
          var changed = false;
          var boardId = snap.key;
          var board = this.$getRecord(boardId);

          if( angular.isObject(board) ) {

            var index = this.$indexFor(boardId);

            changed = $firebaseUtils.updateRec(board, snap);
            $firebaseUtils.applyDefaults(board, this.$$defaults);

            if (board.archived) {
              this._spliceOut(snap.key);
              changed = true;
            }
            else {

              var totalBoards = this.$list.length;
              // update index cache for existing rec at that splice index
              for (var j = 0; j < totalBoards; j++) {
                this._indexCache[this.$$getKey(this.$list[j])] = j;
              }

            }

            if ( changed ) {
              board.troopId = this.$ref().ref.key;
            }
          }

          return changed;

        },
        $$error: function (err) {
          // agLogger.error('BoardListFactory', this.$ref().toString(), $.extend({}, err))
          // prints an error to the console (via Angular's logger)
          //$log.error(err);
          // frees memory and cancels any remaining listeners
          this.$destroy(err);
        },
        $$process: function(event, rec, prevChild) {
          var key = this.$$getKey(rec);
          var changed = false;
          var curPos;
          // agLogger.info('BoardListFactory.$$process()', key);

          switch(event) {
            case 'child_added':
              curPos = this.$indexFor(key);
              break;
            case 'child_moved':
              curPos = this.$indexFor(key);
              this._spliceOut(key);
              break;
            case 'child_removed':
              // remove record from the array
              changed = this._spliceOut(key) !== null;
              break;
            case 'child_changed':
              changed = true;
              break;
            default:
              throw new Error('Invalid event type: ' + event);
          }

          if( angular.isDefined(curPos) ) {

            // add it to the array
            var newPos = this._sortByName(rec, prevChild);
            changed = newPos !== curPos;

          }

          if( changed ) {
            // send notifications to anybody monitoring $watch
            this.$$notify(event, key, prevChild);
          }
          return changed;
        },
        _sortByName: function(rec, prevChild) {

          var asc = -1;
          var desc = 1;

          var totalCards = this.$list.length;
          var spliceAt = totalCards;

          for (var i = 0; i < totalCards; i++) {
            var compare = rec.boardName.toLowerCase().localeCompare(this.$list[i].boardName.toLowerCase());
            if (compare === asc) {
              //before
              spliceAt = i;
              break;
            }

          }

          // update index cache for existing rec at that splice index
          for (var j = spliceAt; j < totalCards; j++) {
            this._indexCache[this.$$getKey(this.$list[j])] = j + 1;
          }

          // splice it in
          this.$list.splice(spliceAt, 0, rec);
          // update index cache with new record
          this._indexCache[this.$$getKey(rec)] = spliceAt;

          return spliceAt;
        }
      });

      return BoardListFactory;

    }
  ]
);
