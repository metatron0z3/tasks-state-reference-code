'use strict';

describe('Controller: StyleguideCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var StyleguideCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    StyleguideCtrl = $controller('StyleguideCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
