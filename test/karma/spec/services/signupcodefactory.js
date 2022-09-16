'use strict';

describe('Service: SignupCodeFactory', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var SignupCodeFactory;
  beforeEach(inject(function (_SignupCodeFactory_) {
    SignupCodeFactory = _SignupCodeFactory_;
  }));

  it('should do something', function () {
    expect(!!SignupCodeFactory).toBe(true);
  });

});
