'use strict';

describe('Controller: MCtrl', function () {

  // load the controller's module
  beforeEach(module('v5App'));

  var MCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MCtrl = $controller('MCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
