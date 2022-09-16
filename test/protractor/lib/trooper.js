var TrooperLibrary = function() {
  var delays = requireExt('util').delay;
  var snippets = requireExt('util').snippet;
  var seeIf = requireExt('expectations');
  var locators = requireExt('locators');

  this.logout = function() {
    var deferred = q.defer();

    delays.waitForElementToExist(locators.app.menus.trooper.element)
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_TROOPER_MENU',
          true,
          'Could not find trooper menu using locators.app.menus.trooper.element',
          'trooper.js',
          'logout'
        ));

      }

      return locators.app.menus.trooper.element.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') == -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.trooper.selector,
          'class',
          value + ' show'
        )

      }

    })
    .then(function() {

      return delays.waitForAttribute(
        locators.app.menus.trooper.element,
        'class',
        'show');

    })
    .then(function(hasAttribute) {

      console.log('locators.app.menus.trooper.element: ', locators.app.menus.trooper.element)
      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_TROOPER_MENU',
          false,
          'Could not open trooper menu by applying "show" class using locators.app.menus.trooper.element',
          'trooper.js',
          'logout'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.menus.trooper.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'TROOPER_MENU_NOT_VISIBLE',
          false,
          'Could not open trooper menu after applying "show" class using locators.app.menus.trooper.element',
          'trooper.js',
          'logout'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.menus.trooper.items.logout.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'TROOPER_LOGOUT_OPTION_NOT_VISIBLE',
          false,
          'Could not find logout option in trooper menu using locators.app.menus.trooper.items.logout.element',
          'trooper.js',
          'logout'
        ));
      }

      return locators.app.menus.trooper.items.logout.element.click();

    })
    .then(function() {

      return delays.waitForNavigation(config.browser.domain + 'home');

    })
    .then(function(reached) {

      return seeIf(reached).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'TROOPER_NOT_LOGGED_OUT',
          true,
          'Could not logout trooper because browser did not navigate to ' + config.browser.domain + 'home',
          'trooper.js',
          'logout'
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
};

module.exports = new TrooperLibrary();
