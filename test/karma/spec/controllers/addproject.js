'use strict';

describe('Controller: AddprojectCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var AddprojectCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddprojectCtrl = $controller('AddprojectCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
