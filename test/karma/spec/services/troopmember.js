'use strict';

describe('Service: TroopMember', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var TroopMember;
  beforeEach(inject(function (_TroopMember_) {
    TroopMember = _TroopMember_;
  }));

  it('should do something', function () {
    expect(!!TroopMember).toBe(true);
  });

});
