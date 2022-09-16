var MySqlExtension = function() {

  var mysql = requireMod('mysql');

  var connection = mysql.createConnection({
    host: config.mySql.host,
    user: config.mySql.user,
    password: config.mySql.password,
    database: config.mySql.database
  });

  this.executeQuery = function(queryString) {

    var deferred = q.defer();

    connection.query(queryString, function(error, results) {

      if(error) {

        deferred.reject(life.buildError(
          'CANNOT_EXECUTE_QUERY',
          true,
          'Could not execute query ' + queryString + ' on MySQL server'
        ));

      }
      else if(results.length === 0){

        deferred.reject(life.buildError(
          'QUERY_RETURNED_WITH_NO_RESULTS',
          true,
          'The query ' + queryString + ' had no results'
        ));

      }
      else {

        deferred.resolve(results);

      }

    });

    return deferred.promise;
  };
};

module.exports = new MySqlExtension();
