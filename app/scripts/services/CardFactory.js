'use strict';

/**
 * @ngdoc service
 * @name webClientApp.CardFactory
 * @description
 * # CardFactory
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'CardFactory',
    [
      '$q',
      'AssetFactory',
      'Slug',
      'Ref',
      '$log',
      '$firebaseObject',
      '$firebaseArray',
      '$firebaseUtils',
      'TroopApi',
      function(
        $q,
        AssetFactory,
        Slug,
        Ref,
        $log,
        $firebaseObject,
        $firebaseArray,
        $firebaseUtils,
        TroopApi
      ) {
        return {
          getFirebaseObjectByKey: function(troopId, cardId) {
            return new $firebaseObject.$extend({
              $loaded: function(resolve, reject) {
                var promise = this.$$conf.sync.ready();

                var that = this;
                that.troopId = troopId;

                promise.then(function() {
                  //... do something
                });

                if (arguments.length) {
                  // allow this method to be called just like .then
                  // by passing any arguments on to .then
                  promise = promise.then.call(promise, resolve, reject);
                }
                return promise;
              },

              // each time an update arrives from the server, apply the change locally
              $$updated: function(snap) {
                // apply the changes using the super method
                var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);

                if (changed) {
                  this.troopId = troopId;
                }

                // return whether or not changes occurred
                return changed;
              },
              $$error: function (err) {
                console.log('BoardFactory', this.$ref().toString(), $.extend({}, err))
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('cards')
                .child(troopId)
                .child(cardId)
            );
          },
          archive: function(card) {

            var deferred = $q.defer();

            // archive card
            Ref.child('cards')
              .child(card.troopId)
              .child(card.$id)
              .child('archived')
              .set(true);

            if (card.tags) {
              // decrement board tag counts
              var tagName;
              for (tagName in card.tags) {

                Ref.child('boards')
                  .child(card.troopId)
                  .child(card.boardId)
                  .child('tagNames')
                  .child(tagName)
                  .child('count')
                  .transaction(function(currentValue) {
                    var newValue = currentValue - 1;
                    if (newValue < 1) {
                      newValue = 0;
                    }

                    return newValue;
                  });

              }
            }

            if (card.assets) {
              // archive assets
              var assetIds = _.keys(card.assets);

              if (assetIds.length > 0) {

                _.each(assetIds, function(assetId) {

                  Ref.child('assets')
                    .child(card.troopId)
                    .child(assetId)
                    .child('archived')
                    .set(true);

                });
              }
            }

            deferred.resolve();

            return deferred.promise;

          },
          create: function(data) {

            if ( ! data.troopId ) {
              return $q.reject({ code: 'MISSING_TROOP_ID' });
            }

            var that = this;
            var deferred = $q.defer();

            if ( ! data.tags ) {
              var tagString = data.tagString;
              delete data.tagString;

              data.tags = that.parseTagString(tagString);

            }

            var cardRef = Ref.child('cards').child(data.troopId).push(
              {
                boardId: data.board.$id || null,
                order: data.order || 0,
                cardName: data.cardName || null,
                description: data.description || null,
                tags: data.tags || null,
                createdByMemberId: data.createdByMemberId || null,
                updatedAt: firebase.database.ServerValue.TIMESTAMP,
                createdAt: firebase.database.ServerValue.TIMESTAMP
              },
              function(error) {

                if (error) {
                  deferred.reject(error);
                  return false;
                }

                var orderedTags = _.sortBy(data.board.tagNames, 'order').reverse();

                var maxOrder = orderedTags[0] ? (orderedTags[0].order || 0) + 1 : 1;

                // now update board with tag count
                _.each(_.keys(data.tags), function(tagName) {

                  Ref.child('boards')
                    .child(data.troopId)
                    .child(data.board.$id)
                    .child('tagNames')
                    .child(tagName)
                    .transaction(function(currentValue) {

                      if (!currentValue) {
                        currentValue = {};
                      }
                      currentValue.order = currentValue.order ? currentValue.order : maxOrder;
                      currentValue.count = (currentValue.count || 0) + 1;

                      maxOrder += 1;

                      return currentValue;
                    });

                });

                deferred.resolve(cardRef);

              }
            );

            return deferred.promise;
          },
          update: function(data) {

            var deferred = $q.defer();
            var tags = this.parseTagString(data.tagString) || [];
            var tagObject = {};
            var tagsToRemove = [];
            var tagsToAdd = [];
            if (data.card.tags) {
              var tag;
              for (tag in data.card.tags) {
                if ( ! tags.hasOwnProperty(tag) ) {

                  tagsToRemove.push(tag);
                }
              }
            }
            else {
              data.card.tags = {};
            }

            for (tag in tags) {
              if ( ! data.card.tags.hasOwnProperty(tag) ) {
                tagsToAdd.push(tag);
              }
            }

            var payload = {
              updatedAt: firebase.database.ServerValue.TIMESTAMP,
              tags: tags
            }

            if ( data.card.hasOwnProperty('cardName') ) {
              payload.cardName = data.card.cardName;
            }
            if ( data.card.hasOwnProperty('assets') ) {
              payload.assets = data.card.assets;
            }
            if ( data.card.hasOwnProperty('description') ) {
              payload.description = data.card.description;
            }

            var cardRef = Ref.child('cards')
                            .child(data.card.troopId)
                            .child(data.card.$id);

            cardRef.update(
              payload,
              function() {

                _.each(tagsToRemove, function(tagName) {

                  if (data.board.tagNames[tagName]) {

                    Ref.child('boards')
                      .child(data.card.troopId)
                      .child(data.card.boardId)
                      .child('tagNames')
                      .child(tagName)
                      .child('count')
                      .transaction(function(currentValue) {

                        var newValue = currentValue - 1;
                        if (newValue < 0) {
                          newValue = 0;
                        }

                        return newValue;
                      });
                  }
                });

                var orderedTags = _.sortBy(data.board.tagNames, 'order').reverse();
                var maxOrder = orderedTags[0] ? orderedTags[0].order : 1;
                _.each(tagsToAdd, function(tagName) {


                  Ref.child('boards')
                    .child(data.board.troopId)
                    .child(data.board.$id)
                    .child('tagNames')
                    .child(tagName)
                    .transaction(function(currentValue) {
                      if (!currentValue) {
                        currentValue = {};
                      }
                      currentValue.order = currentValue.order || maxOrder;
                      currentValue.count = (currentValue.count || 0) + 1;

                      maxOrder += 1;

                      return currentValue;
                    });

                });


                deferred.resolve(cardRef);
              }
            );

            return deferred.promise;

          },
          moveCard: function(data) {
            // update card

            if (
              ( ! data.cardId )
              || ( ! data.toBoardId )
              || ( ! data.fromBoardId )
              || ( ! data.troopId )
            ) {
              return false;
            }

            return TroopApi.moveCard({
              troopId: data.troopId,
              fromBoardId: data.fromBoardId,
              toBoardId: data.toBoardId,
              cardId: data.cardId
            });
          },
          parseTagString: function(tagString) {
            // process tags string

            if ( ! tagString ) {
              return null;
            }

            if (tagString.charAt(0) !== '#') {
              tagString = '#' + tagString;
            }

            var tagArray = tagString.split("#");
            var tagObj = {};
            _.each(tagArray, function(tag) {
              tag = $.trim(tag);
              if (',' === tag.slice(-1)) {
                tag = tag.slice(0, -1);
              }

              if (tag) {
                var colonIndex = tag.indexOf(':');

                var tagName;
                var tagValue;

                if (colonIndex === -1) {
                  tagName = tag;
                  tagValue = '';
                }
                else {
                  tagName = tag.substr(0, colonIndex);
                  tagValue = tag.substr(colonIndex + 1);
                }

                var tagIntValue = parseInt(tagValue);
                var tagFloatValue = parseFloat(tagValue);


                if (tagValue.indexOf('"') !== -1) {
                  // quotes found, must be string, remove quotes
                  tagValue = tagValue.replace(/"/g, '');

                  // TODO: check for date string
                }
                else if (isNaN(tagIntValue)) {
                  // not a number, must be string

                  // TODO: check for date string
                }
                else if (tagIntValue === tagFloatValue) {
                  // must be int
                  tagValue = tagIntValue;
                }
                else if (tagIntValue !== tagFloatValue) {
                  // must be float
                  tagValue = tagFloatValue;
                }

                // slugify name
                tagName = Slug.slugify("tag" + tagName);


                tagObj[tagName] = tagValue;
              }

            });

            return tagObj;
          },
          generateTagString: function(card) {

            var tags = '';

            _.each(card.tags, function(tagValue, tagName) {

              tags += '#' + tagName.substring(3);

              if (tagValue) {
                tags += ':' + tagValue;
              }

              tags += ' ';
            });

            return tags;
          },
          uploadAsset: function(options) {
            var that = this;
            var deferred = $q.defer();
            var assetRef;

            AssetFactory.create({
              troopId: options.troopId,
              boardId: options.boardId,
              cardId: options.cardId,
              createdByUserId: options.createdByUserId,
              mimeType: options.mimeType,
              fileName: options.fileName,
              metaData: options.metaData,
              order: options.order
            })
            .then(function(ref) {

              assetRef = ref;

              Ref.child('cards')
                .child(options.troopId)
                .child(options.cardId)
                .child('assets')
                .child(assetRef.key)
                .set(options.order);

              var uploader = TroopApi.uploadFile({
                troopId: options.troopId,
                assetId: assetRef.key,
                $file: options.$file
              });

              deferred.resolve({
                assetRef: assetRef,
                uploader: uploader
              });

            })
            .catch(function(error) {

              deferred.reject(error);
            });

            return deferred.promise;

          },
          uploadAssetFromUrl: function(options) {

            var that = this;
            var deferred = $q.defer();
            var assetRef;

            AssetFactory.create({
              troopId: options.troopId,
              boardId: options.boardId,
              cardId: options.cardId,
              createdByUserId: options.createdByUserId,
              mimeType: options.mimeType,
              fileName: options.fileName,
              metaData: options.metaData,
              order: options.order
            })
            .then(function(ref) {

              assetRef = ref;

              Ref.child('cards')
                .child(options.troopId)
                .child(options.cardId)
                .child('assets')
                .child(assetRef.key)
                .set(options.order);

              return TroopApi.uploadFromUrl({
                url: options.url,
                uid: options.uid,
                assetId: assetRef.key,
                troopId: options.troopId
              });

            })
            .then(function(resp) {

              deferred.resolve(assetRef);
            })
            .catch(function(error) {

              deferred.reject(error);
            });

            return deferred.promise;
          },
          addNote: function(data) {

            var deferred = $q.defer();

            var noteRef = Ref.child('cards')
              .child(data.troopId)
              .child(data.cardId)
              .child('notes')
              .push(
                {
                  memberId: data.memberId,
                  text: data.text,
                  updatedAt: firebase.database.ServerValue.TIMESTAMP,
                  createdAt: firebase.database.ServerValue.TIMESTAMP
                },
                function(error) {

                  if (error) {
                    deferred.reject(error);
                    return false;
                  }

                  deferred.resolve(noteRef);

                }
              )

            return deferred.promise;
          },
          getNote: function(troopId, cardId, noteId) {

            return new $firebaseObject.$extend({

              $loaded: function(resolve, reject) {
                var promise = this.$$conf.sync.ready();

                this.troopId = troopId;
                this.cardId = cardId;

                promise.then(function() {
                  //... do something
                });

                if (arguments.length) {
                  // allow this method to be called just like .then
                  // by passing any arguments on to .then
                  promise = promise.then.call(promise, resolve, reject);
                }
                return promise;
              },

              // each time an update arrives from the server, apply the change locally
              $$updated: function(snap) {
                // apply the changes using the super method
                var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);

                if (changed) {
                  this.troopId = troopId;
                  this.cardId = cardId;
                }

                // return whether or not changes occurred
                return changed;
              },
              $$error: function (err) {
                console.log('CardFactory - Note', this.$ref().toString(), $.extend({}, err))
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('cards')
                .child(troopId)
                .child(cardId)
                .child('notes')
                .child(noteId)
            );
          },
          getNotes: function(options) {

            return new $firebaseArray.$extend({

              $$added: function(snap, prevChild) {

                var added = false;

                // check to make sure record does not exist
                var i = this.$indexFor(snap.key);

                if( i === -1 ) {
                  // parse data and create record
                  var rec = snap.val();
                  if( ! angular.isObject(rec) ) {
                    rec = { $value: rec };
                  }

                  if ( ! rec.archived ) {

                    rec.$id = snap.key;
                    rec.$priority = snap.getPriority();
                    rec.troopId = options.troopId;
                    rec.cardId = options.cardId;

                    $firebaseUtils.applyDefaults(rec, this.$$defaults);

                    added = rec;
                  }
                }

                return added;
              },
              $destroy: function(err) {
                if( !this._isDestroyed ) {
                  this._isDestroyed = true;
                  this._sync.destroy(err);
                  this.$list.length = 0;
                }
              },
              $$updated: function(snap) {

                var changed = false;
                var rec = this.$getRecord(snap.key);
                if( angular.isObject(rec) ) {
                  // apply changes to the record
                  changed = $firebaseUtils.updateRec(rec, snap);
                  $firebaseUtils.applyDefaults(rec, this.$$defaults);
                  rec.troopId = options.troopId;
                  rec.cardId = options.cardId;
                }

                return changed;
              },
              $$error: function (err) {
                console.log('CardFactory', this.$ref().toString(), $.extend({}, err))
                // prints an error to the console (via Angular's logger)
                $log.error(err);
                // frees memory and cancels any remaining listeners
                this.$destroy(err);
              },
            })(
              Ref.child('cards')
                .child(options.troopId)
                .child(options.cardId)
                .child('notes')
                .orderByChild('createdAt')
                .limitToLast(1000)
            );
          },
          deleteNote: function(options) {

            Ref.child('card')
              .child(options.troopId)
              .child(options.cardId)
              .child(options.noteId)
              .remove();
          }
        };
      }
    ]
  );
