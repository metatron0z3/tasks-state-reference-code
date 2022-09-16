'use strict';

describe('Filter: getTrooperEmail', function () {

  // load the filter's module
  beforeEach(module('webClientApp'));

  // initialize a new instance of the filter before each test
  var getTrooperEmail;
  beforeEach(inject(function ($filter) {
    getTrooperEmail = $filter('getTrooperEmail');
  }));

  it('should return the input prefixed with "getTrooperEmail filter:"', function () {
    var text = 'angularjs';
    expect(getTrooperEmail(text)).toBe('getTrooperEmail filter: ' + text);
  });

});
