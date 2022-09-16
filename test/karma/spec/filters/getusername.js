'use strict';

describe('Filter: getUserName', function () {

  // load the filter's module
  beforeEach(module('webClientApp'));

  // initialize a new instance of the filter before each test
  var getUserName;
  beforeEach(inject(function ($filter) {
    getUserName = $filter('getUserName');
  }));

  it('should return the input prefixed with "getUserName filter:"', function () {
    var text = 'angularjs';
    expect(getUserName(text)).toBe('getUserName filter: ' + text);
  });

});
