'use strict';

/**
 * @ngdoc function
 * @name HsbcCmbSampleApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the HsbcCmbSampleApp
 */
angular.module('HsbcCmbSampleApp')
  .controller('accountCtrl', function ($scope,$window,$location) {
    this.awesomeThings = [
      'EX1',
      'COMMON1',
      'Account'
    ];
    var vm = this;
    vm.language = $scope.$parent.mainCtrl.customerLanguage;
    vm.country = $scope.$parent.mainCtrl.customerCountry;

    var lpCountryTemplate = {
      'type': 'ctmrinfo',  //MANDATORY
      'info': {
        'cstatus': vm.country, // country code
        'ctype': 'vip' // optional additional info?
      }
    };
    var lpLanguageTemplate = {
      'type': 'cart',  //MANDATORY
      'numItems': 1,  //NUMBER OF ITEMS IN CART
      'products': [{
        'product': {
          'name': vm.language
        }, 'quantity': 1
      }]
    };
    var lpSection = ['cmb'];

    var lpSdes =[
      lpCountryTemplate,
      lpLanguageTemplate
    ];

    $window.document.title = 'HSBC CMB Routing Develop onboarding.hsbc.co.uk';

    // send liveperson SDEs here
    if (lpTag && lpTag.loaded === true && lpTag.newPage) {
      // This means the lpTag is already on the page from a previous full page reload,
      // so we must be triggering this event because of an SPA page load from the page
      // Therefore call lpTag.newPage() using the URL from the u.data object and the SDEs from 
      // the data []

      console.log('[account.js] --> lpTag.newPage found....calling ...', lpSection, lpSdes,document.location.href);
      lpTag.newPage(document.location.href,{
        section: lpSection,
        sdes: lpSdes
      });

    } else {
      // If we fall into this condition that means we must be loading the page via normal F5 page reload
      // so we do NOT want / need to call lpTag.newPage() and can leave the lpTag to bootstrap as normal
      // We should push the sdes into the lpTag.sdes object here so they are collected by the lpTag when it eventually starts
      console.log('[account.js] --> lpTag.newPage not found -- initial page load ...', lpSdes);
      lpTag.section = lpSection;
      lpTag.sdes.push(lpSdes);

    }

    // // start 
    // LivePersonVirtualAssistantModule.start();

  });
