# Repositories
  * [Protractor Documentation](http://angular.github.io/protractor/#/)
  * [Protractor Repository](https://github.com/angular/protractor)

# Installing
  * Install the latest `Java SE Runtime Environment`
  * Do `sudo npm install` to install `mysql` and `q` modules
  * Install selenium's `webdriver-manager` by doing a `sudo npm install webdriver-manager` and then `webdriver-manager update`
  * Do `sudo npm install protractor` to install the latest protractor

# Setting up unit tests
  * Make a copy of `protractor.conf.dist.js` in `test\protractor\config\` with name `protractor.conf.js`
  * Make a copy of `lib.conf.js` in the same directory with name `lib.conf.js`
  * Open up each config file and change the values following the comments as you see fit

# Running tests
  * Protractor needs Selenium's webdriver to be up and running. To do that, open a separate console and type `webdriver-manager start`
  * To run Protractor unit tests, `cd` to the root directory of `troop-web` repository, then type `protractor test\protractor\config\protractor.conf.js --suite master`
  * You can create an alias to run tests without typing that long command. The alias would be something like `alias test="protractor test\protractor\config\protractor.conf.js --suite $@"` and then using it like `test master` where `master` is name of the suite.

# Suites
  * The one suite that goes through the whole test is `master`, where all the other ones do an individual task and need to be used in a respected order.
  * The suites' name are self-explanatory, a sample test using individual specs looks like `openTroop,login,addBoard,addCard,logout` or `openTroop,signUp,logout,login,renameTroop,logout` (no spaces in between suite names). Note that if troop is not opened, Protractor can't login, and if it's not logged in, it can't create boards or cards.
