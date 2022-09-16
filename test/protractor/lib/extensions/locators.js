module.exports = {

  home: {

    buttons: {

      login: {
        element: element(by.css('li.login > a'))
      },

      signUp: {
        element: element(by.css('[ui-sref=" auth.sign-up "]'))
      }

    }

  },

  auth: {

    buttons: {

      login: {
        element: element(by.css('footer.login > button'))
      },

      signUp: {
        element: element(by.css('footer.sign-up > button'))
      }
    }

  },

  app: {

    menus: {

      all: {

        card: {

          elements: element.all(by.css('[ng-class=" cardMenus[card.$id] === true ? \'show\' : \'\' "]')),
          selector: '[ng-class=" cardMenus[card.$id] === true ? \'show\' : \'\' "]',

          items: {

            edit: {

              elements: element.all(by.css('span.card-menu > ul.menu > li.edit'))

            },

            archive: {

              elements: element.all(by.css('span.card-menu > ul.menu > li.delete'))

            }

          }

        },

        tag: {

          elements: element.all(by.css('[ng-class=" cardListMenus[list.name] === true ? \'show\' : \'\' "]')),
          selector: '[ng-class=" cardListMenus[list.name] === true ? \'show\' : \'\' "]',

          items: {

            archive: {

              elements: element.all(by.css('span.card-list-menu > ul.menu > li.delete'))

            }

          }

        }

      },

      board: {

        element: element(by.css('[ng-class=" showActionMenu ? \'show\' : \'\' "]')),
        selector: '[ng-class=" showActionMenu ? \'show\' : \'\' "]',

        items: {

          edit: {

            element: element(by.css('[ng-click="showBoardModal()"]'))

          },

          archive: {

            element: element(by.css('[ng-click=" showDeleteBoardModal() "]'))

          }

        }

      },

      troop: {

        element: element(by.css('aside.left > header > span.troop-actions > ul.menu')),
        selector: 'aside.left > header > span.troop-actions > ul.menu',

        items: {

          settings: {

            element: element(by.css('aside.left > header.troop-select > span.troop-actions > ul.menu > [ng-click*="showTroopModal()"]'))

          }

        }

      },

      trooper: {

        element: element(by.css('aside.left > footer > section.trooper > span.trooper-actions > ul.menu')),
        selector:'aside.left > footer > section.trooper > span.trooper-actions > ul.menu',

        items: {

          logout: {

            element: element(by.css('[ng-click="logout()"]'))

          }

        }

      }

    },

    modals: {

      login: {

        phone: {

          element: element(by.css('input[name="loginId"]'))

        },

        password: {

          element: element(by.css('input[type="password"]'))

        },

        signIn: {

          element: element(by.css('.login-modal > footer > button.blue-primary'))

        }

      },

      signUp: {

        // firstName: {
        //
        //   element: element(by.css('.sign-up-modal > main > .generate-code > .field-group > [name="firstName"]'))
        //
        // },
        //
        // lastName: {
        //
        //   element: element(by.css('.sign-up-modal > main > .generate-code > .field-group > [name="lastName"]'))
        //
        // },

        name: {
          element: element(by.css('[placeholder="Name"]'))
        },

        email: {
          element: element(by.css('[placeholder="Email"]'))
        },

        password: {

          element: element(by.css('[placeholder="Password"]'))

        },

        // troopName: {
        //
        //   element: element(by.css('.sign-up-modal > main > .create-account > .field-group > [name="troopName"]'))
        //
        // },
        //
        // next: {
        //
        //   element: element(by.css('.sign-up-modal > footer > button.blue-primary'))
        //
        // },

        errors: {

          phone: {

            element: element(by.css('[ng-message="phoneNumber"]'))

          }

        }

      },

      troopSettings: {

        name: {

          element: element(by.model('troop.troopName'))

        },

        save: {

          element: element(by.css('.troop-settings-modal > footer > button.blue-primary'))

        }

      },

      card: {

        name: {

          element: element(by.css('input[name="cardName"]')),
          selector: 'input[name="cardName"]'

        },

        description: {

          element: element(by.css('textarea[name="description"]')),
          selector: 'textarea[name="description"]'

        },

        tags: {

          element: element(by.css('input[name="tags"]')),
          selector: 'input[name="tags"]'

        },

        save: {

          element: element(by.css('form[name="cardModalForm"] > footer > button.blue-primary'))

        }

      },

      board: {

        name: {

          element: element(by.model('board.boardName')),
          selector: 'input[name="boardName"]'

        },

        description: {

          element: element(by.model('board.description')),
          selector: 'textarea[name="description"]'

        },

        layouts: {

          element: element(by.model('layoutChoice.value')),

          selected: {

            element: element(by.binding('$select.selected.label'))

          },

          choices: {

            elements: element.all(by.css('.ui-select-choices-group > .ui-select-choices-row'))

          }

        },

        readOnly: {

          element: element(by.css('[data-tp-checkbox="board.readOnly"]')),

          value: {

            element: element(by.css('[data-tp-checkbox="board.readOnly"] > input'))

          }

        },

        private: {

          element: element(by.css('[data-tp-checkbox="board.private"]')),

          value: {

            element: element(by.css('[data-tp-checkbox="board.private"] > input'))

          }

        },

        save: {

          element: element(by.css('.board-modal > footer > button.blue-primary'))

        }

      },

      archiveCard: {

        accept: {

          element: element(by.css('div.archive-card-modal > footer > button.accept.blue-primary'))

        }

      },

      archiveBoard: {

        accept: {

          element: element(by.css('.archive-board-modal > footer > button.accept.blue-primary'))

        }

      },

      confirm: {

        accept: {

          element: element(by.css('.confirm-modal > footer > button.accept.blue-primary'))

        }

      },

      close: {

        element: element(by.css('[ng-click="close()"]'))

      }

    },

    labels: {

      all: {

        cardName: {

          elements: element.all(by.binding('card.cardName'))

        },

        boardName: {

          elements: element.all(by.css('[ng-click="switchBoard(board)"] > span.text'))

        },

        tagTitle: {

          elements: element.all(by.css('[ng-bind=" list.title "].title'))

        }

      },

      troopName: {

        element: element(by.css('aside.left > header > h1.label'))

      },

      trooperName: {

        element: element(by.css('aside.left > footer > section.trooper > span.info > span.label'))

      },

      trooperPermission: {

        element: element(by.css('aside.left > footer > section.trooper > span.info > span.permission'))

      },

      boardName: {

        element: element(by.css('header > div > section > span.name'))

      }

    },

    buttons: {

      addCard: {

        element: element(by.css('header[data-ui-view="dashboardHeader"] > div > section > button.blue-primary.circle'))

      },

      addBoard: {

        element: element(by.css('aside.left > main > section.boards > header > span.image-container'))

      }

    },

    views: {

      tags: {

        element: element(by.css('[data-ui-sref="home.dashboard.board.list({boardId: Me.currentBoard.$id})"]'))

      }

    }

  }

};
