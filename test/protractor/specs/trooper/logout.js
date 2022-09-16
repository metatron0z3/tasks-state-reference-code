module.exports = function() {

  var trooper = requireLib('trooper');
  var commons = requireExt('util').common;

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('logout');
      reporter.reportStep('Running logout.js');

    });

    afterAll(function() {

      reporter.reportStep('logout.js finished');

    });

    it('should logout', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('logout spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('logout spec suspended due to a critical error!', 'logout'));

        done();

        return;

      }

      commons.closeModals()
      .then(function() {

        reporter.reportStep('Cleared leftovers from previous failure, ready to begin spec', 'success');

        life.addEvent(life.buildSuccess('Cleared leftovers from previous failure, ready to begin spec', 'logout'));

        reporter.reportStep('Attempting to logout');
        reporter.startTimer('logout');

      })
      .catch(function(error) {

        if ( error.code === 'NO_MODAL_TO_CLOSE' ) {

          reporter.reportStep('Attempting to logout');
          reporter.startTimer('logout');

        }
        else {

          reporter.reportStep('Cannot clear leftovers from previous failure, logout spec cannot start!', 'warning');

          life.addEvent(life.buildWarning('Cannot clear leftovers from previous failure, logout spec cannot start!', 'logout'));

          error.prerequisite = true;

          return q.reject(error);

        }

      })
      .then(function() {

        return trooper.logout();

      })
      .then(function() {

        reporter.endTimer('logout');
        reporter.reportStep('Successfully logged out', 'success');

        life.addEvent(life.buildSuccess('Successfully logged out', 'logout'));

      })
      .catch(function(error) {

        if ( ! error.prerequisite ) {

          reporter.endTimer('logout');
          reporter.reportStep('Logout failed with code ' + error.code, 'error');

        }

        error.spec = 'logout';

        life.addEvent(error);

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.low);

  });

};
