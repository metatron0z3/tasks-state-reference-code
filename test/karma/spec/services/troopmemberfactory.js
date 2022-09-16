'use strict';

describe('Service: TroopMemberFactory', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var TroopMemberFactory;
  beforeEach(inject(function (_TroopMemberFactory_) {
    TroopMemberFactory = _TroopMemberFactory_;
  }));

  it('should do something', function () {
    expect(!!TroopMemberFactory).toBe(true);
  });

});
