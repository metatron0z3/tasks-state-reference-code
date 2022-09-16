'use strict';

describe('Service: reBuilder', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var reBuilder;
  beforeEach(inject(function (_reBuilder_) {
    reBuilder = _reBuilder_;
  }));

  it('should do something', function () {
    expect(!!reBuilder).toBe(true);
  });

});
