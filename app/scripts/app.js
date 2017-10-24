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
      .when('/home/:lang?', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'vm'
      })
      .when('/about/:lang?', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/home/'
      });
  });
