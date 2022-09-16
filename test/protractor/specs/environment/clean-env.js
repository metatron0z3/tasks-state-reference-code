module.exports = function() {

  var env = requireLib('env');

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('clean-env');
      reporter.reportStep('Running clean-env.js');

    });

    afterAll(function() {

      reporter.reportStep('clean-env.js finished');

    });

    it('should have its Firebase and MySQL databases cleaned', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('clean-env spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('clean-env spec suspended due to a critical error!', 'spec'));

        done();

        return;

      }

      reporter.reportStep('Attempting to clean Firebase and MySQL databases');
      reporter.startTimer('clean-env');

      env.clean()
      .then(function() {

        reporter.endTimer('clean-env');
        reporter.reportStep('Successfully cleaned databases', 'success');

        life.addEvent(life.buildSuccess('Successfully cleaned databases', 'clean-env'));

      })
      .catch(function(error) {

      reporter.endTimer('clean-env');
      reporter.reportStep('Cleaning databases failed with code ' + error.code, 'error');

      error.spec = 'clean-env';

      life.addEvent(error);

      bail.consider();

      })
      .finally(function(error) {

        done();

      });

    }, config.timeout.spec.low);

  });

};
