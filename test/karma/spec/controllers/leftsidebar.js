'use strict';

describe('Controller: LeftsidebarCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var LeftsidebarCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LeftsidebarCtrl = $controller('LeftsidebarCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
