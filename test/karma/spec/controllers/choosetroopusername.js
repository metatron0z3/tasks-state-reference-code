'use strict';

describe('Controller: ChoosetroopusernameCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var ChoosetroopusernameCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ChoosetroopusernameCtrl = $controller('ChoosetroopusernameCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
