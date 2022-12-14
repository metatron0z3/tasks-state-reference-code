'use strict';

describe('Controller: VerifyemailCtrl', function () {

  // load the controller's module
  beforeEach(module('webClientApp'));

  var VerifyemailCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    VerifyemailCtrl = $controller('VerifyemailCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
