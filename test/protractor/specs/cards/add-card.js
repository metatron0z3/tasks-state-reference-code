module.exports = function() {

  var cards = requireLib('cards');
  var boards = requireLib('boards');
  var commons = requireExt('util').common;

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('add-card');
      reporter.reportStep('Running add-card.js');

    });

    afterAll(function() {

      reporter.reportStep('add-card.js finished');

    });

    it('should add card, verify, and archive it', function(done) {

      if ( bail.happening ) {

        reporter.reportStep('add-card spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('add-card spec suspended due to a critical error!', 'add-card'));

        done();

        return;

      }

      commons.closeModals()
      .then(function() {

        reporter.reportStep('Cleared leftovers from previous failure, ready to begin spec', 'success');

        life.addEvent(life.buildSuccess('Cleared leftovers from previous failure, ready to begin spec', 'add-card'));

        reporter.reportStep('Attempting to create card');
        reporter.startTimer('add-card');

      })
      .catch(function(error) {

        if ( error.code === 'NO_MODAL_TO_CLOSE' ) {

          reporter.reportStep('Attempting to create card');
          reporter.startTimer('add-card');

        }
        else {

          reporter.reportStep('Cannot clear leftovers from previous failure, add-card spec cannot start!', 'warning');

          life.addEvent(life.buildWarning('Cannot clear leftovers from previous failure, add-card spec cannot start!', 'add-card'));

          error.prerequisite = true;

          return q.reject(error);

        }

      })
      .then(function() {

        return boards.openBoard(config.card.board);

      })
      .then(function() {

        return cards.addCard(
          config.card.name,
          config.card.description,
          config.card.tags
        );

      })
      .then(function() {

        reporter.endTimer('add-card');
        reporter.reportStep('Successfully created card', 'success');

        life.addEvent(life.buildSuccess('Successfully created card', 'add-card'));

      })
      .catch(function(errors) {

        if ( ! errors.prerequisite ) {

          reporter.endTimer('add-card');

          if ( Object.prototype.toString.call(errors) === '[object Array]' ) {

            errors.forEach(function(error) {

              reporter.reportStep('Creating card failed with code ' + error.code, 'error');

              error.spec = 'add-card';

              life.addEvent(error);

            });

          }
          else {

            reporter.reportStep('Creating card failed with code ' + errors.code, 'error');

            errors.spec = 'add-card';

            life.addEvent(errors);

          }

        }
        else {
console.log('prerequisite');
          errors.spec = 'add-card';

          life.addEvent(errors);

        }

        bail.consider();

      })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.medium);

  });

};
