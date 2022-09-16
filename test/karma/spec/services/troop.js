'use strict';

describe('Service: Troop', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var Troop;
  beforeEach(inject(function (_Troop_) {
    Troop = _Troop_;
  }));

  it('should do something', function () {
    expect(!!Troop).toBe(true);
  });

});
