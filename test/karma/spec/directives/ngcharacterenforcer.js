'use strict';

describe('Directive: ngCharacterEnforcer', function () {

  // load the directive's module
  beforeEach(module('webClientApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<ng-character-enforcer></ng-character-enforcer>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('this is the ngCharacterEnforcer directive');
  }));
});
