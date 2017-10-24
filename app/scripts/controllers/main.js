'use strict';

/**
 * @ngdoc function
 * @name HsbcNetSampleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the HsbcNetSampleApp
 */
angular.module('HsbcNetSampleApp')
  .controller('MainCtrl', function ($scope,$window,$location,$routeParams) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    var vm = this;

    var defaultLanguage = 'en_uk';

    // set language based on optional routeParams or fallback to default
    vm.customerLanguage = $routeParams.lang || defaultLanguage;

    console.log('--> customerLanguage => ',vm.customerLanguage);

    vm.customerAskedToughQuestion = false;

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
      // $scope.$apply();
    };

    var lpCountryTemplate =    {
      'type': 'ctmrinfo',  //MANDATORY
      'info': {
        'cstatus': 'GB', // country code
        'ctype': 'vip' // optional additional info?
      }
    };
    var lpLanguageTemplate = {
      'type': 'cart',  //MANDATORY
      'numItems': 1,  //NUMBER OF ITEMS IN CART
      'products': [{
        'product': {
          'name': vm.customerLanguage
        }, 'quantity': 1
      }]
    };
    var lpSection = ['hsbcnet','page-main'];

    var lpSdes =[
      lpCountryTemplate,
      lpLanguageTemplate
    ];
    // send liveperson SDEs here
    if (lpTag && lpTag.loaded === true && lpTag.newPage) {
      // This means the lpTag is already on the page from a previous full page reload,
      // so we must be triggering this event because of an SPA page load from the page
      // Therefore call lpTag.newPage() using the URL from the u.data object and the SDEs from 
      // the data []

      console.log('[spa-app.js] --> lpTag.newPage found....calling ...', document.location.href, lpSection, lpSdes);
      lpTag.newPage(document.location.href,{
        section: lpSection,
        sdes: lpSdes
      });

    } else {
      // If we fall into this condition that means we must be loading the page via normal F5 page reload
      // so we do NOT want / need to call lpTag.newPage() and can leave the lpTag to bootstrap as normal
      // We should push the sdes into the lpTag.sdes object here so they are collected by the lpTag when it eventually starts
      console.log('[spa-app.js] --> lpTag.newPage not found -- initial page load ...', lpSdes);
      lpTag.section = lpSection;
      lpTag.sdes.push(lpSdes);

    }

    // start 
    LivePersonVirtualAssistantModule.start();

  });
