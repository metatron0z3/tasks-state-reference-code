module.exports = function() {

  var boards = requireLib('boards');
  var commons = requireExt('util').common;

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('add-board');
      reporter.reportStep('Running add-board.js');

    });

    afterAll(function() {

      reporter.reportStep('add-board.js finished');

    });

    it('should create board called "Protractor Board"', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('add-board spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('add-board spec suspended due to a critical error!', 'add-board'));

        done();

        return;

      }

      commons.closeModals()
      .then(function() {

        reporter.reportStep('Cleared leftovers from previous failure, ready to begin spec', 'success');

        life.addEvent(life.buildSuccess('Cleared leftovers from previous failure, ready to begin spec', 'add-board'));

        reporter.reportStep('Attempting to create board');
        reporter.startTimer('add-board');

      })
      .catch(function(error) {

        if ( error.code === 'NO_MODAL_TO_CLOSE' ) {

          reporter.reportStep('Attempting to create board');
          reporter.startTimer('add-board');

        }
        else {

          reporter.reportStep('Cannot clear leftovers from previous failure, add-board spec cannot start!', 'warning');

          life.addEvent(life.buildWarning('Cannot clear leftovers from previous failure, add-board spec cannot start!', 'add-board'));

          error.prerequisite = true;

          return q.reject(error);

        }

      })
      .then(function() {

        return boards.addBoard(
          config.board.name,
          config.board.description,
          config.board.layout,
          config.board.readOnly,
          config.board.private,
          config.board.allCombinations
        );

      })
      .then(function() {

        reporter.endTimer('add-board');
        reporter.reportStep('Board successfully created', 'success');

        life.addEvent(life.buildSuccess('Board successfully created', 'add-board'));

      })
      .catch(function(error) {

        if ( ! error.prerequisite ) {

          reporter.endTimer('add-board');
          reporter.reportStep('Board creation failed with code: ' + error.code, 'error');

        }

        error.spec = 'add-board';

        life.addEvent(error);

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.high);

  });

};
