'use strict';

describe('Service: ViewManager', function () {

  // load the service's module
  beforeEach(module('webClientApp'));

  // instantiate service
  var ViewManager;
  beforeEach(inject(function (_ViewManager_) {
    ViewManager = _ViewManager_;
  }));

  it('should do something', function () {
    expect(!!ViewManager).toBe(true);
  });

});
