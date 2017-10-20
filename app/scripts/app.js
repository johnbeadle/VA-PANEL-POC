'use strict';

/**
 * @ngdoc overview
 * @name HsbcNetSampleApp
 * @description
 * # HsbcNetSampleApp
 *
 * Main module of the application.
 */
angular
  .module('HsbcNetSampleApp', [
    'ngCookies',
    'ngRoute'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'vm'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
