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
      .when('/home/:country?/:lang?', {
        templateUrl: 'views/home.html',
        controller: 'HomeCtrl',
        controllerAs: 'vm'
      })
      .when('/about/:country?/:lang?', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/home/GB/en_uk'
      });
  });
