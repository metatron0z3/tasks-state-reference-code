var BoardLibrary = function() {
  var randoms = requireExt('util').random;
  var delays = requireExt('util').delay;
  var snippets = requireExt('util').snippet;
  var seeIf = requireExt('expectations');
  var locators = requireExt('locators');

  function createBoard(
    boardName,
    boardDescription,
    boardLayout,
    boardPrivate,
    boardReadOnly
  ) {

    var deferred = q.defer();

    delays.waitForElementToBeVisible(locators.app.buttons.addBoard.element)
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'ADD_BUTTON_NOT_VISIBLE',
          false,
          'Could not find add board button using CSS selector in locators.app.buttons.addBoard.element',
          'boards.js',
          'createBoard'
        ));
      }

      return locators.app.buttons.addBoard.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.board.name.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'BOARD_MODAL_NOT_VISIBLE',
          false,
          'Board modal did not open after clicking on add board button',
          'boards.js',
          'createBoard'
        ));
      }

      return locators.app.modals.board.name.element.sendKeys(boardName);

    })
    .then(function() {

      return locators.app.modals.board.description.element.sendKeys(boardDescription);

    })
    .then(function() {

      return locators.app.modals.board.layouts.element.click();

    })
    .then(function() {

      return delays.waitForAttribute(locators.app.modals.board.layouts.element, 'class', 'open');

    })
    .then(function(hasAttribute) {

      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'LAYOUTS_DONT_EXIST',
          false,
          'Could not open layouts listbox inside board modal by applying "open" class to locators.app.modals.board.layouts.element',
          'boards.js',
          'createBoard'
        ));
      }

      return locators.app.modals.board.layouts.choices.elements;

    })
    .then(function(choices) {

      return seeIf(choices.length).isNot(0);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'LAYOUT_CHOICES_NOT_PRESENT',
          false,
          'Could not find layout choices inside board modal using locators.app.modals.board.layouts.choices.elements',
          'boards.js',
          'createBoard'
        ));
      }

      return locators.app.modals.board.layouts.choices.elements.get(boardLayout);

    })
    .then(function(choice) {

      return choice.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.board.readOnly.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'READONLY_CHECKBOX_NOT_VISIBLE',
          false,
          'Could not find read only checkbox inside board modal using locators.app.modals.board.readOnly.element',
          'boards.js',
          'createBoard'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.modals.board.private.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'PRIVATE_CHECKBOX_NOT_VISIBLE',
          false,
          'Could not find private checkbox inside board modal using locators.app.modals.board.private.element',
          'boards.js',
          'createBoard'
        ));
      }

      if ( boardReadOnly && ! boardPrivate ) {

        return locators.app.modals.board.readOnly.element.click();

      }
      else if ( ! boardReadOnly && boardPrivate ) {

        return locators.app.modals.board.private.element.click();

      }
      else if ( boardReadOnly && boardPrivate ) {

        return locators.app.modals.board.readOnly.element.click().then(function() {
          return locators.app.modals.board.private.element.click();
        });

      }

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.board.save.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'SAVE_BUTTON_NOT_VISIBLE',
          false,
          'Could not find save button inside board modal using locators.app.modals.board.save.element',
          'boards.js',
          'createBoard'
        ));
      }

      return locators.app.modals.board.save.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.board.name.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close board modal after clicking on SAVE button',
          'boards.js',
          'createBoard'
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

  this.addBoard = function(
    boardName,
    boardDescription,
    boardLayout,
    boardPrivate,
    boardReadOnly,
    boardMix
  ) {

    var that = this;
    var deferred = q.defer();

    if ( ! boardMix ) {

      createBoard(
        boardName,
        boardDescription,
        boardLayout,
        boardPrivate,
        boardReadOnly
      )
      .then(function() {

        return that.openBoard(boardName);

      })
      .then(function() {

        return that.verifyBoard(
          boardName,
          boardDescription,
          boardLayout,
          boardPrivate,
          boardReadOnly
        );

      })
      .then(function() {

        if ( config.board.archive ) {

          return that.archiveBoard(boardName);

        }

      })
      .then(function() {

        deferred.resolve();

      })
      .catch(function(error) {

        deferred.reject(error);

      });

    }
    else {

      var boardNames = [];

      for ( var i = 0; i < 20; i++ ) {

        boardNames[i] = randoms.string(10);

      }

      createBoard(
        boardNames[0],
        'A read-only board called ' + boardNames[0] + ' using Thumbnail layout.',
        config.board.layoutTypes.thumbnail,
        false,
        true
      )
      .then(function() {

        return that.openBoard(boardNames[0]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[0],
          'A read-only board called ' + boardNames[0] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          false,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[0]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[1],
          'A read-only and private board called ' + boardNames[1] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          true,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[1]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[1],
          'A read-only and private board called ' + boardNames[1] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          true,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[1]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[2],
          'A board called ' + boardNames[2] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          false,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[2]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[2],
          'A board called ' + boardNames[2] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          false,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[2]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[3],
          'A private board called ' + boardNames[3] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          true,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[3]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[3],
          'A private board called ' + boardNames[3] + ' using Thumbnail layout.',
          config.board.layoutTypes.thumbnail,
          true,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[3]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[4],
          'A read-only board called ' + boardNames[4] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          false,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[4]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[4],
          'A read-only board called ' + boardNames[4] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          false,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[4]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[5],
          'A read-only and private board called ' + boardNames[5] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          true,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[5]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[5],
          'A read-only and private board called ' + boardNames[5] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          true,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[5]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[6],
          'A board called ' + boardNames[6] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          false,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[6]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[6],
          'A board called ' + boardNames[6] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          false,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[6]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[7],
          'A private board called ' + boardNames[7] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          true,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[7]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[7],
          'A private board called ' + boardNames[7] + ' using Medium layout.',
          config.board.layoutTypes.medium,
          true,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[7]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[16],
          'A read-only board called ' + boardNames[16] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          false,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[16]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[16],
          'A read-only board called ' + boardNames[16] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          false,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[16]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[17],
          'A private and read-only board called ' + boardNames[17] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          true,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[17]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[17],
          'A private and read-only board called ' + boardNames[17] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          true,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[17]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[18],
          'A board called ' + boardNames[18] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          false,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[18]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[18],
          'A board called ' + boardNames[18] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          false,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[18]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[19],
          'A private board called ' + boardNames[19] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          true,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[19]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[19],
          'A private board called ' + boardNames[19] + ' using panoramic layout.',
          config.board.layoutTypes.panoramic,
          true,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[19]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[8],
          'A read-only board called ' + boardNames[8] + ' using Large layout.',
          config.board.layoutTypes.large,
          false,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[8]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[8],
          'A read-only board called ' + boardNames[8] + ' using Large layout.',
          config.board.layoutTypes.large,
          false,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[8]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[9],
          'A read-only and private board called ' + boardNames[9] + ' using Large layout.',
          config.board.layoutTypes.large,
          true,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[9]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[9],
          'A read-only and private board called ' + boardNames[9] + ' using Large layout.',
          config.board.layoutTypes.large,
          true,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[9]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[10],
          'A board called ' + boardNames[10] + ' using Large layout.',
          config.board.layoutTypes.large,
          false,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[10]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[10],
          'A board called ' + boardNames[10] + ' using Large layout.',
          config.board.layoutTypes.large,
          false,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[10]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[11],
          'A private board called ' + boardNames[11] + ' using Large layout.',
          config.board.layoutTypes.large,
          true,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[11]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[11],
          'A private board called ' + boardNames[11] + ' using Large layout.',
          config.board.layoutTypes.large,
          true,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[11]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[12],
          'A read-only board called ' + boardNames[12] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          false,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[12]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[12],
          'A read-only board called ' + boardNames[12] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          false,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[12]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[13],
          'A read-only and private board called ' + boardNames[13] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          true,
          true
        );

      })
      .then(function() {

        return that.openBoard(boardNames[13]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[13],
          'A read-only and private board called ' + boardNames[13] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          true,
          true
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[13]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[14],
          'A board called ' + boardNames[14] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          false,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[14]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[14],
          'A board called ' + boardNames[14] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          false,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[14]);
        }

      })
      .then(function() {

        return createBoard(
          boardNames[15],
          'A private board called ' + boardNames[15] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          true,
          false
        );

      })
      .then(function() {

        return that.openBoard(boardNames[15]);

      })
      .then(function() {

        return that.verifyBoard(
          boardNames[15],
          'A private board called ' + boardNames[15] + ' using Macro layout.',
          config.board.layoutTypes.macro,
          true,
          false
        );

      })
      .then(function() {

        if ( config.board.archiveCombinations ) {
          return that.archiveBoard(boardNames[15]);
        }

      })
      .then(function() {

        deferred.resolve();

      })
      .catch(function(error) {

        deferred.reject(error);

      });

    }

    return deferred.promise;

  };

  this.openBoard = function(boardName) {

    var deferred = q.defer();
    var boardItem;
    var boardIndex = -1;

    locators.app.labels.all.boardName.elements.each(function(element, index) {

      element.getText().then(function(text) {

        if ( text.indexOf(boardName) !== -1 ) {

          boardIndex = index;
          boardItem = element;

        }

      });

    })
    .then(function() {

      return seeIf(boardIndex).isNot(-1);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'BOARD_DOES_NOT_EXIST',
          false,
          'Could not find board with name ' + boardName + ' to open',
          'boards.js',
          'openBoard'
        ));
      }

      return boardItem.click();

    })
    .then(function() {

      return locators.app.labels.boardName.element.getText();

    })
    .then(function(text) {

      return seeIf(text).isSameAs(boardName);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_BOARD_TITLE',
          false,
          'The board title does not match the board name ' + boardName,
          'boards.js',
          'createBoard'
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
            'CANNOT_FIND_BOARD_NAMES',
            false,
            'Could not find any board names using locators.app.labels.all.boardName.elements',
            'boards.js',
            'openBoard'
          );

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

  this.verifyBoard = function(
    boardName,
    boardDescription,
    boardLayout,
    boardPrivate,
    boardReadOnly
  ) {

    var deferred = q.defer();

    delays.waitForElementToExist(locators.app.menus.board.element)
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'BOARD_ACTIONS_MENU_DOES_NOT_EXIST',
          false,
          'Could not find board action menu using locators.app.menus.board.element',
          'boards.js',
          'verifyBoard'
        ));
      }

      return locators.app.menus.board.element.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') == -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.board.selector,
          'class',
          value + ' show'
        );

      }

    })
    .then(function() {

      return delays.waitForAttribute(locators.app.menus.board.element, 'class', 'show');

    })
    .then(function(hasAttribute) {

      return seeIf(hasAttribute).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_BOARD_ACTIONS_MENU',
          false,
          'Could not open board action menu by applying "show" class to locators.app.menus.board.element',
          'boards.js',
          'verifyBoard'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.menus.board.items.edit.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'EDIT_BOARD_OPTION_NOT_VISIBLE',
          false,
          'Could not find edit option in board action menu using locators.app.menus.board.items.edit.element',
          'boards.js',
          'verifyBoard'
        ));
      }

      return locators.app.menus.board.items.edit.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.board.name.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_BOARD_EDIT_MODAL',
          false,
          'Could not open board modal by clicking on edit option in board action menu because board name textbox is not found using locators.app.modals.board.name.element',
          'boards.js',
          'verifyBoard'
        ));
      }

      return browser.executeScript(
        snippets.getAngularValue,
        locators.app.modals.board.name.selector
      );

    })
    .then(function(value) {

      return seeIf(value).isSameAs(boardName);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_BOARD_NAME',
          false,
          'Board name inside board name textbox in board modal does not match the expected board name ' + boardName,
          'boards.js',
          'verifyBoard'
        ));
      }

      return browser.executeScript(
        snippets.getAngularValue,
        locators.app.modals.board.description.selector
      );

    })
    .then(function(value) {

      return seeIf(value).isSameAs(boardDescription);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_BOARD_DESCRIPTION',
          false,
          'Board description inside board description textbox in board modal does not match the expected board description ' + boardDescription,
          'boards.js',
          'verifyBoard'
        ));
      }

      return locators.app.modals.board.layouts.selected.element.getText();

    })
    .then(function(layout) {

      return seeIf(layout).isSameAs(config.board.layoutNames[boardLayout]);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_BOARD_LAYOUT',
          false,
          'The selected board layout in board modal does not match the expected board layout ' + config.board.layoutNames[boardLayout],
          'boards.js',
          'verifyBoard'
        ));
      }

      return locators.app.modals.board.private.value.element.getAttribute('class');

    })
    .then(function(value) {

      return seeIf(value).contains( ( boardPrivate ? 'ng-not-empty' : 'ng-empty' ) );

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_BOARD_PRIVACY_SETTING',
          false,
          'Board privacy setting in board modal does not match the expected setting ' + boardPrivate,
          'boards.js',
          'verifyBoard'
        ));
      }

      return locators.app.modals.board.readOnly.value.element.getAttribute('class');

    })
    .then(function(value) {

      return seeIf(value).contains( ( boardReadOnly ? 'ng-not-empty' : 'ng-empty' ) );

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'INCORRECT_BOARD_ACCESSIBILITY_SETTING',
          false,
          'Board read only setting does not match the expected setting ' + boardReadOnly,
          'boards.js',
          'verifyBoard'
        ));
      }

      return locators.app.modals.board.save.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.board.name.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close board modal by clicking on SAVE button because board name textbox is still displayed using locators.app.modals.board.name.element',
          'boards.js',
          'verifyBoard'
        ));
      }

    })
    .then(

      // success
      function() {
        deferred.resolve();
      },

      function(error) {
        deferred.reject(error);
      }

    );

    return deferred.promise;

  };

  this.archiveBoard = function(boardName) {
    var deferred = q.defer();
    var that = this;

    that.openBoard(boardName)
    .then(function() {

      return delays.waitForElementToExist(locators.app.menus.board.element);

    })
    .then(function(isPresent) {

      return seeIf(isPresent).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'BOARD_ACTIONS_MENU_DOES_NOT_EXIST',
          false,
          'Could not find board action menu using locators.app.menus.board.element',
          'boards.js',
          'archiveBoard'
        ));
      }

      return locators.app.menus.board.element.getAttribute('class');

    })
    .then(function(value) {

      if ( value.indexOf('show') == -1 ) {

        return browser.executeScript(
          snippets.setAttribute,
          locators.app.menus.board.selector,
          'class',
          value + ' show'
        );

      }

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.menus.board.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_BOARD_ACTIONS_MENU',
          false,
          'Could not open board action menu by applying "show" class to locators.app.menus.board.element',
          'boards.js',
          'archiveBoard'
        ));
      }

      return delays.waitForElementToBeVisible(locators.app.menus.board.items.archive.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'ARCHIVE_BOARD_OPTION_NOT_VISIBLE',
          false,
          'Could not find archive option in board action menu using locators.app.menus.board.items.archive.element',
          'boards.js',
          'archiveBoard'
        ));
      }

      return locators.app.menus.board.items.archive.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeVisible(locators.app.modals.archiveBoard.accept.element);

    })
    .then(function(isVisible) {

      return seeIf(isVisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'CANNOT_OPEN_ARCHIVE_BOARD_MODAL',
          false,
          'Could not open archive board modal by clicking archive option in board action menu because ACCEPT button is not found using locators.app.modals.archiveBoard.accept.element',
          'boards.js',
          'archiveBoard'
        ));
      }

      return locators.app.modals.archiveBoard.accept.element.click();

    })
    .then(function() {

      return delays.waitForElementToBeInvisible(locators.app.modals.archiveBoard.accept.element);

    })
    .then(function(isInvisible) {

      return seeIf(isInvisible).isTrue();

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'MODAL_WONT_CLOSE',
          false,
          'Could not close archive modal by clicking on ACCEPT button using locators.app.modals.archiveBoard.accept.element',
          'boards.js',
          'archiveBoard'
        ));
      }

      return that.verifyArchive(boardName);

    })
    .then(

      // success
      function() {
        deferred.resolve();
      },

      // fail
      function(error){
        deferred.reject(error);
      }

    );

    return deferred.promise;

  };

  this.verifyArchive = function(boardName) {
    var deferred = q.defer();
    var found = -1;

    locators.app.labels.all.boardName.elements.each(function(element, index) {

      element.getText().then(function(text) {

        if ( text === boardName ) {
          found = index;
        }

      });

    })
    .then(function() {

      return seeIf(found).isSameAs(-1);

    })
    .then(function(expectation) {

      if ( ! expectation.met ) {
        return q.reject(life.buildError(
          'ARCHIVED_BOARD_STILL_EXISTS',
          false,
          'Board ' + boardName + ' was expected to be archived but still exists because it was found in boards list using locators.app.labels.all.boardName.elements',
          'boards.js',
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
            'CANNOT_FIND_BOARD_NAMES',
            false,
            'Could not find any board names using locators.app.labels.all.boardName.elements',
            'boards.js',
            'verifyArchive'
          );

        }

        deferred.reject(error);

      }

    );

    return deferred.promise;

  };

};

module.exports = new BoardLibrary();
