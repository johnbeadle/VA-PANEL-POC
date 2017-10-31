'use strict';

/**
 * @ngdoc function
 * @name HsbcNetSampleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the HsbcNetSampleApp
 */
angular.module('HsbcNetSampleApp')
  .controller('MainCtrl', function ($scope,$window,$location,$routeParams,$route) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    var vm = this;
    vm.customerAskedToughQuestion = false;
    var defaultLanguage = 'en_uk';
    var defaultCountry = 'GB';
    var countryLanguageMappings = {
      'GB' : 'en_uk',
      'MX' : 'es_mx'
    };
    // set language based on optional routeParams or fallback to default
    $window.document.title = 'HSBCNet Develop';
    $scope.$on('$routeChangeSuccess', function () {
      vm.customerLanguage = $routeParams.lang || defaultLanguage;
      vm.customerCountry = $routeParams.country || defaultCountry;
      // console.log('--> customerLanguage => ', vm.customerLanguage);
      // console.log('--> customerCountry => ', vm.customerCountry, $routeParams);
      // console.log('--> routeParams => ', $routeParams.country, $routeParams.lang);
      // $routeParams will be populated here if
      // this controller is used outside ng-view
    });
   

    vm.changeLanguage = function(lang) {
      vm.customerLanguage = lang;
      // console.log('--> change language func // ',vm.customerLanguage);
      $location.path('/home/' + vm.customerCountry + '/' + vm.customerLanguage);
    };

    vm.changeCountry = function(country) {
      vm.customerCountry = country;
      // console.log('--> change country func // ',vm.customerCountry);
      $location.path('/home/' + vm.customerCountry + '/' + countryLanguageMappings[country]);
    };

    vm.togglePanel = function() {
      $('#slideout').toggleClass('on');
      LivePersonVirtualAssistantModule.injectButtonContainer();
    };

    vm.escalateToChat = function() {
      LivePersonVirtualAssistantModule.escalateToChat();
    };

    vm.checkIfAgentsAreAvailable = function() {
      return LivePersonVirtualAssistantModule.agentsAreAvailable();
    };

    vm.askToughQuestion = function() {
      vm.agentsAvailable = vm.checkIfAgentsAreAvailable();
      vm.customerAskedToughQuestion = true;
    };
    LivePersonVirtualAssistantModule.start();



  });
