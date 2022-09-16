var CardLibrary = function() {
  var randoms = requireExt('util').random;
  var delays = requireExt('util').delay;
  var snippets = requireExt('util').snippet;
  var seeIf = requireExt('expectations');
  var locators = requireExt('locators');

  function createCard(
    cardName,
    cardDescription,
    cardTags
  ) {

    var deferred = q.defer();

    delays.waitForElementToBeVisible(locators.app.buttons.addCard.element)
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'ADD_CARD_BUTTON_NOT_VISIBLE',
          false,
          'Could not find add card button using locators.app.buttons.addCard.element',
          'cards.js',
          'createCard'
        ));
      }

      return locators.app.buttons.addCard.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.card.name.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_ADD_CARD_MODAL',
          false,
          'Could not open add card modal because name textbox was not found using locators.app.modals.card.name.element',
          'cards.js',
          'createCard'
        ));
      }

      return locators.app.modals.card.name.element.sendKeys(cardName);

    })
    .then(function() {

      return locators.app.modals.card.description.element.sendKeys(cardDescription);

    })
    .then(function() {

      return locators.app.modals.card.tags.element.sendKeys('#' + cardTags.join(' #'));

    })
    .then(function() {

      return locators.app.modals.card.save.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.card.name.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close add card modal because name textbox is still visible using locators.app.modals.card.name.element',
          'cards.js',
          'createCard'
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

  }

  this.archiveTag = function(tagIndex, tagName) {

    var that = this;
    var deferred = q.defer();
    var tagMenu, tagArchiveOption;

    q.try(function() {

      return locators.app.menus.all.tag.elements.get(tagIndex);

    })
    .then(function(menu) {

      tagMenu = menu;

      return tagMenu.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') === -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.all.tag.selector,
          'class',
          value + ' show',
          tagIndex
        );

      }

    })
    .then(function() {

      return delays.waitForAttribute(tagMenu, 'class', 'show');

    })
    .then(function(hasAttribute) {

      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_OPEN_TAG_MENU',
          false,
          'Could not open tag menu by applying show class to locators.app.menus.all.tag.elements',
          'cards.js',
          'archiveTag'
        ));

      }

      return locators.app.menus.all.tag.items.archive.elements.get(tagIndex);

    })
    .then(function(element) {

      tagArchiveOption = element;

      return delays.waitForElementToBeVisible(tagArchiveOption);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_TAG_ARCHIVE_OPTION',
          false,
          'Could not find archive option in tag menu using locators.app.menus.all.tag.items.archive.elements',
          'cards.js',
          'archiveTag'
        ));

      }

      return tagArchiveOption.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.confirm.accept.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_OPEN_CONFIRM_MODAL',
          false,
          'Could not open confirm modal because ACCEPT button is not visible using locators.app.modals.confirm.accept.element',
          'cards.js',
          'archiveTag'
        ));

      }

      return locators.app.modals.confirm.accept.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.confirm.accept.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close confirm modal because ACCEPT button is still visible using locators.app.modals.confirm.accept.element',
          'cards.js',
          'archiveTag'
        ));

      }

      return that.verifyArchiveTag(tagIndex, tagName);

    })
    .then(

      // success
      function() {

        deferred.resolve();

      },

      // fail
      function(error) {

        if ( error.type === undefined ) {

          error = life.buildError(
            'CANNOT_FIND_TAG',
            false,
            'Could not find tag menu at index ' + tagIndex + ' using locators.app.menus.all.tag.elements',
            'cards.js',
            'archiveTag'
          );

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

  this.verifyArchiveTag = function(tagIndex, tagName) {

    var deferred = q.defer();
    var foundIndex = -1;

    q.try(function() {

      return locators.app.labels.all.tagTitle.elements;

    })
    .then(function(elements) {

      return elements.forEach(function(element, index) {

        element.getText().then(function(text) {

          if ( text === '#' + tagName ) {

            foundIndex = index;

          }

        });

      });

    })
    .then(function() {

      return seeIf(foundIndex).isSameAs(-1);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'ARCHIVED_TAG_STILL_EXISTS',
          false,
          'The tag was expected to be archived while it actually exists at index ' + foundIndex + ' using locators.app.labels.all.tagTitle.elements',
          'cards.js',
          'verifyArchiveTag'
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

  this.addCard = function(
    cardName,
    cardDescription,
    cardTags
  ) {

    var deferred = q.defer();
    var that = this;

    createCard(
      cardName,
      cardDescription,
      cardTags
    )
    .then(function() {

      return that.verifyCard(
        cardName,
        cardDescription,
        cardTags
      );

    })
    .then(function() {

      if ( config.card.archive ) {
        return that.archiveCard(cardName);
      }

    })
    .then(function() {

      if ( config.card.archiveTags ) {

        return that.archiveTags(cardTags);

      }

    })
    .then(function() {

      deferred.resolve();

    })
    .catch(function(error) {

      deferred.reject(error);

    });

    return deferred.promise;

  };

  this.verifyCard = function(
    cardName,
    cardDescription,
    cardTags
  ) {

    var deferred = q.defer();
    var cardIndex = -1;
    var cardMenu, cardMenuEdit;
    var cardActualTags;

    locators.app.labels.all.cardName.elements.each(function(element, index) {

      element.getText().then(function(text) {

        if ( text === cardName ) {
          cardIndex = index;
        }

      });

    })
    .then(function() {

      return seeIf(cardIndex).isNot(-1);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CARD_NOT_FOUND',
          false,
          'Could not find card with name ' + cardName + ' using locators.app.labels.all.cardName.elements',
          'cards.js',
          'verifyCard'
        ));
      }

      return locators.app.menus.all.card.elements.get(cardIndex);

    })
    .then(function(element) {

      cardMenu = element;

      return cardMenu.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') === -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.all.card.selector,
          'class',
          value + ' show',
          cardIndex
        );

      }

    })
    .then(function() {

      return delays.waitForAttribute(cardMenu, 'class', 'show');

    })
    .then(function(hasAttribute) {

      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_CARD_MENU',
          false,
          'Could not open card menu by applying "show" class using locators.app.menus.all.card.selector at index ' + cardIndex,
          'cards.js',
          'verifyCard'
        ));
      }

      return locators.app.menus.all.card.items.edit.elements.get(cardIndex);

    })
    .then(function(element) {

      cardMenuEdit = element;

      return delays.waitForElementToBeVisible(cardMenuEdit);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'EDIT_CARD_OPTION_NOT_VISIBLE',
          false,
          'Could not find edit option in card menu using locators.app.menus.all.card.items.edit.elements',
          'cards.js',
          'verifyCard'
        ));
      }

      return cardMenuEdit.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.card.name.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_EDIT_CARD_MODAL',
          false,
          'Could not open edit card modal because name textbox is not visible using locators.app.modals.card.name.element',
          'cards.js',
          'verifyCard'
        ));
      }

      return browser.executeScript(
        snippets.getAngularValue,
        locators.app.modals.card.name.selector
      );

    })
    .then(function(value) {

      return seeIf(value).isSameAs(cardName);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_CARD_NAME',
          false,
          'Card name does not match the expected name ' + cardName,
          'cards.js',
          'verifyCard'
        ));
      }

      return browser.executeScript(
        snippets.getAngularValue,
        locators.app.modals.card.description.selector
      );

    })
    .then(function(value) {

      return seeIf(value).isSameAs(cardDescription);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_CARD_DESCRIPTION',
          false,
          'Card description does not match the expected description ' + cardDescription,
          'cards.js',
          'verifyCard'
        ));
      }

      return browser.executeScript(
        snippets.getAngularValue,
        locators.app.modals.card.tags.selector
      );

    })
    .then(function(value) {

      cardActualTags = value.split('#');

      cardActualTags = _.compact(cardActualTags);

      _.each(cardActualTags, function(tag, index) {

        cardActualTags[index] = tag.trim();

      });

      return seeIf(cardActualTags.length).isSameAs(cardTags.length);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_CARD_TAGS',
          false,
          'Count of tags does not match the expected ' + cardTags.length,
          'cards.js',
          'verifyCard'
        ));
      }

      return seeIf(_.difference(cardActualTags, cardTags).length).isSameAs(0);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_CARD_TAGS',
          false,
          'Card tags do not match the expected tags #' + cardTags.join(' #'),
          'cards.js',
          'verifyCard'
        ));
      }

      return locators.app.modals.card.save.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.card.name.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close card modal because name textbox is still visible using locators.app.modals.card.name.element',
          'cards.js',
          'verifyCard'
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

        if ( error.critical === undefined ) {

          error = life.buildError(
            'CANNOT_FIND_ANY_CARD_NAMES',
            false,
            'Could not find any card names using locators.app.labels.all.cardName.elements',
            'cards.js',
            'verifyCard'
          );

        }

        deferred.reject(error);

      }

    )

    return deferred.promise;

  };

  this.archiveCard = function(cardName) {

    var deferred = q.defer();
    var that = this;
    var cardIndex = -1;
    var cardMenu, cardMenuArchive;

    locators.app.labels.all.cardName.elements.each(function(element, index) {

      element.getText().then(function(text) {

        if ( text === cardName ) {
          cardIndex = index;
        }

      });

    })
    .then(function() {

      return seeIf(cardIndex).isNot(-1);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CARD_NOT_FOUND',
          false,
          'Could not find card with name ' + cardName + ' using locators.app.labels.all.cardName.elements',
          'cards.js',
          'archiveCard'
        ));
      }

      return locators.app.menus.all.card.elements.get(cardIndex);

    })
    .then(function(element) {

      cardMenu = element;

      return cardMenu.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') === -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.all.card.selector,
          'class',
          value + ' show',
          cardIndex
        );

      }

    })
    .then(function() {

      return delays.waitForAttribute(cardMenu, 'class', 'show');

    })
    .then(function(hasAttribute) {

      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_CARD_MENU',
          false,
          'Could not open card menu by applying show class using locators.app.menus.all.card.selector at index ' + cardIndex,
          'cards.js',
          'archiveCard'
        ));
      }

      return locators.app.menus.all.card.items.archive.elements.get(cardIndex);

    })
    .then(function(element) {

      cardMenuArchive = element;

      return delays.waitForElementToBeVisible(cardMenuArchive);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'ARCHIVE_CARD_OPTION_NOT_VISIBLE',
          false,
          'Could not find archive option in card menu using locators.app.menus.all.card.items.archive.elements',
          'cards.js',
          'archiveCard'
        ));
      }

      return cardMenuArchive.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.archiveCard.accept.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_ARCHIVE_CARD_MODAL',
          false,
          'Could not open archive card modal because ACCEPT button is not visible using locators.app.modals.archiveCard.accept.element',
          'cards.js',
          'archiveCard'
        ));
      }

      return locators.app.modals.archiveCard.accept.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.archiveCard.accept.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close archive card modal because ACCEPT button is still visible using locators.app.modals.archiveCard.accept.element',
          'cards.js',
          'archiveCard'
        ));
      }

      return that.verifyArchive(cardName);

    })
    .then(

      // success
      function() {
        deferred.resolve();
      },

      // fail
      function(error) {

        if ( error.critical === undefined ) {

          error = life.buildError(
            'CANNOT_FIND_ANY_CARD_NAMES',
            false,
            'Could not find any card names using locators.app.labels.all.cardName.elements',
            'cards.js',
            'archiveCard'
          );

        }

        deferred.reject(error);

      }
    );

    return deferred.promise;

  };

  this.verifyArchive = function(cardName) {

    var deferred = q.defer();
    var cardIndex = -1;

    locators.app.labels.all.cardName.elements.each(function(element, index) {

      element.getText().then(function(text) {

        if ( text === cardName ) {
          cardIndex = index;
        }

      });

    })
    .then(function() {

      return seeIf(cardIndex).isSameAs(-1);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'ARCHIVED_CARD_STILL_EXISTS',
          false,
          'The expected to be archived card still exists with name ' + cardName + ' using locators.app.labels.all.cardName.elements at index ' + cardIndex,
          'cards.js',
          'verifyArchive'
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

        if ( error.critical === undefined ) {

          error = life.buildError(
            'CANNOT_FIND_ANY_CARD_NAMES',
            false,
            'Could not find any card names using locators.app.labels.all.cardName.elements',
            'cards.js',
            'verifyArchive'
          );

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

  this.archiveTags = function(tagNames) {
    var that = this;
    var deferred = q.defer();
    var tagIndices = [];

    delays.waitForElementToBeVisible(locators.app.views.tags.element)
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_TAGS_VIEW',
          false,
          'Could not find tags view using locators.app.views.tags.element',
          'cards.js',
          'archiveTags'
        ));

      }

      return locators.app.views.tags.element.click();

    })
    .then(function() {

      return locators.app.labels.all.tagTitle.elements.each(function(element) {

        element.getText().then(function(text) {

          var foundIndex = tagNames.indexOf(text.substr(1));

          if ( foundIndex !== -1 ) {

            tagIndices[tagIndices.length] = foundIndex;

          }

        });

      });

    })
    .then(function() {

      return seeIf(tagNames.length).isSameAs(tagIndices.length);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {

        return q.reject(life.buildError(
          'CANNOT_FIND_ALL_TAGS',
          false,
          (tagIndices.length !== 0 ?
          'Could not find all of the expected tags using locators.app.labels.all.tagTitle.elements, only ' + tagIndices.length + ' tags were found' :
          'Could not find any of the expected tags using locators.app.labels.all.tagTitle.elements'),
          'cards.js',
          'archiveTags'
        ));

      }

      tagIndices.forEach(function(indice, index) {

        promiseLooper.addFunction(
          that,
          that.archiveTag,
          [indice, tagNames[index]]
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

        if ( error.type === undefined ) {

          error = life.buildError(
            'CANNOT_FIND_TAGS',
            false,
            'Could not find any tags using locators.app.labels.all.tagTitle.elements',
            'cards.js',
            'archiveTags'
          );

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

};

module.exports = new CardLibrary();
