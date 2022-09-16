var Bail = function() {

  this.happening = false;

  this.consider = function() {

    if ( ! config.bail.enabled ) {

      return;

    }

    if ( config.bail.criticalOnly ) {

      this.happening = life.criticalErrorExists;

    }
    else {

      this.happening = life.errorExists;

    }

  };

};

module.exports = new Bail();
