module.exports = function() {

  var auth = requireLib('auth');

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('detach');
      reporter.reportStep('Running detach.js');

    });

    afterAll(function() {

      reporter.reportStep('detach.js finished');

    });

    it('should switch trooper phone with secondary on databases', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('detach spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('detach spec suspended due to a critical error!', 'detach'));

        done();

        return;

      }

      reporter.reportStep('Attempting to detach trooper from databases');
      reporter.startTimer('detach');

      auth.switchTrooper(
        config.trooper.phone,
        config.trooper.name,
        config.trooper.secondaryPhone,
        config.trooper.secondaryName
      )
      .then(function() {

        reporter.reportStep('Successfully detached trooper from databases', 'success');

        life.addEvent(life.buildSuccess('Successfully detached trooper from databases', 'detach'));

      })
      .catch(function(error) {

        reporter.endTimer('detach');
        reporter.reportStep('Detaching trooper failed with code ' + error.code, 'error');

        error.spec = 'detach';

        life.addEvent(error);

        bail.consider();

      })
      .finally(function(error) {

        done();

      });

    }, config.timeout.spec.low);

  });

};
