var EnvLibrary = function() {

  var firebase = requireExt('firebase');
  var mysql = requireExt('mysql');

  this.clean = function() {

    var deferred = q.defer();

    firebase.auth()
    .then(function() {

      return firebase.wipe();

    })
    .then(function() {

      return mysql.executeQuery(
        'DELETE FROM `' +
        config.mySql.database +
        '`.' + config.mySql.tables.users +
        ' WHERE ' + config.mySql.fields.id +
        ' LIKE "%+%"'
      );

    })
    .then(function() {

      return mysql.executeQuery(
        'DELETE FROM `' + config.mySql.database +
        '`.' + config.mySql.tables.codes
      );

    })
    .then(function() {

      return mysql.executeQuery(
        'ALTER TABLE `' + config.mySql.database +
        '`.' + config.mySql.tables.users +
        ' AUTO_INCREMENT = 3'
      );

    })
    .then(function() {

      deferred.resolve();

    })
    .catch(function(error) {

      error.lib = 'env.js';
      error.func = 'clean';

      deferred.reject(error);

    });

    return deferred.promise;

  };

};

module.exports = new EnvLibrary();
