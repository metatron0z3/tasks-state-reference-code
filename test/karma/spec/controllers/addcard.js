'use strict';

describe('Controller: AddcardctrlCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var AddcardctrlCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    AddcardctrlCtrl = $controller('AddcardctrlCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
