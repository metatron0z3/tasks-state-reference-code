var Reporter = function() {

  var fs = require('fs');

  // Used to time an operation on startTimer() and endTimer(), instances of timers
  // are recognized by their own label
  var timers = {};
  // Indicates whether to write log data into the file or not
  var logReports = config.reporter.fileLog;
  // Holds the config values written by Reporter itself (JSON)
  var reporterConfig = null;

  function formatTime(time) {
    var seconds, nano, micro, milli;

    seconds = time[0];
    nano = time[1];

    micro = Math.floor(nano / 1000);
    nano %= 1000;
    milli = Math.floor(micro / 1000);
    micro %= 1000;

    return seconds + 's ' + milli + 'ms ' + micro + 'µs ' + nano + 'ns';
  }

  // Generates time stamps to insert into the log data in logFile()
  function generateDateTimeStamp() {
    var date = new Date();
    var year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    second = date.getSeconds();

    month = (month.toString().length == 1 ? '0' : '') + month;
    day = (day.toString().length == 1 ? '0' : '') + day;
    hour = (hour.toString().length == 1 ? '0' : '') + hour;
    minute = (minute.toString().length == 1 ? '0' : '') + minute;
    second = (second.toString().length == 1 ? '0' : '') + second;

    return '[' + month + '/' + day + '/' + year + ' - ' + hour + ':' + minute + ':' + second + ']';
  }

  // Returns true if `fs` has both read/write rights
  function checkConfigAccessRights() {
    try {
      fs.accessSync(config.reporter.configPath, fs.R_OK | fs.W_OK);
      return true;
    }
    catch (e) {
      return false;
    }
  }

  // Returns true if `reporter.conf.json` exists
  function checkConfigExistance() {
    try {
      fs.accessSync(config.reporter.configPath, fs.F_OK);
      return true;
    }
    catch(e) {
      return false;
    }
  }

  // Creates reporter.conf.json and instantiates `reporterConfig` variable with
  // the initial values, should only be called when config file doesn't exist
  function createConfig() {
    fs.closeSync(fs.openSync(config.reporter.configPath, 'w'));

    reporterConfig = {
      lastIndex: 0
    };

    fs.writeFileSync(config.reporter.configPath, JSON.stringify(reporterConfig));
  }

  // Loads the JSON object from config file into `reporterConfig`
  function getConfig() {
    if ( ! checkConfigExistance() ) {
      createConfig();
    }

    if ( ! checkConfigAccessRights() ) {
      return false;
    }

    reporterConfig = JSON.parse(fs.readFileSync(config.reporter.configPath));

    return (reporterConfig !== null);
  }

  // Saves/writes the JSON object from `reporterConfig` to the config file
  function saveConfig() {
    if ( reporterConfig === null ) {
      return false;
    }

    fs.writeFileSync(config.reporter.configPath, JSON.stringify(reporterConfig));

    return true;
  }

  // Logs the data to the file. `raw` holds the unformatted data (simple string),
  // `type` indicates the type of the report (STANDARD | HEADER | HEADER_BOLD | FOOTER)
  function logFile(raw, type) {
    if ( ! logReports ) return;

    var data;

    if ( type === config.reporter.types.standard ) {
      if ( reporterConfig !== null ) {
        reporterConfig.lastIndex += 1;
      }

      data = (reporterConfig === null ? '>> ' : '#' + reporterConfig.lastIndex + ' ')
        + generateDateTimeStamp()
        + ' ' + raw + '\n';
    }
    else {
      var title = ' ' + raw.toUpperCase() + ' ';
      var headerWrapper;

      if ( title.length >= 100 ) {
        headerWrapper = Array(title.length + 1).join(
          (type === config.reporter.types.headerBold ? '#' : (type === config.reporter.types.footer ? '/' : '*'))
        );

        data = '\n' + headerWrapper
          + '\n' + title
          + '\n' + headerWrapper + '\n';
      } else {
        headerWrapper = Array(101).join(
          (type === config.reporter.types.headerBold ? '#' : (type === config.reporter.types.footer ? '/' : '*'))
        );

        var titleWrapper = headerWrapper.slice(0, (headerWrapper.length / 2) - (title.length / 2));

        data = titleWrapper + title + titleWrapper;

        data = '\n' + (type === config.reporter.types.headerBold ? headerWrapper + '\n' : '')
          + data
          + (title.length % 2 == 1 ? (type === config.reporter.types.headerBold ? '#' : (type === config.reporter.types.footer ? '/' : '*')) : '')
          + '\n' + (type === config.reporter.types.headerBold ? headerWrapper + '\n' : '');
      }
    }

    fs.appendFileSync(config.reporter.logPath, data);
  }

  // Console logs the summary of the test
  function consoleLogSummary(specs) {

    specs.forEach(function(spec) {

      console.log(
        '\n\n',
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.spec,
        spec,
        config.reporter.colors.reset,
        '\n'
      );

      var specEvents = life.getEvents.bySpec(spec);

      specEvents.forEach(function(event) {

        console.log(
          config.reporter.prefixes.indent,
          ( event.type === 'success' ? config.reporter.colors.foreground.green : ( event.type === 'error' ? config.reporter.colors.foreground.red : config.reporter.colors.foreground.yellow ) ),
          ( event.type === 'success' ? config.reporter.prefixes.success : ( event.type === 'error' ? config.reporter.prefixes.error : config.reporter.prefixes.warning ) ),
          event.message,
          config.reporter.colors.reset
        );

      });

    });

    console.log('\n\n');

  }

  // Initializes the Reporter config values (read from file)
  this.init = function() {
    if ( ! getConfig() ) {
      logFile("Cannot read/instantiate config file!");
      console.log(config.reporter.prefixes.error, "Cannot read/instantiate config file!");
    }
  }

  // Starts a timer with a unique label indicating the name of timer
  this.startTimer = function(label) {
    if (label && timers[label] === undefined) {

      timers[label] = process.hrtime();

      console.log(
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.info,
        'Started timing with label `' + label + '`',
        config.reporter.colors.reset
      );

      logFile('Started timing with label `' + label + '`', config.reporter.types.standard);

    } else {

      console.error(
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.error,
        'Invalid label, cannot start timer!',
        config.reporter.colors.reset
      );

    }
  };

  // Ends an existing timer recognized by its label and logs the result
  this.endTimer = function(label) {
    if (label && timers[label] !== undefined) {

      timers[label] = process.hrtime(timers[label]);

      console.log(
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.info,
        'Timing with label `' + label + '` took ' + formatTime(timers[label]),
        config.reporter.colors.reset
      );

      logFile('Timing with label `' + label + '` took ' + formatTime(timers[label]), config.reporter.types.standard);

      delete timers[label];

    } else {

      console.error(
        config.reporter.colors.foreground.red,
        config.reporter.prefixes.error,
        'Invalid label, cannot end timer!',
        config.reporter.colors.reset
      );

    }
  };

  // Reports a step taken in the tests (File Log Type: Standard)
  // Possible console types: success, error, warning, info (default: info)
  this.reportStep = function(desc, type) {
    if (desc) {

      console.log(
        ( type === 'warning' ? config.reporter.colors.foreground.yellow : ( type === 'success' ? config.reporter.colors.foreground.green : ( type === 'error' ? config.reporter.colors.foreground.red : config.reporter.colors.foreground.white ) ) ),
        ( type === 'warning' ? config.reporter.prefixes.warning : ( type === 'success' ? config.reporter.prefixes.success : ( type === 'error' ? config.reporter.prefixes.error : config.reporter.prefixes.info ) ) ),
        desc,
        config.reporter.colors.reset
      );

      logFile(desc, config.reporter.types.standard);

    }
  };

  // Reports the start of a spec (Type: Header)
  this.reportSpec = function(spec) {
    if (spec) {

      console.log(
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.info,
        'Spec ' + spec + ' started...',
        config.reporter.colors.reset
      );

      logFile(spec, config.reporter.types.header);

    }
  };

  // Reports the start of a test (Type: Header Bold)
  this.reportTest = function(test) {
    if (test) {

      console.log(
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.info,
        'Test ' + test + ' started...',
        config.reporter.colors.reset
      );

      logFile(test, config.reporter.types.headerBold);

    }
  };

  // Reports the end of a test (Type: Footer)
  this.reportEndOfTest = function() {

    console.log(
      config.reporter.colors.foreground.white,
      config.reporter.prefixes.info,
      'Test ended.',
      config.reporter.colors.reset
    );

    logFile('end of test', config.reporter.types.footer);

  }

  // Turns file logging on or off
  this.switchFileLog = function(option) {
    if ( typeof option === "boolean" ) {

      logFile('Turned logging reports ' + (option ? 'on' : 'off'));

      logReports = option;

      console.log(
        config.reporter.colors.foreground.white,
        config.reporter.prefixes.info,
        'Turned logging reports ' + (option ? 'on' : 'off'),
        config.reporter.colors.reset
      );

    } else {

      console.error(
        config.reporter.colors.foreground.red,
        config.reporter.prefixes.error,
        'Invalid switch argument, cannot switch log!',
        config.reporter.colors.reset
      );

    }
  };

  // Reports all error objects with failures library format or a single string if no errors
  this.reportSummary = function() {

    var specs = life.getSpecs();

    if ( specs.length === 0 ) {

      console.log(
        '\n\n\n',
        config.reporter.colors.background.blue,
        config.reporter.colors.foreground.white,
        'Something is fishy :S',
        config.reporter.colors.reset
      );

      logFile('Something is fishy :S', config.reporter.types.standard);

    }
    else if ( ! life.criticalErrorExists && ! life.errorExists ) {

      console.log(
        '\n\n\n',
        config.reporter.colors.background.green,
        config.reporter.colors.foreground.black,
        'All tests were successful :)',
        config.reporter.colors.reset
      );

      logFile('All tests were successful :)', config.reporter.types.standard);

    }
    else if ( life.criticalErrorExists ) {

      console.log(
        '\n\n\n',
        config.reporter.colors.foreground.white,
        config.reporter.colors.background.red,
        'Some critical errors have occurred :(',
        config.reporter.colors.reset
      );

      logFile('Some critical errors have occurred :(', config.reporter.types.standard);

    }
    else {

      console.log(
        '\n\n\n',
        config.reporter.colors.foreground.black,
        config.reporter.colors.background.yellow,
        'Some non-critical errors have occurred :\\',
        config.reporter.colors.reset
      );

      logFile('Some non-critical errors have occurred :\\', config.reporter.types.standard);

    }

    consoleLogSummary(specs);

  };

  // Finalizes the Reporter config values (write to file)
  this.finalize = function() {
    if ( ! saveConfig() ) {
      logFile("Cannot save config file!");
      console.log(config.reporter.prefixes.error + "Cannot save config file!");
    }
  }

};

module.exports = new Reporter();
