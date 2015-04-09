'use strict';

angular.module('v5App')
  .config(function ($stateProvider) {
    $stateProvider
      .state('m', {
        url: '/m/:id',
        templateUrl: 'app/m/m.html',
        controller: 'MCtrl'
      });
  });