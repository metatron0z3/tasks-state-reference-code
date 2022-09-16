'use strict';

describe('Filter: getUserAvatar', function () {

  // load the filter's module
  beforeEach(module('webClientApp'));

  // initialize a new instance of the filter before each test
  var getUserAvatar;
  beforeEach(inject(function ($filter) {
    getUserAvatar = $filter('getUserAvatar');
  }));

  it('should return the input prefixed with "getUserAvatar filter:"', function () {
    var text = 'angularjs';
    expect(getUserAvatar(text)).toBe('getUserAvatar filter: ' + text);
  });

});
