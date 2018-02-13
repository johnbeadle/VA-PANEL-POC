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
    vm.agentsAvailable = false;
    vm.agentsBusy = false;
    vm.agentsOffline = false;
    vm.buttonState = null;
    vm.customerAskedToughQuestion = false;
    var defaultLanguage = 'en_uk';
    var defaultCountry = 'GB';
    
    vm.debugInfo = 'Once a button has loaded we will show its details here for debug...';
    vm.countryLanguageMappings = {
      // 'GB' : {
      //   'desc' : ' UK Heritage',
      //   'default' : 'en',
      //   'other' : []
      // },
      'nuGB' : {
        'desc' : ' UK NewUI',
        'default' : 'en',
        'other' : []
      },
      // 'MX' : {
      //   'desc' : ' Mexico Heritage',
      //   'default' : 'es_mx',
      //   'other' : ['en']
      // },
      'nuMX' : {
        'desc' : ' Mexico NewUI',
        'default' : 'es_mx',
        'other' : ['en']
      },
      // 'US' : {
      //   'desc' : ' USA Heritage',
      //   'default' : 'en_us',
      //   'other' : ['en']
      // },
      'nuUS' : {
        'desc' : ' USA NewUI',
        'default' : 'en_us',
        'other' : ['en']
      },
      // 'CA' : {
      //   'desc' : ' Canada Heritage',
      //   'default' : 'fr',
      //   'other': ['en', 'en_us']
      // },
      'nuCA' : {
        'desc' : ' Canada NewUI',
        'default' : 'fr',
        'other' : ['en','en_us']
      },
      // 'HK' : {
      //   'desc' : ' Hong Kong Heritage',
      //   'default' : 'en',
      //   'other': ['zh_hans','zh_hant']
      // },
      'nuHK' : {
        'desc' : ' Hong Kong NewUI',
        'default' : 'en',
        'other': ['zh_hans', 'zh_hant']
      },
      // 'CH' : {
      //   'desc' : ' China Heritage',
      //   'default' : 'zh_hans',
      //   'other': ['en', 'zh_hant']
      // },
      'nuCH' : {
        'desc' : ' China NewUI',
        'default': 'zh_hans',
        'other': ['en', 'zh_hant']
      },
      // 'MO' : {
      //   'desc' : ' Macau Heritage',
      //   'default': 'zh_hant',
      //   'other': ['en', 'zh_hant']
      // },
      'nuMO' : {
        'desc': ' Macau NewUI',
        'default': 'zh_hant',
        'other': ['en', 'zh_hans']
      }
    };
    // set language based on optional routeParams or fallback to default
    $window.document.title = 'HSBCNet Develop';
    $scope.$on('$routeChangeSuccess', function () {
      vm.customerLanguage = $routeParams.lang || defaultLanguage;
      vm.customerCountry = $routeParams.country || defaultCountry;
      vm.selectedCountry = vm.customerCountry;
      // console.log('--> customerLanguage => ', vm.customerLanguage);
      // console.log('--> customerCountry => ', vm.customerCountry, $routeParams);
      // console.log('--> routeParams => ', $routeParams.country, $routeParams.lang);
      // $routeParams will be populated here if
      // this controller is used outside ng-view
    });
    
    if(lpTag && lpTag.events && lpTag.events.bind) {
      lpTag.events.bind('VA_PANEL', 'EMBEDDED_BUTTON_IMPRESSION', function(eventData){
        // console.log('mainCtrl callback for VA_PANEL/EMBEDDED_BUTTON_IMPRESSION event ',eventData);
        vm.debugInfo = '% '+eventData.name;
        $scope.$apply();
      });

    }
   


    vm.changeLanguage = function(lang) {
      vm.customerLanguage = lang;
      // console.log('--> change language func // ',vm.customerLanguage);
      $location.path('/home/' + vm.customerCountry + '/' + vm.customerLanguage);
    };

    vm.changeCountry = function() {
      
      if(vm.selectedCountry == '') {
        return;
      }
      console.log('you selected : ', vm.selectedCountry);
      vm.customerCountry = vm.selectedCountry;
      // console.log('--> change country func // ',vm.customerCountry);
      $location.path('/home/' + vm.customerCountry + '/' + vm.countryLanguageMappings[vm.customerCountry].default);
    };


    vm.escalateToChat = function() {
      // this example shows passing a fake array of strings to represent the conversation history so far...
      // these messages will be added to the conversation heading in the LE2 chat window for context.
      LivePersonVirtualAssistantModule.startChat(['Visitor: I need help with my password','VAP: Sorry I cannot help with that...suggest you speak to an agent...']);
    };

    vm.checkIfAgentsAreAvailable = function() {
      return LivePersonVirtualAssistantModule.agentsAreAvailable();
    };

    vm.askToughQuestion = function() {
      vm.agentsAvailable = vm.checkIfAgentsAreAvailable();
      vm.customerAskedToughQuestion = true;
    };

    vm.refreshButtonContent = function(buttonInfo) {
      console.log('// main.js // refreshButtonContent => ',buttonInfo);
      vm.buttonState = buttonInfo.status;
      $scope.$apply();
    };

    LivePersonVirtualAssistantModule.init(); // must be called every time the VA panel is loaded -regardless of visibility or status to ensure events are bound and listened for correctly with the lpTag window that may be on the page
    vm.togglePanel = function () {
      $('#slideout').toggleClass('on');
      LivePersonVirtualAssistantModule.injectButtonContainer();
    };


    lpTag.events.bind('LP_VA_PANEL_MODULE', '*', function (eventData, info){
      console.log('// main.js // LP_VA_PANEL_MODULE // ',info.eventName);
      if(info.eventName == 'SHOULD_SHOW_BUTTON_CONTENT') {
        vm.refreshButtonContent(eventData);
        // put code here to show/hide the relevant live chat button HTML within the VA panel as required based on the button status online/offline/busy etc...
      }
      if (info.eventName == 'SHOULD_SHOW_VA_PANEL') {
        // code goes here to show the panel again
        $('#slideout').show();
      }
      if (info.eventName == 'SHOULD_HIDE_VA_PANEL') {
        // code goes here to HIDE the panel 
        $('#slideout').hide();
      }
    });


  });
