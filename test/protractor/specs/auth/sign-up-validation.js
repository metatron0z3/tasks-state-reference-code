module.exports = function() {

  var auth = requireLib('auth');

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('sign-up-validation');
      reporter.reportStep('Running sign-up-validation.js');

    });

    afterAll(function() {

      reporter.reportStep('sign-up-validation.js finished');

    });

    it('should test signup validation', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('sign-up-validation spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('sign-up-validation spec suspended due to a critical error!', 'sign-up-validation'));

        done();

        return;

      }

      q.try(function() {

        reporter.reportStep('Attempting to test signup verification');
        reporter.startTimer('sign-up-validation');

        return auth.validateSignupPhones(config.validations.signup.phones);

      })
      .then(function() {

        reporter.endTimer('sign-up-validation');
        reporter.reportStep('Successfully tested signup verification', 'success');

        life.addEvent(life.buildSuccess('Successfully tested signup verification', 'sign-up-validation'));

      })
      .catch(function(errors) {

        reporter.endTimer('sign-up-validation');

        if ( Object.prototype.toString.call(errors) === '[object Array]' ) {

          errors.forEach(function(error) {

            reporter.reportStep('Testing signup verification failed with code ' + error.code, 'error');

            error.spec = 'sign-up-validation';

            life.addEvent(error);

          });

        }
        else {

          reporter.reportStep('Testing signup verification failed with code ' + errors.code, 'error');

          errors.spec = 'sign-up-validation';

          life.addEvent(errors);

        }

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.high);

  });

};
