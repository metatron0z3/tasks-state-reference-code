// Karma configuration
// http://karma-runner.github.io/0.12/config/configuration-file.html
// Generated on 2015-07-02 using
// generator-karma 1.0.0

module.exports = function(config) {
  'use strict';

  config.set({
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // base path, that will be used to resolve files and exclude
    basePath: '../',

    // testing framework to use (jasmine/mocha/qunit/...)
    // as well as any additional frameworks (requirejs/chai/sinon/...)
    frameworks: [
      "jasmine"
    ],

    // list of files / patterns to load in the browser
    files: [
      // bower:js
      'bower_components/jquery/dist/jquery.js',
      'bower_components/FileSaver/FileSaver.js',
      'bower_components/Sortable/Sortable.js',
      'bower_components/Sortable/ng-sortable.js',
      'bower_components/Sortable/knockout-sortable.js',
      'bower_components/Sortable/react-sortable-mixin.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-animate/angular-animate.js',
      'bower_components/angular-elastic/elastic.js',
      'bower_components/angular-embedly/angular-embedly.js',
      'bower_components/marked/lib/marked.js',
      'bower_components/angular-marked/dist/angular-marked.js',
      'bower_components/angular-messages/angular-messages.js',
      'bower_components/angular-modal-service/dst/angular-modal-service.js',
      'bower_components/angular-resource/angular-resource.js',
      'bower_components/angular-sanitize/angular-sanitize.js',
      'bower_components/angular-scroll-glue/src/scrollglue.js',
      'bower_components/angular-slugify/angular-slugify.js',
      'bower_components/angular-touch/angular-touch.js',
      'bower_components/angular-ua-parser/angular-ua-parser.js',
      'bower_components/angular-ui-router/release/angular-ui-router.js',
      'bower_components/x2js/xml2json.min.js',
      'bower_components/angular-xml/angular-xml.js',
      'bower_components/firebase/firebase.js',
      'bower_components/angularfire/dist/angularfire.js',
      'bower_components/blob-util/dist/blob-util.js',
      'bower_components/fingerprintjs2/dist/fingerprint2.min.js',
      'bower_components/firebase-util/dist/firebase-util.min.js',
      'bower_components/jquery-minicolors/jquery.minicolors.js',
      'bower_components/jszip/dist/jszip.js',
      'bower_components/moment/moment.js',
      'bower_components/ng-file-upload/ng-file-upload.js',
      'bower_components/ngstorage/ngStorage.js',
      'bower_components/player.js/dist/player-0.0.11.js',
      'bower_components/ua-parser-js/src/ua-parser.js',
      'bower_components/underscore/underscore.js',
      'bower_components/urijs/src/URI.js',
      'bower_components/algoliasearch/dist/algoliasearch.js',
      'bower_components/async/lib/async.js',
      'bower_components/angular-cookies/angular-cookies.js',
      'bower_components/angular-notification/angular-notification.js',
      'bower_components/angular-libphonenumber/dist/angular-libphonenumber.min.js',
      'bower_components/ui-select/dist/select.js',
      'bower_components/sugar/release/sugar.min.js',
      'bower_components/angular-ui-switch/angular-ui-switch.js',
      'bower_components/clipboard/dist/clipboard.js',
      'bower_components/mockfirebase/browser/mockfirebase.js',
      'bower_components/angular-mocks/angular-mocks.js',
      // endbower
      "app/scripts/**/*.js",
      "test/mock/**/*.js",
      "test/spec/**/*.js"
    ],

    // list of files / patterns to exclude
    exclude: [
    ],

    // web server port
    port: 8080,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    browsers: [
      "PhantomJS"
    ],

    // Which plugins to enable
    plugins: [
      "karma-phantomjs-launcher",
      "karma-jasmine"
    ],

    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    singleRun: false,

    colors: true,

    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Uncomment the following lines if you are using grunt's server to run the tests
    // proxies: {
    //   '/': 'http://localhost:9000/'
    // },
    // URL root prevent conflicts with the site root
    // urlRoot: '_karma_'
  });
};
