/* global _ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

/**
 * @ngdoc service
 * @name webClientApp.CardListFactory
 * @description
 * # CardListFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'CardListFactory',
    [
      'Ref',
      '$log',
      '$q',
      '$filter',
      '$firebaseArray',
      '$firebaseUtils',
      'TroopLogger',
      function(
        Ref,
        $log,
        $q,
        $filter,
        $firebaseArray,
        $firebaseUtils,
        TroopLogger
      ) {

        var logConfig = {
          slug: 'services: CardListFactory - ',
          path: [ 'services', 'CardListFactory.js']
        };

        var CardListFactory = $firebaseArray.$extend({
          $$added: function(snap, prevChild) {

            var added = false;

            // check to make sure record does not exist
            var i = this.$indexFor(snap.key);

            if( i === -1 ) {
              // parse data and create record
              var card = snap.val();

              if( ! angular.isObject(card) ) {
                card = { $value: card };
              }

              if ( ! card.archived) {

                card.$id = snap.key;
                card.$priority = card.order || snap.getPriority();
                // weird reference work around, key() doesn't work on $ref()
                card.troopId = this.$ref().ref.key;

                $firebaseUtils.applyDefaults(card, this.$$defaults);

                added = card;
              }
            }

            return added;
          },
          $$updated: function(snap) {
            TroopLogger.debug(logConfig, '$$updated called: ');

            var changed = false;
            var cardId = snap.key;
            var card = this.$getRecord(cardId);

            if( angular.isObject(card) ) {


              var index = this.$indexFor(cardId);

              changed = $firebaseUtils.updateRec(card, snap);
              $firebaseUtils.applyDefaults(card, this.$$defaults);

              card.troopId = this.$ref().ref.key;

              if (card.archived) {

                this._spliceOut(snap.key);
                changed = true;
              }
              else {
                var totalCards = this.$list.length;
                // update index cache for existing rec at that splice index
                for (var j = 0; j < totalCards; j++) {
                  this._indexCache[this.$$getKey(this.$list[j])] = j;
                }

                if (card.order !== snap.val().order) {
                  changed = true;
                }
              }
            }

            if ( !changed ) {
              TroopLogger.debug(logConfig, 'card not changed');
              this._reOrderAssets(card);
              this._reorder();
            }
            return changed;
          },
          $$removed: function(snap) {
            TroopLogger.debug(logConfig, '$$removed called: ');
          },
          $save: function(indexOrItem) {


            TroopLogger.debug(logConfig,  '$save called: ');

            this._assertNotDestroyed('$save');
            var self = this;

            TroopLogger.debug(logConfig, 'item before delete: ', $.extend({}, indexOrItem));

            var item = self._resolveItem(indexOrItem);

            var varsToKeep = [
              '$priority',
              '$id',
              'assets',
              'boardId',
              'cardName',
              'description',
              'createdAt',
              'createdByMemberId',
              'notes',
              'order',
              'tags',
              'updatedAt'
            ];

            _.each(item, function(prop, key) {

              if (varsToKeep.indexOf(key) === -1) {

                delete item[key];
              }
            });


            var key = self.$keyAt(item);
            var def = $q.defer();


            if ( key !== null ) {


              var ref = self.$ref().ref.child(key);
              var dataJSON;

              try {
                dataJSON = $firebaseUtils.toJSON(item);
                //dataJSON = cleanedItem;
              }
              catch (err) {
                def.reject(err);
              }

              if ( dataJSON['$priority'] !==  data.order ) {
                dataJSON['$priority'] = data.order;
              }


              if (typeof dataJSON !== 'undefined') {

                dataJSON.updatedAt = firebase.database.ServerValue.TIMESTAMP;

                $firebaseUtils.doSet(ref, dataJSON)
                .then(function() {

                  self.$$notify('child_changed', key);
                  def.resolve(ref);
                })
                .catch(def.reject);
              }
            }
            else {

              def.reject('Invalid record; could not determine key for '+indexOrItem);
            }
            return def.promise;
          },
          $$process: function(event, rec, prevChild) {

            var key = this.$$getKey(rec);
            var changed = false;
            var curPos;



            // TroopLogger.debug(logConfig, '$$process-event arg:  ', event, 'prevChild:', prevChild);
            // TroopLogger.debug(logConfig, '$list:  ', this.$list);
            // TroopLogger.debug(logConfig, '_indexCache:  ', this._indexCache);

            switch(event) {
              case 'child_added':
                curPos = this.$indexFor(key);
                this._reOrderAssets(rec);
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
                // curPos = this.$indexFor(key);
                changed = true;
                this._reOrderAssets(rec);
                this._reorder();
                // this._sortByOrder(rec, prevChild);
                break;
              default:
                throw new Error('Invalid event type: ' + event);
            }


              // TroopLogger.debug(logConfig, '$$process called: ');
              // TroopLogger.debug(logConfig, 'is curPos defined: ', $.extend({}, angular.isDefined(curPos)));

            if( angular.isDefined(curPos) ) {

              // add it to the array
              var newPos = this._sortByOrder(rec, prevChild);
              changed = newPos !== curPos;
            }

            if( changed ) {
              // send notifications to anybody monitoring $watch
              this.$$notify(event, key, prevChild);
            }
            return changed;
          },
          $$error: function (err) {
            console.log('CardListFactory', this.$ref().toString(), $.extend({}, err))
            // prints an error to the console (via Angular's logger)
            //$log.error(err);
            // frees memory and cancels any remaining listeners
            this.$destroy(err);
          },
          _reorder: function() {
            TroopLogger.debug(logConfig, '_reorder called: ');

            this.$list.sort(function(a, b) {

                // var ayMinusBe = a.order - b.order;
                // var beminusAy = b.order - a.order;
                //
                // TroopLogger.debug(logConfig, 'a.order: ', a.order);
                // TroopLogger.debug(logConfig, 'b.order: ', b.order);
                // TroopLogger.debug(logConfig, 'ayMinusBe: ', ayMinusBe);
                // TroopLogger.debug(logConfig, 'beminusAy: ', beminusAy);
                // TroopLogger.debug(logConfig, '_reorder called: ');

              return b.order - a.order;
            });

            var totalCards = this.$list.length;
            for (var j = 0; j < totalCards; j++) {
              this._indexCache[this.$$getKey(this.$list[j])] = j;
            }
          },
          _reOrderAssets: function(rec) {

            TroopLogger.debug(logConfig, '_reOrderAssets() called');

            var orderedAssets = [];

            var assetCount = 0;
            if ( ! _.isEmpty(rec.assets) ) {
              var keys = Object.keys(rec.assets);
              assetCount = keys.length;
              orderedAssets = keys.sort(function(a, b) {
                return rec.assets[a] - rec.assets[b];
              }).reverse();
            }

            TroopLogger.debug(logConfig, 'orderedAssets: ', orderedAssets);
            TroopLogger.debug(logConfig, 'assetCount: ', assetCount);

            rec.orderedAssets = orderedAssets;
            rec.assetCount = assetCount;
          },
          _sortByOrder: function(rec, prevChild) {

            var spliceAt = 0;
            var totalCards = this.$list.length;

            if ( ! prevChild ) {

              if (totalCards > 0) {

                prevChild = this.$list[totalCards - 1].$id;

              }
              else {

                // splice it in
                this.$list.splice(spliceAt, 0, rec);
                // update index cache with new record
                this._indexCache[this.$$getKey(rec)] = spliceAt;

                return spliceAt;
              }

            }

            var prev = this.$getRecord(prevChild);
            var prevChildIndex = totalCards - 1;

            if ( ! prev ) {

              prev = this.$list[totalCards - 1];

              if ( ! prev ) {
                prev = {
                  order: 1
                };
              }
            }
            else {
              prevChildIndex = this.$indexFor(prevChild);
            }

            spliceAt = prevChildIndex;

            if (rec.order === undefined || rec.order === null) {

              var lastRecOrder = 1;
              if (this.$list[totalCards - 1]) {
                lastRecOrder = this.$list[totalCards - 1].order;
              }
              rec.order = lastRecOrder;
            }

            if (rec.order > prev.order) {

              if ( 1 === totalCards ) {

                // only one card, increment
                spliceAt = 0;

              }
              else {

                // more than 1 card, need to check to the end
                var found = false;
                for (var j = spliceAt; j >= 0; j--) {

                  if (rec.order < this.$list[j].order) {
                    spliceAt = j + 1;
                    found = true;
                    break;
                  }

                }

                if ( ! found ) {
                  spliceAt = 0;
                }
              }
            }
            else if (rec.order < prev.order) {

              if ( 1 === totalCards ) {
                // only one card, insert before it;
                spliceAt = 1;
              }
              else {

                var found = false;
                for (var j = spliceAt; j < totalCards; j++) {

                  var order = 1;
                  if (this.$list[j]) {
                    order = this.$list[j].order;
                  }

                  if (rec.order > order) {

                    spliceAt = j;
                    found = true;
                    break;
                  }
                }

                if ( ! found ) {
                  spliceAt = totalCards;
                }

              }

            }
            else {

              spliceAt = spliceAt + 1;
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
          },
          orderCardTags: function(boardTagNames) {

            _.each(this.$list, function(card) {

              if ( ! boardTagNames ) {
                boardTagNames = {};
              }
              var tagNameCount = _.keys(boardTagNames).length;


              var orderedTags = [];
              _.each(card.tags, function(value, tagName) {


                var tag = boardTagNames[tagName];

                if ( ! tag ) {
                  tag = {
                    order: 1,
                    color: ''
                  }
                }

                if (tagName.indexOf("tag") === 0){
                  tagName = tagName.substring(3);
                }

                orderedTags.push({
                  name: tagName,
                  order: tag.order,
                  color: tag.color || '',
                  value: value
                });
              });

              card.orderedTags = _.sortBy(orderedTags, 'order').reverse();
            });
          },
          removeWithoutSave: function(key) {

            var that = this;

            var i = this.$indexFor(key);

            if ( i !== -1 ) {

              this.$list.splice(i, 1);
              delete this._indexCache[key];

              _.each(this.$list, function(card, index) {

                that._indexCache[card.$id] = index;
              });

            }
          }
        });

        return CardListFactory;

      }
    ]
  );
