'use strict';

describe('Controller: TroopinvitesCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var TroopinvitesCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    TroopinvitesCtrl = $controller('TroopinvitesCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
