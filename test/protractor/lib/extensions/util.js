var UtilExtension = function() {

  var that = this;

  //////////////////////////////////////////////
  //////////////// COMMON CODE ////////////////
  ////////////////////////////////////////////

  this.common = function() {

    var locators = requireExt('locators');
    var seeIf = requireExt('expectations');

    this.closeModals = function() {

      var deferred = q.defer();

      locators.app.modals.close.element.isDisplayed()
      .then(function(isVisible) {

        if ( isVisible ) {

          return locators.app.modals.close.element.click();

        }
        else {

          return q.reject(life.buildError(
            'NO_MODAL_TO_CLOSE',
            false,
            'Could not find any modals to close',
            'util.js',
            'common.closeModals'
          ));

        }

      })
      .then(function() {

        return (new that.delay).waitForElementToBeInvisible(locators.app.modals.close.element);

      })
      .then(function(isInvisible) {

        return seeIf(isInvisible).isTrue();

      })
      .then(function(expectation) {

        if ( ! expectation.met ) {

          return q.reject(life.buildError(
            'MODAL_WONT_CLOSE',
            true,
            'Failed to close modal left opened from previous failed spec',
            'util.js',
            'common.closeModals'
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

          // No Modals open
          if ( ! error.details ) {

            error = life.buildError(
              'NO_MODAL_TO_CLOSE',
              false,
              'Could not find any modals to close',
              'util.js',
              'common.closeModals'
            );

          }

          deferred.reject(error);

        }

      );

      return deferred.promise;

    };

  };

  //////////////////////////////////////////////
  ////////// RANDOM GENERATION UNITS //////////
  ////////////////////////////////////////////

  this.random = function() {

    this.string = function(length) {

      var result = '';

      for(var i = 0, ascii, upper; i < length; i++) {

        ascii = Math.round(Math.random() * 25) + 97;
        upper = Math.round(Math.random()) * 32;

        result += String.fromCharCode(ascii - upper);

      }

      return result;

    };

  };

  //////////////////////////////////////////////
  ////////////////// SNIPPETS /////////////////
  ////////////////////////////////////////////

  this.snippet = function() {

    this.setAttribute = function(selector, attribute, value, index) {

      if ( ! index ) {
        index = 0;
      }

      document.querySelectorAll(selector)[index].setAttribute(attribute, value);
    };

    this.getAngularValue = function(selector) {
      return document.querySelector(selector).value;
    };

  };

  //////////////////////////////////////////////
  //////////////// DELAY UNITS ////////////////
  ////////////////////////////////////////////

  this.delay = function() {

    this.waitForElementToExist = function(element) {

      var deferred = q.defer();

      browser.wait(function() {

        return browser.isElementPresent(element);
      }, config.timeout.waiting)
      .then(

        function() {
          deferred.resolve(true);
        },

        function() {
          deferred.resolve(false);
        }

      );

      return deferred.promise;

    };

    this.waitForElementToBeVisible = function(element) {
      console.log('waitForElementToBeVisible')
      var deferred = q.defer();


      // browser.waitforAngular()

      browser.wait(
        function() {

          return element.isElementPresent();
        },
        // 60000
        config.timeout.waiting
      )
      .then(

        function() {
          console.log('waitForElementToBeVisible true')

          deferred.resolve(true);
        },

        function() {
          console.log('waitForElementToBeVisible false')
          deferred.resolve(false);
        }

      );

      return deferred.promise;

    };

    this.waitForElementToBeInvisible = function(element) {

      var deferred = q.defer();
      var ec = protractor.ExpectedConditions;

      browser.wait(function() {
        return ec.invisibilityOf(element);
      }, config.timeout.waiting)
      .then(

        function() {
          deferred.resolve(true);
        },

        function() {
          deferred.resolve(false);
        }

      );

      return deferred.promise;
    };

    this.waitForElementToBeClickable = function(element) {

      var deferred = q.defer();

      var ec = protractor.ExpectedConditions;

      browser.wait(function() {
        return ec.elementToBeClickable(element);
      }, config.timeout.waiting)
      .then(

        function() {
          deferred.resolve(true);
        },

        function() {
          deferred.resolve(false);
        }

      );

      return deferred.promise;

    };

    this.waitForAttribute = function(element, attributeName, attributeValue) {

      var deferred = q.defer();

      browser.wait(function() {
        return element.getAttribute(attributeName).then(function(value) {
          return (value.indexOf(attributeValue) != -1);
        });
      }, config.timeout.waiting)
      .then(

        function() {
          deferred.resolve(true);
        },

        function() {
          deferred.resolve(false);
        }

      );

      return deferred.promise;

    };

    this.waitForNavigation = function(url) {

      var deferred = q.defer();

      browser.wait(function() {
        return browser.getCurrentUrl().then(function(actualUrl) {
          return url == actualUrl;
        });
      }, config.timeout.waiting)
      .then(

        function() {
          deferred.resolve(true);
        },

        function() {
          deferred.resolve(false);
        }

      );

      return deferred.promise;

    };

  };

};

module.exports = {

  delay: new ((new UtilExtension).delay)(),

  snippet: new ((new UtilExtension).snippet)(),

  random: new ((new UtilExtension).random)(),

  common: new ((new UtilExtension).common)()

};
