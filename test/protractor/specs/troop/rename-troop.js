module.exports = function() {

  var troop = requireLib('troop');
  var commons = requireExt('util').common;

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('rename-troop');
      reporter.reportStep('Running rename-troop.js');

    });

    afterAll(function() {

      reporter.reportStep('rename-troop.js finished');

    });

    it('should rename troop to ' + config.troop.newName, function(done) {

      if ( bail.happening ) {

        reporter.reportStep('rename-troop spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('rename-troop spec suspended due to a critical error!', 'rename-troop'));

        done();

        return;

      }

      commons.closeModals()
      .then(function() {

        reporter.reportStep('Cleared leftovers from previous failure, ready to begin spec', 'success');

        life.addEvent(life.buildSuccess('Cleared leftovers from previous failure, ready to begin spec', 'rename-troop'));

        reporter.reportStep('Attempting to rename troop');
        reporter.startTimer('rename-troop');

      })
      .catch(function(error) {

        if ( error.code === 'NO_MODAL_TO_CLOSE' ) {

          reporter.reportStep('Attempting to rename troop');
          reporter.startTimer('rename-troop');

        }
        else {

          reporter.reportStep('Cannot clear leftovers from previous failure, rename-troop spec cannot start!', 'warning');

          life.addEvent(life.buildWarning('Cannot clear leftovers from previous failure, rename-troop spec cannot start!', 'rename-troop'));

          error.prerequisite = true;

          return q.reject(error);

        }

      })
      .then(function() {

        return troop.renameTroop(config.troop.newName);

      })
      .then(function() {

        reporter.endTimer('rename-troop');
        reporter.reportStep('Successfully renamed troop to ' + config.troop.newName, 'success');

        life.addEvent(life.buildSuccess('Successfully renamed troop to ' + config.troop.newName, 'rename-troop'));

      })
      .catch(function(error) {

        if ( ! error.prerequisite ) {

          reporter.endTimer('rename-troop');
          reporter.reportStep('Troop rename failed with code ' + error.code, 'error');

        }

        error.spec = 'rename-troop';

        life.addEvent(error);

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.low);

  });

};
