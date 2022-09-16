'use strict';

describe('Service: Me', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var Me;
  beforeEach(inject(function (_Me_) {
    Me = _Me_;
  }));

  it('should do something', function () {
    expect(!!Me).toBe(true);
  });

});
