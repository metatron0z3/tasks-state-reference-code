/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';

module.exports = function() {

  var auth = requireLib('auth');

  describe('Troop', function() {

    beforeAll(function() {

      reporter.reportSpec('sign-up');
      reporter.reportStep('Running sign-up.js');

    });

    afterAll(function() {

      reporter.reportStep('sign-up.js finished');

    });

    it('should signup ' + config.trooper.email, function(done) {

      if ( bail.happening ) {

        reporter.reportStep('sign-up spec suspended due to a critical error!', 'warning');

        life.addEvent(life.buildWarning('sign-up spec suspended due to a critical error!', 'sign-up'));

        done();

        return;

      }

      reporter.reportStep('Attempting to sign up');
      reporter.startTimer('sign-up');

      // console.log('locators.home.buttons.signUp.element')
      // console.log(locators.home.buttons.signUp.element)

      auth.signup(
        config.trooper.email,
        config.trooper.name,
        config.trooper.password
      )
      .then(function() {

        reporter.endTimer('sign-up');
        reporter.reportStep('Successfully signed up as ' + config.trooper.name, 'success');

        life.addEvent(life.buildSuccess('Successfully signed up as ' + config.trooper.email, 'sign-up'));

      })
      .catch(function(error) {

        reporter.endTimer('sign-up');
        reporter.reportStep('Sign up failed with code ' + error.code, 'error');

        console.log(error)

        error.prerequisite = true;

        return q.reject(error);

      })
      // .then(function() {
      //
      //   reporter.reportStep('Attempting to verify user');
      //   reporter.startTimer('verify-user');
      //
      //   return auth.verifyLogin(config.trooper.email);
      //
      // })
      // .then(function() {
      //
      //   reporter.endTimer('verify-user');
      //   reporter.reportStep('Successfully verified', 'success');
      //
      //   life.addEvent(life.buildSuccess('Successfully verified', 'sign-up'));
      //
      // })
      // .catch(function(error) {
      //
      //   if ( ! error.prerequisite ) {
      //
      //     reporter.endTimer('verify-user');
      //     reporter.reportStep('Verification failed with code ' + error.code, 'error');
      //
      //   }
      //
      //   error.spec = 'sign-up';
      //
      //   life.addEvent(error);
      //
      //   bail.consider();
      //
      // })
      .finally(function() {

        done();

      });

    }, config.timeout.spec.medium);

  });

};
