/* global Firebase, _, $ */
/* jshint strict: true */
/* jshint -W014 */
'use strict';
var AuthLibrary = function() {

  var delays = requireExt('util').delay;
  var mySql = requireExt('mysql');
  var seeIf = requireExt('expectations');
  var locators = requireExt('locators');
  var firebase = requireExt('firebase');

  function getVerificationCodeFromDatabase(phone) {

    var deferred = q.defer();

    var queryString = "SELECT * FROM `" +
      config.mySql.database + "`." +
      config.mySql.tables.codes +
      " WHERE " + config.mySql.fields.id +
      " LIKE '%" + phone + "%'";

    mySql.executeQuery(queryString)
    .then(function(results) {

      deferred.resolve(results[results.length - 1].code);

    })
    .catch(function(error) {

      deferred.reject(error);

    });

    return deferred.promise;
  }

  function getTrooperNameFromDatabase(phone) {

    var deferred = q.defer();

    var queryString = "SELECT * FROM `" +
      config.mySql.database + "`." +
      config.mySql.tables.users +
      " WHERE " + config.mySql.fields.id +
      " LIKE '%" + phone + "%'";

    mySql.executeQuery(queryString)
    .then(function(results) {

      deferred.resolve(results[0]);

    })
    .catch(function(error) {

      deferred.reject(error);

    });

    return deferred.promise;
  }

  this.login = function(phone, password) {

    var deferred = q.defer();

    delays.waitForElementToExist(locators.home.buttons.login.element)
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_LOGIN_BUTTON',
          true,
          'Could not find login button using locators.home.buttons.login.element because it doesn\'t exist!',
          'auth.js',
          'login'
        ));

      }

      return delays.waitForElementToBeVisible(locators.home.buttons.login.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_LOGIN_BUTTON',
          true,
          'Could not find login button using locators.home.buttons.login.element',
          'auth.js',
          'login'
        ));

      }

      return locators.home.buttons.login.element.click();

    })
    .then(function() {

      return delays.waitForNavigation(config.browser.domain + 'auth/login');

    })
    .then(function(reached) {

      return seeIf(reached).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'NAVIGATION_TO_LOGIN_PAGE_FAILED',
          true,
          'Could not navigate to ' + config.browser.domain + 'login',
          'auth.js',
          'login'
        ));

      }

      return locators.app.modals.login.phone.element.sendKeys(phone);

    })
    .then(function() {

      return locators.app.modals.login.password.element.sendKeys(password);

    })
    .then(function() {

      return locators.app.modals.login.signIn.element.click();

    })
    .then(function() {

      return delays.waitForElementToExist(locators.app.labels.troopName.element);

    })
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'TROOPER_NAME_LABEL_DOES_NOT_EXIST',
          false,
          'Could not find trooper label using CSS selector in locators.app.labels.troopName.element',
          'auth.js',
          'login'
        ));

      }

    })
    .then(

      // success
      function() {
        deferred.resolve();
      },

      // fail
      function(error) {
        deferred.reject(error);
      }

    );

    return deferred.promise;
  };

  this.verifyLogin = function(phone) {

    var deferred = q.defer();
    var trooperName = "";

    getTrooperNameFromDatabase(phone)
    .then(function(trooper) {

      trooperName = trooper.firstName + ' ' + trooper.lastName;

      return delays.waitForElementToExist(locators.app.labels.trooperName.element);

    })
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'TROOPER_NAME_LABEL_DOES_NOT_EXIST',
          false,
          'Could not find trooper label using CSS selector in locators.app.labels.troopName.element',
          'auth.js',
          'verifyLogin'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.labels.troopName.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'TROOPER_NAME_LABEL_NOT_VISIBLE',
          false,
          'locators.app.labels.troopName.element is not visible',
          'auth.js',
          'verifyLogin'
        ));
      }

      return locators.app.labels.trooperName.element.getText();

    })
    .then(function(text) {

      return seeIf(text).isSameAs(trooperName);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_TROOPER_NAME',
          false,
          'The trooper name associated to ' + phone + ' on database is not the same as what is displayed inside locators.app.labels.troopName.element',
          'auth.js',
          'verifyLogin'
        ));
      }

      return locators.app.labels.trooperPermission.element.getText();

    })
    .then(function(text) {

      return seeIf(text).isSameAs(config.troop.permissionNames[config.troop.permissions.owner]);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_TROOPER_PERMISSION',
          false,
          'The trooper permission at troop level is incorrect',
          'auth.js',
          'verifyLogin'
        ));
      }

    })
    .then(

      // success
      function() {
        deferred.resolve();
      },

      // fail
      function(error) {

        if ( ! error.lib ) {

          error.lib = 'auth.js';
          error.func = 'verifyLogin';

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;
  };

  this.signup = function(email, name, password) {

    var deferred = q.defer();

    console.log('email')
    console.log(email)
    console.log('name')
    console.log(name)
    console.log('password')
    console.log(password)

    // console.log(browser)

    // browser.ignoreSynchronization = true;
    // browser.waitForAngular();
    // browser.sleep(500);

    delays.waitForElementToExist(locators.home.buttons.signUp.element)
    .then(function(isPresent) {

      console.log('present:', isPresent);

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'SIGNUP_BUTTON_DOES_NOT_EXIST',
          true,
          'Could not find signup button using locators.home.buttons.signUp.element',
          'auth.js',
          'signup'
        ));

      }

      return delays.waitForElementToBeVisible(locators.home.buttons.signUp.element);

    })
    .then(function(isVisible) {

      console.log('Do I see this?')
      console.log('isVisible')
      console.log(isVisible)
      // console.log('locators.home.buttons.signUp.element.evaluate()')
      // console.log(locators.home.buttons.signUp.element.evaluate())
      // console.log('window.angular')
      // console.log(window.angular)


      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      console.log('or this?')
      console.log('expectation')
      console.log('expectation:', expectation.met)

      // if ( ! expectation.met ) {
      //
      //   return q.reject(life.buildError(
      //     'CANNOT_FIND_SIGNUP_BUTTON',
      //     true,
      //     'Could not find signup button using locators.home.buttons.signUp.element',
      //     'auth.js',
      //     'signup'
      //   ));
      //
      // }

      return locators.home.buttons.signUp.element.click();

    })
    .then(function() {

      return delays.waitForNavigation(config.browser.domain + 'auth/sign-up');

    })
    .then(function(reached) {

      return seeIf(reached).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'NAVIGATION_TO_SIGUP_PAGE_FAILED',
          true,
          'Could not navigate to ' + config.browser.domain + 'sign-up',
          'auth.js',
          'signup'
        ));
      }

      return locators.app.modals.signUp.name.element.sendKeys(name);

    })
    .then(function() {

      return locators.app.modals.signUp.email.element.sendKeys(email);

    })
    .then(function() {

      return locators.app.modals.signUp.password.element.sendKeys(password);

    })
    .then(function(){

      return locators.auth.buttons.signUp.element.click();
    })
    // .then(function() {
    //
    //   return locators.app.modals.signUp.next.element.click();
    //
    // })
    // .then(function() {
    //
    //   return delays.waitForElementToBeVisible(locators.app.modals.signUp.code.element);
    //
    // })
    // .then(function(isVisible) {
    //
    //   return seeIf(isVisible).isTrue();
    //
    // })
    // .then(function(expectation) {
    //
    //   if ( ! expectation.met ) {
    //     return q.reject(life.buildError(
    //       'CANNOT_REACH_NEXT_SIGNUP_STEP',
    //       true,
    //       'Could not proceed to verification step of signup after clicking on NEXT button',
    //       'auth.js',
    //       'signup'
    //     ));
    //   }
    //
    //   return getVerificationCodeFromDatabase(phone);
    //
    // })
    // .then(function(code) {
    //
    //   return locators.app.modals.signUp.code.element.sendKeys(code);
    //
    // })
    // .then(function() {
    //
    //   return locators.app.modals.signUp.next.element.click();
    //
    // })
    // .then(function() {
    //
    //   return delays.waitForElementToBeVisible(locators.app.modals.signUp.troopName.element);
    //
    // })
    // .then(function(isVisible) {
    //
    //   if ( ! isVisible ) {
    //     return q.reject(life.buildError(
    //       'CANNOT_REACH_NEXT_SIGNUP_STEP',
    //       true,
    //       'Could not proceed to troop creation step of signup after clicking on NEXT button',
    //       'auth.js',
    //       'signup'
    //     ));
    //   }
    //
    //   return locators.app.modals.signUp.troopName.element.sendKeys(troopName);
    //
    // })
    // .then(function() {
    //
    //   return locators.app.modals.signUp.next.element.click();
    //
    // })
    // .then(function() {
    //
    //     return delays.waitForElementToExist(locators.app.labels.troopName.element);
    //
    // })
    // .then(function(isPresent) {
    //
    //   return seeIf(isPresent).isTrue();
    //
    // })
    // .then(function(expectation) {
    //
    //   if ( ! expectation.met ) {
    //
    //     return q.reject(life.buildError(
    //       'CANNOT_LOGIN_AFTER_SIGNUP',
    //       true,
    //       'Could not find trooper label using CSS selector in locators.app.labels.troopName.element',
    //       'auth.js',
    //       'signup'
    //     ));
    //
    //   }
    //
    // })
    .then(

      // success
      function() {
        console.log('success')
        deferred.resolve();
      },

      // fail
      function(error) {

        if ( ! error.lib ) {

          error.lib = 'auth.js';
          error.func = 'signUp';

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;
  };

  this.validateSignupPhones = function(phones) {

    var deferred = q.defer();
    var that = this;

    q.try(function() {


      return browser.get(config.browser.domain + 'sign-up');

    })
    .then(function() {

      return delays.waitForNavigation(config.browser.domain + 'sign-up');

    })
    .then(function(reached) {

      return seeIf(reached).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'NAVIGATION_TO_SIGUP_PAGE_FAILED',
          true,
          'Could not open signup page by navigating to ' + config.browser.domain + 'sign-up',
          'auth.js',
          'validateSignupPhones'
        ));

      }

      return delays.waitForElementToExist(locators.app.modals.signUp.phone.element);

    })
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_SIGNUP_MODAL',
          true,
          'Could not find signup modal because element is not present using locators.app.modals.signUp.phone.element',
          'auth.js',
          'validateSignupPhones'
        ));

      }

      return delays.waitForElementToBeVisible(locators.app.modals.signUp.phone.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'PHONE_INPUT_NOT_VISIBLE',
          true,
          'The phone input is not visible on signup modal using locators.app.modals.signUp.phone.element',
          'auth.js',
          'validateSignupPhones'
        ));

      }

      return locators.app.modals.signUp.phone.element.click();

    })
    .then(function() {

      return locators.app.modals.signUp.firstName.element.click();

    })
    .then(function() {

      return locators.app.modals.signUp.phone.element.click();

    })
    .then(function() {

      promiseLooper.clear();

      phones.forEach(function(phone) {

        promiseLooper.addFunction(
          that,
          that.validateSignupPhone,
          phone
        );

      });

      return promiseLooper.loopThrough();

    })
    .then(

      // success
      function() {

        deferred.resolve();

      },

      // fail
      function(error) {

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

  this.validateSignupPhone = function(phone) {

    var deferred = q.defer();

    q.try(function() {

      return locators.app.modals.signUp.phone.element.clear();

    })
    .then(function() {

      return locators.app.modals.signUp.phone.element.sendKeys(phone);

    })
    .then(function() {

      return locators.app.modals.signUp.errors.phone.element.isPresent();

    })
    .then(function(isPresent) {

      return seeIf(isPresent).isNot(true);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'SIGNUP_PHONE_ERROR_THROWN',
          false,
          'Phone number ' + phone + ' did not pass the validation test',
          'auth.js',
          'validateSignupPhone'
        ));

      }

    })
    .then(

      // success
      function() {

        deferred.resolve();

      },

      // fail
      function(error) {

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

  this.switchTrooper = function(oldPhone, oldName, newPhone, newName) {

    var deferred = q.defer();

    firebase.auth()
    .then(function() {

      return firebase.updateUser('user3', newPhone, newName);

    })
    .then(function() {

      return mySql.executeQuery(
        'UPDATE `' + config.mySql.database +
        '`.' + config.mySql.tables.users +
        ' SET ' + config.mySql.fields.id +
        '="' + newPhone + '", ' +
        config.mySql.fields.firstName +
        '="' + newName.first + '", ' +
        config.mySql.fields.lastName +
        '="' + newName.last +
        '" WHERE id=3'
      );

    })
    .then(function() {

      deferred.resolve();

    })
    .catch(function(error) {

      deferred.reject(error);

    });

    return deferred.promise;

  };

};

module.exports = new AuthLibrary();
