function seeIf(actual) {

  return {

    isSameAs: function(expected) {
      var deferred = q.defer();
      var expectation = {};

      if ( actual === undefined || expected === undefined ) {

        deferred.reject({ code: 'INVALID_EXPECTATION_ARGUMENTS' });

        return deferred.promise;

      }

      expectation.met = (actual === expected);

      deferred.resolve(expectation);

      return deferred.promise;

    },

    isTrue: function() {
      var deferred = q.defer();
      var expectation = {};

      if ( typeof actual !== 'boolean' ) {

        deferred.reject({ code: 'INVALID_EXPECTATION_ARGUMENTS' });

        return deferred.promise;

      }

      expectation.met = (actual === true);

      deferred.resolve(expectation);

      return deferred.promise;

    },

    isNot: function(expected) {
      var deferred = q.defer();
      var expectation = {};

      if ( actual === undefined || expected === undefined ) {

        deferred.reject({ code: 'INVALID_EXPECTATION_ARGUMENTS' });

        return deferred.promise;

      }

      expectation.met = (actual !== expected);

      deferred.resolve(expectation);

      return deferred.promise;

    },

    contains: function(expected) {

      var deferred = q.defer();
      var expectation = {};

      if ( actual === undefined || expected === undefined ) {

        deferred.reject({ code: 'INVALID_EXPECTATION_ARGUMENTS' });

        return deferred.promise;

      }

      expectation.met = (actual.indexOf(expected) !== -1);

      deferred.resolve(expectation);

      return deferred.promise;

    }

  };

}

module.exports = seeIf;
