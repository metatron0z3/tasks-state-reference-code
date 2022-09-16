// Be sure that you've set this variable to the root of `troop-web` repo with / at the end
var root = 'C:/Users/ramtin/trooptraining/troop/troop-web/';

(function () {

  global.root = root;

  global.requireSpec = function(category, filename) {
    return require(root + 'test/protractor/specs/' + category + '/' + filename + '.js')();
  };

  global.requireLib = function(filename) {
    return require(root + 'test/protractor/lib/' + filename + '.js');
  };

  global.requireExt = function(filename) {
    return require(root + 'test/protractor/lib/extensions/' + filename + '.js');
  };

  global.requireConf = function(filename) {
    return require(root + 'test/protractor/config/' + filename + '.conf.js');
  };

  global.requireMod = function(name) {
    return require(root + 'node_modules/' + name);
  };

  global.requireTool = function(name) {
    return require(root + 'test/protractor/tools/' + name + '/' + name + '.js');
  };

  global.config = requireConf('lib');

  global.life = requireExt('life');

  global.bail = requireTool('bail');

  global.reporter = requireTool('reporter');

  global.promiseLooper = requireExt('promise-looper');

  global.q = requireMod('q');

  global._ = requireMod('underscore');

})();

exports.config = {
  framework: 'jasmine2',

  seleniumAddress: 'http://localhost:4444/wd/hub',

  multiCapabilities: [
    {
      'browserName': 'chrome'
    },
    // {
    //   'browserName': 'firefox'
    // },
    // {
    //   'browserName': 'internet explorer'
    // },
    // {
    //   'browserName': 'MicrosoftEdge'
    // }
  ],

  maxSessions: 1, //-1 = Unlimited

  suites: {
    master: root + 'test/protractor/suites/master.js',
    cleanEnv: root + 'test/protractor/suites/cleanEnv.js',
    openTroop: root + 'test/protractor/suites/openTroop.js',
    login: root + 'test/protractor/suites/login.js',
    signUp: root + 'test/protractor/suites/signUp.js',
    logout: root + 'test/protractor/suites/logout.js',
    addBoard: root + 'test/protractor/suites/addBoard.js',
    addCard: root + 'test/protractor/suites/addCard.js',
    renameTroop: root + 'test/protractor/suites/renameTroop.js',
    detachTrooper: root + 'test/protractor/suites/detachTrooper.js',
    signUpValidation: root + 'test/protractor/suites/signUpValidation.js'
  },

  onPrepare: function() {

    reporter.init();
    reporter.reportTest("Ramtin's local testing");
    reporter.startTimer('test');

  },

  onComplete: function() {

    reporter.reportEndOfTest();
    reporter.endTimer('test');
    reporter.reportSummary();
    reporter.finalize();

  }
}
