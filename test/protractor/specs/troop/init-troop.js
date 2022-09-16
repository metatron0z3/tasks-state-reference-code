module.exports = function() {

  var troop = requireLib('troop');

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('init-troop');
      reporter.reportStep('Running init-troop.js');

    });

    afterAll(function() {

      reporter.reportStep('init-troop.js finished');

    });

    it('should open home page', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('init-troop spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('init-troop spec suspended due to a critical error!', 'init-troop'));

        done();

        return;

      }

      reporter.reportStep('Attempting to initialize troop');
      reporter.startTimer('init-troop');

      troop.initTroop()
      .then(function() {

        reporter.endTimer('init-troop');
        reporter.reportStep('Successfully initialized Troop app', 'success');

        life.addEvent(life.buildSuccess('Successfully initialized Troop app', 'init-troop'));

      })
      .catch(function(error) {

        reporter.endTimer('init-troop');
        reporter.reportStep('Troop app initialization failed with code ' + error.code, 'error');

        error.spec = 'init-troop';

        life.addEvent(error);

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.low);

  });

};
