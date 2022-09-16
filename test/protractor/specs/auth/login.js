module.exports = function() {

  var auth = requireLib('auth');

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('login');
      reporter.reportStep('Running login.js');

    });

    afterAll(function() {

      reporter.reportStep('login.js finished');

    });

    it('should login as ' + config.trooper.email + ' in local Troop', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('login spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('login spec suspended due to a critical error!', 'login'));

        done();

        return;

      }

      reporter.reportStep('Attempting to login');
      reporter.startTimer('login');

      auth.login(
        config.trooper.email,
        config.trooper.password
      )
      .then(function() {

        reporter.endTimer('login');
        reporter.reportStep('Successfully logged in as ' + config.trooper.email, 'success');

        life.addEvent(life.buildSuccess('Successfully logged in as ' + config.trooper.email, 'login'));

      })
      .catch(function(error) {

        reporter.endTimer('login');
        reporter.reportStep('Login failed with code ' + error.code, 'error');

        error.prerequisite = true;

        return q.reject(error);

      })
      .then(function() {

        reporter.reportStep('Attempting to verify user');
        reporter.startTimer('verify-user');

        return auth.verifyLogin(
          config.trooper.email
        );

      })
      .then(function() {

        reporter.endTimer('verify-user');
        reporter.reportStep('Successfully verified', 'success');

        life.addEvent(life.buildSuccess('Successfully verified', 'login'));

      })
      .catch(function(error) {

        if ( ! error.prerequisite ) {

          reporter.endTimer('verify-user');
          reporter.reportStep('Verification failed with code ' + error.code, 'error');

        }

        error.spec = 'login';

        life.addEvent(error);

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.low);

  });

};
