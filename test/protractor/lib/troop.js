var TroopLibrary = function() {
  var delays = requireExt('util').delay;
  var snippets = requireExt('util').snippet;
  var seeIf = requireExt('expectations');
  var locators = requireExt('locators');

  this.initTroop = function() {

    var deferred = q.defer();

    if (config.browser.window.maximized) {

      browser.driver.manage().window().maximize();

    }
    else {

      browser.driver.manage().window().setSize(
        config.browser.window.width,
        config.browser.window.height
      );

    }

    browser.get(config.browser.domain)
    .then(function() {

      return delays.waitForNavigation(config.browser.domain + 'home');

    })
    .then(function(reached) {

      return seeIf(reached).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_TROOP',
          true,
          'Could not navigate to troop using url ' + config.browser.domain,
          'troop.js',
          'initTroop'
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

  this.renameTroop = function(troopName) {

    var deferred = q.defer();

    delays.waitForElementToExist(locators.app.menus.troop.element)
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_TROOP_MENU',
          false,
          'Could not find troop menu using locators.app.menus.troop.element',
          'troop.js',
          'renameTroop'
        ));

      }

      return locators.app.menus.troop.element.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') == -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.troop.selector,
          'class',
          value + ' show'
        );

      }

    })
    .then(function() {

      return delays.waitForAttribute(
        locators.app.menus.troop.element,
        'class',
        'show'
      );

    })
    .then(function(hasAttribute) {

      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_TROOP_MENU',
          false,
          'Could not open troop menu by applying "show" class using locators.app.menus.troop.element',
          'troop.js',
          'renameTroop'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.menus.troop.items.settings.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'TROOP_EDIT_OPTION_NOT_VISIBLE',
          false,
          'Could not find edit option in troop menu using locators.app.menus.troop.items.settings.element',
          'troop.js',
          'renameTroop'
        ));
      }

      return locators.app.menus.troop.items.settings.element.click();

    })
    .then(function() {

      return delays.waitForElementToExist(locators.app.modals.troopSettings.name.element);

    })
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_TROOP_SETTINGS',
          false,
          'Could not open edit troop modal because name textbox is not visible using locators.app.modals.troopSettings.name.element',
          'troop.js',
          'renameTroop'
        ));
      }

      return locators.app.modals.troopSettings.name.element.clear();

    })
    .then(function() {

      return locators.app.modals.troopSettings.name.element.sendKeys(troopName);

    })
    .then(function() {

      return locators.app.modals.troopSettings.save.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.troopSettings.name.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close edit troop modal because name textbox is still visible using locators.app.modals.troopSettings.name.element',
          'troop.js',
          'renameTroop'
        ));
      }

      return locators.app.labels.troopName.element.getText();

    })
    .then(function(text) {

      return seeIf(text).isSameAs(troopName);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_TROOP_NAME',
          false,
          'Troop name does not match the expected name ' + troopName + ' using locators.app.labels.troopName.element',
          'troop.js',
          'renameTroop'
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

module.exports = new TroopLibrary();
