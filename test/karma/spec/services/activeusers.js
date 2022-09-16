'use strict';

describe('Service: ActiveUsers', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var ActiveUsers;
  beforeEach(inject(function (_ActiveUsers_) {
    ActiveUsers = _ActiveUsers_;
  }));

  it('should do something', function () {
    expect(!!ActiveUsers).toBe(true);
  });

});
