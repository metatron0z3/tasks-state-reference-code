'use strict';

/**
 * @ngdoc service
 * @name webClientApp.AssetFirebaseObject
 * @description
 * # AssetFirebaseObject
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'AssetFirebaseObject',
    [
      'Ref',
      '$firebaseObject',
      'FileFactory',
      'AssetFactory',
      '$firebaseUtils',
      '$log',
      function(
        Ref,
        $firebaseObject,
        FileFactory,
        AssetFactory,
        $firebaseUtils,
        $log
      ) {

        return $firebaseObject.$extend({

          _extraInfo: function() {
            if (this.upload) {

              if (
                ( ! this.upload.state )
                || ( this.upload.state === 'store' )
              ) {
                this.isUploading = true;
              }
              else if ( this.upload.state === 'finished' ) {

                this.uploadComplete = true;
              }

            }

            this.fileType = FileFactory.fileTypeClass(this.mimeType);

            if ( this.mimeType ) {

              this.isGif = FileFactory.isGifFileType(this.mimeType);
            }

            if (this.fileName) {

              var parts = this.fileName.split('.');
              this.fileExtension = parts.pop();
              this.fileBasename = parts.join('.');
            }

            if (this.storageSize) {
              this.formattedStorageSize = FileFactory.formatBytes(this.storageSize, 1);
            }

            if (
              this.uploadComplete
              && this.metaData
              && this.metaData.videoDuration
            ) {

              this.formattedVideoDuration = AssetFactory.formatDuration(this.metaData.videoDuration);
            }

            if (
              this.isUploading
              && this.upload.progress
            ) {

              var progress = this.upload.progress;
              var piecePercent = 1 / progress.totalItems;
              var itemPercent = ( progress.item - 1 ) / progress.totalItems;
              var sizePercent = ( progress.loaded / progress.total ) * piecePercent;
              var percent = itemPercent + sizePercent

              this.totalProgress = Math.ceil(percent * 100);
            }

          },

          $loaded: function(resolve, reject) {
            var promise = this.$$conf.sync.ready();

            var that = this;

            promise.then(function() {
              that._extraInfo();
            });

            if (arguments.length) {
              // allow this method to be called just like .then
              // by passing any arguments on to .then
              promise = promise.then.call(promise, resolve, reject);
            }
            return promise;
          },

          $save: function () {


            var self = this;
            var ref = self.$ref();
            var data = $firebaseUtils.toJSON(self);

            delete data.fileBasename;
            delete data.fileExtension;
            delete data.fileType;
            delete data.formattedStorageSize;
            delete data.isGif;
            delete data.uploadComplete;
            delete data.troopId;

            data.updatedAt = firebase.database.ServerValue.TIMESTAMP;

            return $firebaseUtils.doSet(ref, data).then(function() {
              self.$$notify();
              return self.$ref();
            });
          },
          // each time an update arrives from the server, apply the change locally
          $$updated: function(snap) {
            // apply the changes using the super method
            var changed = $firebaseObject.prototype.$$updated.apply(this, arguments);

            if (changed) {
              this.troopId = this.$ref().parent.key;
              this._extraInfo();
            }

            // return whether or not changes occurred
            return changed;
          },
          $$error: function (err) {
            console.log('AssetFirebaseObject', this.$ref().toString(), $.extend({}, err))
            // prints an error to the console (via Angular's logger)
            $log.error(err);
            // frees memory and cancels any remaining listeners
            this.$destroy(err);
          },

        });
      }
    ]
  );
