'use strict';

/**
 * @ngdoc service
 * @name webClientApp.TroopFirebaseObject
 * @description
 * # TroopFirebaseObject
 * Factory in the webClientApp.
 */
angular.module('webClientApp')
  .factory(
    'TroopFirebaseObject',
    [
      'Ref',
      '$firebaseObject',
      '$firebaseUtils',
      '$log',
      function(
        Ref,
        $firebaseObject,
        $firebaseUtils,
        $log
      ) {

        return $firebaseObject.$extend({

          $loaded: function(resolve, reject) {
            var promise = this.$$conf.sync.ready();

            var that = this;

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
          $$added: function(snap) {

            var added = false;

            // check to make sure record does not exist
            var i = this.$indexFor(snap.key);

            if( i === -1 ) {
              // parse data and create record
              var rec = snap.val();
              if( ! angular.isObject(rec) ) {
                rec = { $value: rec };
              }

              if ( rec.troopPermission !== 'discharged'
                 && rec.troopPermission !== 'banned' ) {

                rec.$id = snap.key;
                rec.$priority = snap.getPriority();

                rec.abbreviation = rec.troopName.substr(0,4);

                $firebaseUtils.applyDefaults(rec, this.$$defaults);

                added = rec;
              }
            }

            return added;
          },
          // each time an update arrives from the server, apply the change locally
          $$updated: function(snap) {

            // applies new data to this object
            var changed = $firebaseUtils.updateRec(this, snap);
            // applies any defaults set using $$defaults
            $firebaseUtils.applyDefaults(this, this.$$defaults);

            if ( this.troopName ) {
              this.abbreviation = this.troopName.substr(0,4);
            }
            
            // returning true here causes $$notify to be triggered
            return changed;

          },
          $$error: function (err) {
            console.log('TroopFirebaseObject', this.$ref().toString(), $.extend({}, err))
            // prints an error to the console (via Angular's logger)
            $log.error(err);
            // frees memory and cancels any remaining listeners
            this.$destroy(err);
          },

        });
      }
    ]
  );
