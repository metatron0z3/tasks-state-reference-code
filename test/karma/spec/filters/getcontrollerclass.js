'use strict';

describe('Filter: getControllerClass', function () {

  // load the filter's module
  beforeEach(module('webClientApp'));

  // initialize a new instance of the filter before each test
  var getControllerClass;
  beforeEach(inject(function ($filter) {
    getControllerClass = $filter('getControllerClass');
  }));

  it('should return the input prefixed with "getControllerClass filter:"', function () {
    var text = 'angularjs';
    expect(getControllerClass(text)).toBe('getControllerClass filter: ' + text);
  });

});
