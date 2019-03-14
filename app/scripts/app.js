'use strict';

/**
 * @ngdoc overview
 * @name HsbcCmbSampleApp
 * @description
 * # HsbcCmbSampleApp
 *
 * Main module of the application.
 */
angular
  .module('HsbcCmbSampleApp', [
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
      .when('/account/:country?/:lang?', {
        templateUrl: 'views/account.html',
        controller: 'accountCtrl',
        controllerAs: 'vm'
      })
      .when('/outside/:country?/:lang?', {
        templateUrl: 'views/outside.html',
        controller: 'OutsideCtrl',
        controllerAs: 'vm'
      })
      .otherwise({
        redirectTo: '/home/GB/en_uk'
      });
  });
