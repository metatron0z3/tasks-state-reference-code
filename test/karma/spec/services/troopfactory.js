'use strict';

describe('Service: TroopFactory', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var TroopFactory;
  beforeEach(inject(function (_TroopFactory_) {
    TroopFactory = _TroopFactory_;
  }));

  it('should do something', function () {
    expect(!!TroopFactory).toBe(true);
  });

});
