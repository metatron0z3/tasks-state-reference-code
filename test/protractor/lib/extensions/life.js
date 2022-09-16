var LifeExtension = function() {

  // success: {
  //   message: 'Unknown',
  //   spec: 'Unknown',
  //   type: 'success'
  // }
  //
  // warning: {
  //   message: 'Unknown',
  //   spec: 'Unknown',
  //   type: 'warning'
  // }
  //
  // error: {
  //   code: 'Unknown',
  //   message: 'Unknown',
  //   critical: false,
  //   spec: 'Unknown',
  //   lib: 'Unknown',
  //   func: 'Unknown',
  //   type: 'error',
  //   prerequisite: false
  // }

  // Will hold successes, warnings, and errors
  var events = [];

  this.errorExists = false;
  this.criticalErrorExists = false;

  this.addEvent = function(event) {

    events[events.length] = event;

    if ( event.type === 'error' ) {

      this.errorExists = true;

      if ( event.critical ) {

        this.criticalErrorExists = true;

      }

    }

  };

  this.buildSuccess = function(message, spec) {

    return {

      message: message || 'Unknown',

      spec: spec || 'Unknown',

      type: 'success'

    };

  };

  this.buildWarning = function(message, spec) {

    return {

      message: message || 'Unknown',

      spec: spec || 'Unknown',

      type: 'warning'

    };

  };

  this.buildError = function(code, critical, message, lib, func, spec) {

    return {

      code: code || 'Unknown',

      message: message || 'Unknown',

      spec: spec || 'Unknown',

      lib: lib || 'Unknown',

      func: func || 'Unknown',

      critical: critical === true,

      type: 'error'

    };

  };

  this.getEvents = {

    bySpec: function(spec) {

      return _.filter(events, function(event) {

        return event.spec === spec;

      });

    },

    byType: function(type) {

      return _.filter(events, function(event) {

        return event.type === type;

      });

    }

  };

  this.getSpecs = function() {

    var result = [];

    _.each(events, function(event) {

      if ( result.indexOf(event.spec) === -1 ) {

        result[result.length] = event.spec;

      }

    });

    return result;

  };

};

module.exports = new LifeExtension();
