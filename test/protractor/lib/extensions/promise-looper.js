var PromiseLooper = function() {

  this.promises = [];
  this.errors = [];

  this.loop = function(promiseIndex) {

    if ( promiseIndex === this.promises.length ) {

      return;

    }

    var that = this;
    var promise = this.promises[promiseIndex];

    promise.do();

    promise.finally(function() {

      promiseIndex++;
      that.loop(promiseIndex);

    });

  };

  this.wrapFunction = function(mother, func, args) {

    if ( typeof func !== 'function') {

      this.errors.push('Invalid argument at wrapFunction: func is not a function!');

      return;

    }

    if ( ! mother ) {

      this.errors.push('Invalid argument at wrapFunction: mother is falsy!');

      return;

    }

    if ( Object.prototype.toString.call(args) !== '[object Array]' ) {

      args = [args];

    }

    var isChild = false;

    for ( property in mother ) {

      if ( mother[property] === func ) {

        isChild = true;

      }

    }

    if ( ! isChild ) {

      this.errors.push('Error at wrapFunction: func is not a child of mother!');

      return;

    }

    var wrapper = function() {

      var deferred = q.defer();

      deferred.promise.do = function() {

        func.apply(mother, args)
        .then(function() {

          deferred.resolve();

        })
        .catch(function(error) {

          deferred.reject(error);

        });

      };

      return deferred.promise;

    };

    return wrapper();

  };

  this.addPromise = function(promise) {

    if ( ! promise || ! promise.then || ! promise.do ) {

      this.errors.push('Invalid argument at addPromise: promise is falsy or not a valid promise wrapper!');

      return;

    }

    this.promises.push(promise);

  };

  this.addFunction = function(mother, func, args) {

    this.addPromise(this.wrapFunction(mother, func, args));

  };

  this.loopThrough = function() {

    if ( this.promises.length === 0 ) {

      this.errors.push('Error at loopThrough: There are no promise wrappers to loop through!');

    }

    var that = this;
    var deferred = q.defer();

    this.checkErrors()
    .then(function() {

      that.loop(0);

      q.allSettled(that.promises)
      .then(function(results) {

        var reasons = [];

        _.each(results, function(result) {

          if ( result.state === 'rejected' ) {

            reasons.push(result.reason);

          }

        });

        if ( reasons.length === 0 ) {

          deferred.resolve();

        }
        else {

          deferred.reject(reasons);

        }

      })
      .done(function() {

        that.clear();

      });

    })
    .catch(function(error) {

      deferred.reject(error);

    });

    return deferred.promise;

  };

  this.clear = function() {

    this.promises.length = 0;
    this.errors.length = 0;

  };

  this.checkErrors = function() {

    var deferred = q.defer();

    if ( this.errors.length === 0 ) {

      deferred.resolve();

    }
    else {

      deferred.reject(life.buildError(
        'ERRORS_EXIST_IN_PROMISE_LOOPER',
        false,
        'Some errors were thrown inside Promise Looper: ' + this.errors,
        'promise-looper',
        'checkErrors'
      ));

    }

    return deferred.promise;

  };

};

module.exports = new PromiseLooper();
