var FirebaseExtension = function() {

  var Firebase = requireMod('firebase');

  var ref = new Firebase(config.firebase.url);

  this.auth = function() {

    var deferred = q.defer();

    ref.authWithCustomToken(config.firebase.secret)
    .then(function() {

      deferred.resolve();

    })
    .catch(function() {

      deferred.reject(life.buildError(
        'FIREBASE_AUTHENTICATION_FAILED',
        true,
        'Could not authenticate with Firebase using url ' + config.firebase.url + ' and secret key ' + config.firebase.secret
      ));

    });

    return deferred.promise;

  };

  this.wipe = function() {

    var deferred = q.defer();

    ref.remove()
    .then(function() {

      deferred.resolve();

    })
    .catch(function() {

      deferred.reject(life.buildError(
        'CANNOT_CLEAR_FIREBASE',
        true,
        'Could not clear Firebase database using url ' + config.firebase.url + ' and secret key ' + config.firebase.secret
      ));

    });

    return deferred.promise;

  };

  this.updateUser = function(childName, phone, name) {

    var deferred = q.defer();
    var childRef;

    ref.once('value', function(data) {

      if ( data.child('users/' + childName).exists() ) {

        childRef = ref.child('users/' + childName);

      }
      else {

        return q.reject(life.buildError(
          'CANNOT_FIND_FIREBASE_CHILD',
          true,
          'Could not find child at users/' + childName + ' on Firebase database'
        ));

      }

    })
    .then(function() {

      return childRef.update({
        firstName: name.first,
        lastName: name.last,
        loginId: phone
      });

    })
    .then(function() {

      deferred.resolve();

    })
    .catch(function(error) {

      if ( error.critical === undefined ) {

        error = life.buildError(
          'CANNOT_UPDATE_FIREBASE_CHILD',
          true,
          'Could not update child at users/' + childName
        );

      }

      deferred.reject(error);

    });

    return deferred.promise;

  };

};

module.exports = new FirebaseExtension();
