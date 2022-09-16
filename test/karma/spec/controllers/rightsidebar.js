'use strict';

describe('Controller: RightsidebarCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var RightsidebarCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    RightsidebarCtrl = $controller('RightsidebarCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
