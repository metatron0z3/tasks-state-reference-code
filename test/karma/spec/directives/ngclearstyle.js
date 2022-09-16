'use strict';

describe('Directive: ngClearStyle', function () {

  // load the directive's module
  beforeEach(module('webClientApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<ng-clear-style></ng-clear-style>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the ngClearStyle directive');
  }));
});
