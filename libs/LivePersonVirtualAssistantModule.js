var LivePersonVirtualAssistantModule = (function () {
  var _version = '2.3.0';
  var _config = {
    COUNTRY_CODE_LOCATION: 'cstatus',
    USING_PROXY_BUTTON: true,
    TRIGGER_CHAT_BUTTON_FROM_BUSY_STATE:false,
    TRIGGER_CHAT_BUTTON_FROM_OFFLINE_STATE:false,
    SEND_FAQ_CONVERSATION_AS_PRECHAT_LINES: true, 
    PRECHAT_LINES_INTRO_MESSAGE_ENABLED: true, 
    EMBEDDED_BUTTON_ID_LOADED: null,
    EMBEDDED_BUTTON_TYPE: 5,
    EMBEDDED_BUTTON_INFO: null,
    ENGAGEMENT_NAME_SHORTCODE: ':vap:',
    EMBEDDED_BUTTON_DIV_CONTAINER_ID: 'lpButtonDiv-need-help-panel',
    WINDOW_CLOSE_BUTTON_CLASS:'lp_close',
    NAMESPACE : 'LP_VA_PANEL_MODULE',
    EVENTS : {
      BUTTON_IMPRESSION:'EMBEDDED_BUTTON_IMPRESSION',
      SHOW:'SHOULD_SHOW_VA_PANEL',
      HIDE:'SHOULD_HIDE_VA_PANEL',
      BUTTON_TO_DISPLAY:'SHOULD_SHOW_BUTTON_CONTENT',
      BUTTON_REMOVED:'SHOULD_HIDE_BUTTON_CONTENT',
      CLOSE_THANKYOU_WINDOW:'DID_CLOSE_THANKYOU_WINDOW'
    }
  };

  var _supportedLanguages = ['en','fr','zh_hans','zh','zh_cn','zh_tw','ar','bm','es','es_mx','en_us'];
  var _abandonedChatEvents = ['waiting','preChat','chatting','postChat'];
  var _translations = {
    'default' : {
      'intro': 'Your conversation history so far ...',
      'suffix': 'An Agent will be with you shortly ...'
    },
    'en': {
      'intro': 'Your conversation history so far ...',
      'suffix': 'An Agent will be with you shortly ...'
    },
    'en_us': {
      'intro': 'Your conversation history so far ...',
      'suffix': 'An Agent will be with you shortly ...'
    },
    'es_mx': {
      'intro': 'Su historial de conversaciones hasta la fecha...',
      'suffix': ''
    },
    'fr': {
      'intro': 'Votre historique de conversations jusqu\'à présent...',
      'suffix': 'Un agent vous répondra bientôt...'
    },
    'zh': {
      'intro': '很快将会有座席代表与您聊天...',
      'suffix': '很快将会有座席代表与您聊天...'
    },
    'zh_cn': {
      'intro': '很快将会有座席代表与您聊天...',
      'suffix': '很快将会有座席代表与您聊天...'
    },
    'zh_tw': {
      'intro': '您目前的對談記錄...',
      'suffix': '服務人員很快會與您聯絡...'
    },
    'zh_hans': {
      'intro': '',
      'suffix': 'Dentro de poco un agente estará con usted...'
    },
    'ar': {
      'intro': '',
      'suffix': ''
    },
    'bm': {
      'intro': '',
      'suffix': ''
    },
    'es': {
      'intro': '',
      'suffix': ''
    }
  };

  var BUTTON_STATES = {
    'ONLINE':1,
    'OFFLINE':2,
    'BUSY':4,
    'UNKNOWN':0
  };

  var BUTTON_STATE_DESCRIPTIONS = {
    1 : 'ONLINE',
    2 : 'OFFLINE',
    4 : 'BUSY',
    0 : 'UNKNOWN',
  };

  var _eventBindingsDone = false;

  var _eventLog = [];

  function _log(name,event) {
    _eventLog.push({
      'name':name,
      'info':event,
      'timestamp':Date.now()
    });
  }
  function checkIfButtonImpressionIsForVaPanel(e) {
    
    /* 
     This event fires every time a button is displayed on the page
     You will need to check the e.engagementType value to see what type it is.
     5 = embedded but there may be more than one embedded button on some pages that are NOT va panel related.
     otherwise the engagementName property may give some indication if named correctly on the liveperson side.
    */
    // check if the type is embedded (5) AND the id matches the array constant of all ids on both accounts DEV/PROD
    // .match(/:vap:/g);
    var _regexCheckEngagementName = new RegExp(_config.ENGAGEMENT_NAME_SHORTCODE,'g');
    if (e.engagementType == _config.EMBEDDED_BUTTON_TYPE && _regexCheckEngagementName.test(e.engagementName) )
    {
      // means embedded button and the unique id the button matches the specific buttons we have configured with the LE2 system to be shown within the VA panel
      _config.EMBEDDED_BUTTON_ID_LOADED = e.engagementId; // store the value so we can use it later when we need to query the button state later in the process for an accurate value - this is in case the refresh timer has changed the state from online/offline and vice versa
      
      // trigger a custom event using the lpTag.events bridge to notify other parts of the code that we have successfull loaded the embedded button for VA panel
      var eventData = {
        id: e.engagementId,
        name: e.engagementName,
        cid: e.campaignId,
        state: e.state
      };
      lpTag.events.trigger(_config.NAMESPACE, _config.EVENTS.BUTTON_IMPRESSION,eventData);
      _log(_config.EVENTS.BUTTON_IMPRESSION, eventData);
    } 
  }


  function showTheLivePersonButtonInsideVaPanel(eventData) {
    // the hidden empty HTML button inside the va panel has been loaded
    // cache eventData object
    _config.EMBEDDED_BUTTON_INFO = eventData;
    // as this could happen many times for button on refresh rates, we should always hide both buttons by default and then reshow the relevant one...
    if (_config.USING_PROXY_BUTTON) {
      
      var buttonStateKeys =  Object.keys(BUTTON_STATES);
      var data = {
        'reason': 'VA PANEL related button impression event detected - show the button content on the page based on the attached eventData.state property',
        'state': eventData.state,
        'status': BUTTON_STATE_DESCRIPTIONS[eventData.state],
        'state_descriptions': BUTTON_STATE_DESCRIPTIONS,
        'state_enums': BUTTON_STATES
      };
      _triggerEvent(_config.EVENTS.BUTTON_TO_DISPLAY, data );
    }

  }

  function getActiveButton() {
    return _config.EMBEDDED_BUTTON_INFO;
  }

  function chatWindowIsActive() {
    var _windowEvents = lpTag.events.hasFired('lpUnifiedWindow', 'state');
    if (_windowEvents.length > 0) {
      // the window has fired events meaning it is being shown - hide the panel
      // if you only want to hide on specific conditions check the values of _windowEvents[].data.state property
      return true;
    } else {
      return false;
    }

  }

  function _triggerEvent(name,data) {
    lpTag.events.trigger(_config.NAMESPACE, name, data);
    _log(name,data);
  }

  function _reset() {
    //added reset function to clear flags and event logs between navigations if required
    _eventLog = [];
    _eventBindingsDone = false;
    _config.EMBEDDED_BUTTON_INFO = null;
  }
  function _init() {
    // bind to the window
    // _eventLog = [];
    if (lpTag && lpTag.events && lpTag.events.hasFired) {
      // events.hasFired exists - check if the lpTag window is already on the page before we got here?
      // if we find any events, we should fire the event to hide the panel
      if (chatWindowIsActive()) {
        _triggerEvent(_config.EVENTS.HIDE,{
          'reason':'panel should be hidden because chatWindowIsActive returned TRUE'
        });
      }
    }
    // this check is for when working within ajax page context where lpTag.newPage may be used in conjunction with the .start method of this module incorrectly.
    // ideally .start will only ever be called once on page load.
    // this check was to prevent multiple event bindings being created.
    if(_eventBindingsDone === false) {
      bindToChatEvents();
      addSurveyHooks();
      _eventBindingsDone = true;      
    } else {
      _log('EVENT_BINDINGS_DONE',{'eventBindingsDone':_eventBindingsDone});
    }

  }

  // workaround for #CMBWSUAT-31
  function checkWindowStatus(element) {
    var lpChatWindowEvents = lpTag.events.hasFired('lpUnifiedWindow', 'conversationInfo');
    _log('checkWindowStatus', { 'lpChatWindowEvents': lpChatWindowEvents });

    var lastEvent = lpChatWindowEvents[lpChatWindowEvents.length-1];
    var previousEvent = lpChatWindowEvents[lpChatWindowEvents.length - 2] || null;
    _log('previousEvent_and_lastEvent', { 'previousEvent': previousEvent,'lastEvent':lastEvent });

    /* 
      lastEvent == preChat/waiting/chatting/postChat => showPanel
      lastEvent == ended AND previousEvent = preChat/waiting/chatting/ => showPanel + closeThankyouWindow

      lastEvent.data.state == 'preChat' || lastEvent.data.state == 'waiting' || lastEvent.data.state == 'chatting' || lastEvent.data.state == 'postChat'
    */

    if (  lastEvent.data.state && 
        _abandonedChatEvents.indexOf(lastEvent.data.state) > -1  
    ) {
      // visitor abandonded without submitted survey or connecting to agent...show panel
      _triggerEvent(_config.EVENTS.SHOW, {
        'reason': 'visitor abandonded without submitting prechat survey / or connecting to agent / or did not submit post chat survey...show panel',
        'lastEvent' : lastEvent 
      });
    }
    if( lastEvent.data.state &&
        lastEvent.data.state == 'ended' && 
        previousEvent.data.state && 
        _abandonedChatEvents.indexOf(previousEvent.data.state) > -1 
    ) {
      _triggerEvent(_config.EVENTS.SHOW, {
        'reason': 'lastEvent == ended AND previousEvent = preChat/waiting/chatting/ => showPanel + closeThankyouWindow',
        'lastEvent': lastEvent,
        'previousEvent':previousEvent
      });
      closeThankyouWindow();
    }

    if(lastEvent.data.state == 'postChat') {
      _log('closeThankyouWindow', { 'lastEvent': lastEvent});
      closeThankyouWindow();    
    }
  }

  function _handleBeforeSurveySubmitHook(options) {
    _log('BEFORE_SUBMIT_SURVEY', { 'options': options });
    var reason = null;
    var eventData = {
      'options.data.surveyType': options.data.surveyType,
      'options.data.surveyData': options.data.surveyData,
      'reason': reason
    };

    if (options.data.surveyType == 'preChatSurvey' && options.data.surveyData === null) {
      eventData.reason = 'BEFORE_SUBMIT_SURVEY // preChatSurvey / no surveyData so closing thank you window and showing panel'; 
      _triggerEvent(_config.EVENTS.SHOW, eventData);
      closeThankyouWindow();    
    }
    if (options.data.surveyType == 'postChatSurvey') {
      eventData.reason = 'BEFORE_SUBMIT_SURVEY // postChatSurvey / closing thank you window and showing panel';
      _triggerEvent(_config.EVENTS.SHOW, eventData);    
      closeThankyouWindow();
    }
    
    return options;
  }

  function addSurveyHooks() {
    console.log('==> addSurveyHooks');
    var _waitForHooks = setInterval(function () {
      console.log('==> _waitForHooks');
      var _waitForHooksCounter = 0;
      if (lpTag && lpTag.hooks && lpTag.hooks) {
        console.log('==> hooks found!');
        clearInterval(_waitForHooks);
        lpTag.hooks.push({
          name: 'BEFORE_SUBMIT_SURVEY',
          callback: _handleBeforeSurveySubmitHook
        });
      } else if (_waitForHooksCounter > 10) {
        _log('clearInterval/_waitForHooksCounter', { '_waitForHooksCounter': _waitForHooksCounter });
        clearInterval(_waitForHooks); // stop looping for hooks after 2 seconds
      }
    }, 200);
  }

  function bindToChatEvents() {
    
    // make sure the function and objects exist
    if (lpTag && lpTag.events && lpTag.events.bind) {
      _log('bindToChatEvents', { });
      lpTag.events.bind('lpUnifiedWindow', 'state', function (eventData, d) {
        /* 
        lpUnifiedWindow/state 
          tracks the state of the window itself
          possible values from e.state object:
          init / initialised / waiting / chatting / interactive / resume
       */

        if (eventData.state == 'preChat' || eventData.state == 'waiting' || eventData.state == 'resume' || eventData.state == 'interactive'|| eventData.state == 'postChat') {
          _triggerEvent(_config.EVENTS.HIDE, {
            'eventData.state':eventData.state,
            'reason': 'lpUnifiedWindow State = '+eventData.state
          });
        }
      });

      lpTag.events.bind('lpUnifiedWindow', 'conversationInfo', function (eventData, appName) {
        /* 
        This event tracks the state of the conversation itself
          eventData.state ...
            ended : chat ended
            postChat: post chat survey shown
            applicationEnded : post chat survey submitted     
       */

        // workaround for #CMBWSUAT-31
        // added resume state in case page is ever refreshed, we need to re-add the click event bindings on the X close button!
        if (eventData.state == 'preChat' || eventData.state == 'resume') {
          // when the prechat survey is shown attach a click event listener to the close button of the window.
          // if this is clicked the checkWindowStatus function is then called to see if the survey was completed or not.
          var matches = document.getElementsByClassName(_config.WINDOW_CLOSE_BUTTON_CLASS);
          for (var i = 0; i < matches.length; i++) {
            matches[i].addEventListener('click', checkWindowStatus, true);
          }

        }

        // if the post chat exit survey has been submitted then auto close the thank you window
        if (eventData.state == 'applicationEnded') {
          closeThankyouWindow();
          _triggerEvent(_config.EVENTS.SHOW, {
            'eventData.state': eventData.state,
            'reason': 'lpUnifiedWindow conversationInfo  ' + eventData.state + ' event fired = post chat survey has been submitted'
          });
        }

        if (eventData.state == 'ended') {
          checkWindowStatus();
        }

      });

      lpTag.events.bind('LP_OFFERS', 'OFFER_IMPRESSION', checkIfButtonImpressionIsForVaPanel);

      // custom event to react to when other parts of the code detect the button loaded on the page is for the VA Panel
      lpTag.events.bind(_config.NAMESPACE, _config.EVENTS.BUTTON_IMPRESSION, showTheLivePersonButtonInsideVaPanel);

      // TODO: listen for footprint of lpTag.newPage call which will kill embedded buttons on the page. Should fire a HIDE event for the panel until the newPage is called again with a valid URL to refire button impression
      lpTag.events.bind('LPTAG', 'TAGLET_RESTARTED', function(eventData,appName) {
        if (eventData.name === 'rendererStub') {
          console.log("[LP VA Module] ==> TAGLET_RESTARTED for rendererStub ");
          _triggerEvent(_config.EVENTS.BUTTON_REMOVED, {
            'status':'NA',
            'reason': 'in-page navigation event - all buttons have been cleared - should hide chat button inside panel and await future button impression events to trigger...'
          });
        }
      });
    }

  }

  function triggerChatButtonClick(faqHistorySoFar) {
    // DOCS: https://developers.liveperson.com/trigger-click.html
    var clicked;

    if (lpTag && lpTag.taglets && lpTag.taglets.rendererStub) {
      if (_config.SEND_FAQ_CONVERSATION_AS_PRECHAT_LINES && faqHistorySoFar.length > 0) {
        // grab FAQ lines...this POC just gets the HTML content from specific class elements...you will use your own API and functions to get this information from the chat in progress.
        var currentLanguage = getCurrentLanguageSelection();
        var translations = isSupportedLanguage(currentLanguage) ? getLanguageTranslations(currentLanguage) : null;
        var preChatLinesArray = [];
        if(translations && translations.intro) {
          preChatLinesArray.push(translations.intro);
        } else {
          // we could not find a cart item which matched a supported language in our translation list, therefore we do not have any intro messages to add to the conversation
          console.log('[LP VA Module] ==> unsupported language OR no INTRO translations found for current languages : ',currentLanguage);
        }
        preChatLinesArray = preChatLinesArray.concat(faqHistorySoFar);
        // if preChatLinesContent.length > 0 then we have been supplied with faq history so far.
        // UPDATE : DO NOT SEND preChatLines if empty! otherwise this will cause the 400 bad request error in the chat window
        if (translations && translations.suffix) {
          preChatLinesArray.push(translations.suffix);
        } else {
          console.log('[LP VA Module] ==> unsupported language OR no SUFFIX translations found for current languages : ',currentLanguage);
        }

        if (preChatLinesArray.length > 0) {
          clicked = lpTag.taglets.rendererStub.click(_config.EMBEDDED_BUTTON_INFO.id, {
            preChatLines: preChatLinesArray
          });
        } else {
          clicked = lpTag.taglets.rendererStub.click(_config.EMBEDDED_BUTTON_INFO.id); // this will open the chat window
        }

      } else {
        clicked = lpTag.taglets.rendererStub.click(_config.EMBEDDED_BUTTON_INFO.id); // this will open the chat window
      }

    }
  }


  function isSupportedLanguage(lang) {
    var supportedLanguage = false;
    if(_supportedLanguages.indexOf(lang) > -1) {
      supportedLanguage = true;
    }
    console.log('[LP VA MODULE] => isSupportedLanguage ? ',lang,supportedLanguage);
    return supportedLanguage;
  }

  function getCountrySelection() {
    var sdesAdded = lpTag.events.hasFired("lp_sdes","VAR_ADDED");
    var countryCode = null;
    if (!sdesAdded) {
      return null;
    }
    for (let sdeAddedEvent = 0; sdeAddedEvent < sdesAdded.length; sdeAddedEvent++) {
      var event = sdesAdded[sdeAddedEvent];
      if (event.data.type === 'ctmrinfo') {
        if (event.data && event.data.info) {
          var customerInfo = event.data.info;
          countryCode = customerInfo[_config.COUNTRY_CODE_LOCATION] || null;
    
        }
      }
    }
  
    return countryCode;
  }

  function getCurrentLanguageSelection(){

    // loop array of lpTag.events.hasFired("lp_sdes","VAR_ADDED"); and check for presence of cart SDE
    var foundSupportedLanguage = false;
    var currentLanguageSelection = null;
    var sdesAdded = lpTag.events.hasFired("lp_sdes","VAR_ADDED");
    if (!sdesAdded) {
      return null;
    }
    for (let sdeAddedEvent = 0; sdeAddedEvent < sdesAdded.length; sdeAddedEvent++) {
      var event = sdesAdded[sdeAddedEvent];
      if (event.data.type === 'cart') {
        var cartItems = (event.data.products && event.data.products.length && event.data.products.length > 0) || false;
        if (cartItems) {
          for (let i = 0; i < event.data.products.length; i++) {
            var possibleLanguageSelection = event.data.products[i].product.name || null;
            if(isSupportedLanguage(possibleLanguageSelection)) {
              currentLanguageSelection = possibleLanguageSelection;
              foundSupportedLanguage = true;
              console.log('[LP VA Module] ==> getCurrentLanguageSelection : foundSupportedLanguage // ',currentLanguageSelection);
    
              break;
            }
          }
        }
      }
    }

    return currentLanguageSelection;
  }

  function getLanguageTranslations(language) {
    return _translations[language] || null;
  }

  function closeThankyouWindow() {
    var closeBtn = document.querySelector('.lp_close'); // this is the class of the close button

    // if we find it, click to close the thank you screen
    setTimeout(function(){
      if (closeBtn) {
        closeBtn.click();
        _triggerEvent(_config.EVENTS.CLOSE_THANKYOU_WINDOW, {
          'info': 'attempted to close thank you window'
        });
      }
    },500);

  }


  function checkButtonState() {
    // example of how you can query the lpTag and get the latest button state for a unique button engagement id
    // 1 = online
    // 2 = offline
    // 4 = busy
    var buttonState = 0;
    if (_config.EMBEDDED_BUTTON_INFO && _config.EMBEDDED_BUTTON_INFO.id && lpTag.taglets.rendererStub.getEngagementState(_config.EMBEDDED_BUTTON_INFO.id)) {
      buttonState = lpTag.taglets.rendererStub.getEngagementState(_config.EMBEDDED_BUTTON_INFO.id).state; // use the number you grabbed earlier when the button was loaded inside the panel
    }
    return buttonState;
  }

  function agentsAreAvailable() {
    return checkButtonState() == BUTTON_STATES.ONLINE ? true : false;
  }
  function agentsAreBusy() {
    return checkButtonState() == BUTTON_STATES.BUSY ? true : false;
  }
  function agentsAreOffline() {
    return checkButtonState() == BUTTON_STATES.OFFLINE ? true : false;
  }

  function startChat(conversationSoFar) {
    var preChatLines = conversationSoFar || [];
    var state = checkButtonState();
    // only trigger the click function if the button is ONLINE

    if ( 
      (state == BUTTON_STATES.BUSY && _config.TRIGGER_CHAT_BUTTON_FROM_BUSY_STATE) ||
      (state == BUTTON_STATES.OFFLINE && _config.TRIGGER_CHAT_BUTTON_FROM_OFFLINE_STATE) ||
      (state == BUTTON_STATES.ONLINE)
    ) {
      triggerChatButtonClick(preChatLines);
    } else {
      return false;
    }

  }

  function injectLivePersonEmbeddedButtonContainer() {
    /* 
      At this point the panel is shown and the <div> with the required specific id for LivePerson to deploy the button into does not exist in the DOM
      Therefore, this code adds that div with that id to the DOM dynamically
      Once this has been done, you MUST register this with LivePerson as shown below so that our tag can search again for the container div matching the id we provide, and deploy the button content accordingly.
    */

    /*************** 
        CRUCIAL
    ****************/
    // only do this once! we only need to create the div tag once when first showing the panel on each page load
    if (!document.getElementById(_config.EMBEDDED_BUTTON_DIV_CONTAINER_ID)) {
      // if the div id has NOT already been created, then make one and add to the panel in the required position with the required id
      var buttonContainer = document.getElementById('button-container');
      var buttonDiv = document.createElement('div');
      buttonDiv.id = _config.EMBEDDED_BUTTON_DIV_CONTAINER_ID;
      buttonContainer.appendChild(buttonDiv);
      // register button div zone with LivePerson now div exists within the DOM   
      // THIS IS CRUCIAL -it tells our system that the container div for the button now exists and can be attempted to be injected onto the page - in either online/offline state. 
      var sdes = [{
        'type': 'pagediv',
        'divId': _config.EMBEDDED_BUTTON_DIV_CONTAINER_ID
      }];
      _log('injectButtonContainerId',{
        'sdes':sdes,
        'buttonContainer': buttonContainer,
        'buttonDiv': buttonDiv,
      });
      if (lpTag && lpTag.sdes && lpTag.sdes.send) {
        lpTag.sdes.send(sdes);
      } else if (lpTag && lpTag.sdes.push) {
        lpTag.sdes.push(sdes);
      }
      // ^ The above will tell LP that the div now exists and is ready to receive the content - online/offline/busy etc...
    }
  }

  function getEventLog() {
    return _eventLog;
  }

  // Reveal public pointers to
  // private functions and properties

  return {
    version:_version,
    start: _init,
    init: _init,
    reset: _reset,
    injectButtonContainer: injectLivePersonEmbeddedButtonContainer,
    escalateToChat: startChat,
    startChat: startChat,
    agentsAreAvailable: agentsAreAvailable,
    agentsAreBusy: agentsAreBusy,
    agentsAreOffline: agentsAreOffline,
    getActiveButton:getActiveButton,
    getEventLog:getEventLog,
    returnCurrentLanguageValueIfSupported: getCurrentLanguageSelection,
    getCountry: getCountrySelection,
    supportedLanguages: _supportedLanguages
  };

})();