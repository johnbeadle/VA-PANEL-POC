var LivePersonVirtualAssistantModule = (function () {
  var _version = '2.0.0';
  var _config = {
    USING_PROXY_BUTTON: true, // TRUE = CV provide the visible HTML for all button states-  nothing visible will be pushed from LiveEngage. FALSE = no custom HTML from CV =>  This will require an accompanying change on the LE2 admin side to insert the HTML of the button content. NOTE: Any HTML / images hosted need to be made responsive by CV using CSS classes and styles in your own VA Panel code. LiveEngage does NOT support responsive content/images for embedded button types. 
    SEND_FAQ_CONVERSATION_AS_PRECHAT_LINES: true, 
    PRECHAT_LINES_INTRO_MESSAGE_ENABLED: true, 
    EMBEDDED_BUTTON_ID_LOADED: null,
    EMBEDDED_BUTTON_TYPE: 5,
    EMBEDDED_BUTTON_INFO: null,
    ENGAGEMENT_NAME_SHORTCODE: ':vap:', // this will used to pattern match against the name of the engagements to also check for button matches for VAP specific engagements. #
    EMBEDDED_BUTTON_DIV_CONTAINER_ID: 'lpButtonDiv-need-help-panel',
    WINDOW_CLOSE_BUTTON_CLASS:'lp_close',
    EVENT_NAMESPACE : 'LP_VA_PANEL_MODULE',
    EVENTS : {
      BUTTON_IMPRESSION:'EMBEDDED_BUTTON_IMPRESSION',
      SHOW:'SHOULD_SHOW_VA_PANEL',
      HIDE:'SHOULD_HIDE_VA_PANEL',
      BUTTON_TO_DISPLAY:'SHOULD_SHOW_BUTTON_CONTENT',
      CLOSE_THANKYOU_WINDOW:'DID_CLOSE_THANKYOU_WINDOW'
    }
    // VA_PANEL_CONTAINER_SELECTOR:'#slideout',
    // VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_CLASS: 'faq-chat-line', // replace with whatever class/logic you might use to get the last question/ chat lines. I suspect it will be completely different with the actual AskAndrew and you will call an API to get that data. this is just POC.
    // VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_TAGLINE: 'An agent will be with your shortly to continue the discussion...' //replace with your own message if needed else set to blank or remove this code from the function
  };

  var _supportedLanguages = ['en','fr','zh_hans','zh_hant','ar','bm','es','es_mx'];
  var _abandonedChatEvents = ['waiting','preChat','chatting','postChat'];
  var _translations = {
    'intro' : {
      'en':'en - Your conversation history so far...',
      'fr':'fr - Your conversation history so far...',
      'zh_hans':'zh_hans - Your conversation history so far...',
      'zh_hant':'zh_hant - Your conversation history so far...',
      'ar':'ar - Your conversation history so far...',
      'bm':'bm - Your conversation history so far...',
      'es':'es - Your conversation history so far...',
      'es_mx':'es_mx - Your conversation history so far...'
    }
  };
  /*
Styling and class names used by the POC - may or may not be relevant to how you choose to handle showing or hiding the content 
 */
  // var LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS = 'lp-va-panel-button';
  // var LP_VISIBLE_ONLINE_BUTTON_CLASS_NAME_LIST = 'btn btn-success ' + LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS;
  // var LP_VISIBLE_OFFLINE_BUTTON_CLASS_NAME_LIST = 'btn btn-warning ' + LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS;
  // var LP_HIDDEN_BUTTON_CLASS_NAME_LIST = 'btn btn-success hide-lp-button ' + LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS;
  // var VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_CLASS = 'faq-chat-line';
  // var LP_PROXY_BUTTON_ONLINE_CLASS_NAME = 'lp-va-panel-button-online';
  // var LP_PROXY_BUTTON_OFFLINE_CLASS_NAME = 'lp-va-panel-button-offline';

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

  function _log() {

  }
  function checkIfButtonImpressionIsForVaPanel(e, d) {
    // console.log('--> checkIfButtonImpressionIsForVaPanel // ', e.state, e.engagementId,e.engagementName);
    
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
      console.log('--> *** // passed validation -> is a VA Panel related engagement => ', e.state, e.engagementId,e.engagementName);
      
      // trigger a custom event using the lpTag.events bridge to notify other parts of the code that we have successfull loaded the embedded button for VA panel
      lpTag.events.trigger(_config.EVENT_NAMESPACE, _config.EVENTS.BUTTON_IMPRESSION, {
        id: e.engagementId,
        name: e.engagementName,
        cid: e.campaignId,
        state: e.state
      });
    } else {
      console.log('--> button event => ', e.engagementName,e.state, e.engagementId);
    }
  }

  // function hideLivePersonButtonContainers() {
  //   // ...check the state to determine which custom HTML code for our own button should be shown?
  //   var lpButtons = document.getElementsByClassName(LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS);
  //   // console.log('--> hiding buttons // ', lpButtons);
  //   for (var i = 0; i < lpButtons.length; i++) {
  //     var lpButton = lpButtons[i];
  //     lpButton.className = LP_HIDDEN_BUTTON_CLASS_NAME_LIST; // apply static list of class names to hide the button -- replace with however you choose to do this in the panel
  //   }
  // }

  // function refreshProxyButtonStatus(state) {
  //   // this demos how you can control the content of both the online and offline button HTML elements
  //   // because you will be "fake" clicking the actual LivePerson button hidden on the page with no content, you can display your own responsive buttons and HTML and then control the click function, pass the chat lines and trigger the chat start.
  //   // this section of code just checks the state of the va panel embedded button from LP and allows to choose which one to show
  //   // this is because the design agreed allows shows the button at the bottom of the panel - there is NOT an escalation button to reveal it
  //   // if (state === BUTTON_STATES.ONLINE) {
  //   //   console.log('--> button is online, show that custom button html element which you can control in the panel');
  //   //   document.getElementById(LP_PROXY_BUTTON_ONLINE_CLASS_NAME).classList = LP_VISIBLE_ONLINE_BUTTON_CLASS_NAME_LIST;
  //   // } else if (state === BUTTON_STATES.OFFLINE || state === BUTTON_STATES.BUSY) {
  //   //   console.log('--> button is offline/busy, show that custom button html element which you can control in the panel');
  //   //   document.getElementById(LP_PROXY_BUTTON_OFFLINE_CLASS_NAME).classList = LP_VISIBLE_OFFLINE_BUTTON_CLASS_NAME_LIST;
  //   // }
  // }

  function showTheLivePersonButtonInsideVaPanel(eventData) {
    // the hidden empty HTML button inside the va panel has been loaded
    console.log('LivePerson --> event fired ', _config.EVENT_NAMESPACE, '/', _config.EVENTS.BUTTON_IMPRESSION, eventData);
    // cache eventData object
    _config.EMBEDDED_BUTTON_INFO = eventData;
    // as this could happen many times for button on refresh rates, we should always hide both buttons by default and then reshow the relevant one...
    if (_config.USING_PROXY_BUTTON) {
      // hideLivePersonButtonContainers();
      // refreshProxyButtonStatus(eventData.state);
      var buttonStateKeys =  Object.keys(BUTTON_STATES);
      _triggerEvent(_config.EVENTS.BUTTON_TO_DISPLAY, {
        'reason': 'VA PANEL related button impression event detected - show the button content on the page based on the attached eventData.state property',
        'state': eventData.state,
        'status': BUTTON_STATE_DESCRIPTIONS[eventData.state],
        'state_descriptions': BUTTON_STATE_DESCRIPTIONS,
        'state_enums' : BUTTON_STATES
      });
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
    lpTag.events.trigger(_config.EVENT_NAMESPACE, name, data);
  }

  function _init() {
    // bind to the window
    if (lpTag && lpTag.events && lpTag.events.hasFired) {
      // events.hasFired exists - check if the lpTag window is already on the page before we got here?
      // if we find any events, we should hide the panel
      var _windowEvents = lpTag.events.hasFired('lpUnifiedWindow', 'state');
      if (chatWindowIsActive()) {
        _triggerEvent(_config.EVENTS.HIDE,{
          'reason':'hiding because chatWindowIsActive returned TRUE'
        });
        // hideVaPanel();
      }
    }
    //still call bindToChatEvents so we listen for other events that may still fire.
    if(_eventBindingsDone === false) {
      bindToChatEvents();
      addSurveyHooks();
      _eventBindingsDone = true;      
    } else {
      console.log('--> LivePerson // -> eventBindings already enabled...skipping');
    }

  }

  // workaround for #CMBWSUAT-31
  function checkWindowStatus(element) {
    var lpChatWindowEvents = lpTag.events.hasFired('lpUnifiedWindow', 'conversationInfo');
    console.log('-> chat window events when clicking close button', lpChatWindowEvents);

    var lastEvent = lpChatWindowEvents[lpChatWindowEvents.length-1];
    var previousEvent = lpChatWindowEvents[lpChatWindowEvents.length - 2] || null;
    console.log('-> previousEvent / lastEvent ', previousEvent,lastEvent);

    /* 
      lastEvent == preChat/waiting/chatting/postChat => showPanel
      lastEvent == ended AND previousEvent = preChat/waiting/chatting/ => showPanel + closeThankyouWindow

      lastEvent.data.state == 'preChat' || lastEvent.data.state == 'waiting' || lastEvent.data.state == 'chatting' || lastEvent.data.state == 'postChat'
    */

    if (  lastEvent.data.state 
        && 
        _abandonedChatEvents.indexOf(lastEvent.data.state) > -1  
    ) {
      // visitor abandonded without submitted survey or connecting to agent...show panel
      console.log('-> LivePerson checkWindowStatus:: lastEvent ', lastEvent.data.state);
      console.log('-> LivePerson checkWindowStatus:: visitor abandonded without submitting prechat survey / or connecting to agent / or did not submit post chat survey...show panel');
      _triggerEvent(_config.EVENTS.SHOW, {
        'reason': 'visitor abandonded without submitting prechat survey / or connecting to agent / or did not submit post chat survey...show panel',
        'lastEvent' : lastEvent 
      });
      // showVaPanel();
    }
    if( lastEvent.data.state 
        &&
        lastEvent.data.state == 'ended'
        && 
        previousEvent.data.state
        && 
        _abandonedChatEvents.indexOf(previousEvent.data.state) > -1 
    ) {
      console.log('-> LivePerson checkWindowStatus:: lastEvent ', lastEvent.data.state);
      console.log('-> LivePerson checkWindowStatus:: previousEvent ', previousEvent.data.state);
      console.log('-> LivePerson checkWindowStatus:: lastEvent == ended AND previousEvent = preChat/waiting/chatting/ => showPanel + closeThankyouWindow');
      _triggerEvent(_config.EVENTS.SHOW, {
        'reason': 'lastEvent == ended AND previousEvent = preChat/waiting/chatting/ => showPanel + closeThankyouWindow',
        'lastEvent': lastEvent,
        'previousEvent':previousEvent
      });
      closeThankyouWindow();
    }

    if(lastEvent.data.state == 'postChat') {
      console.log('-> LivePerson checkWindowStatus:: closeThankyouWindow ', lastEvent.data.state);
      
      closeThankyouWindow();    
    }
  }

  function addSurveyHooks() {
    var _waitForHooks = setInterval(function () {
      var _waitForHooksCounter = 0;
      if (lpTag && lpTag.hooks && lpTag.hooks) {
        clearInterval(_waitForHooks);
        lpTag.hooks.push({
          name: 'BEFORE_SUBMIT_SURVEY',
          callback: function (options) {
            console.log('--> LivePerson :: BEFORE_SUBMIT_SURVEY options ', options, options.data.surveyType);
            if (options.data.surveyType == 'preChatSurvey' && options.data.surveyData === null) {
              // no prechat survey data = abandoned
              console.log('--> LivePerson :: BEFORE_SUBMIT_SURVEY//preChatSurvey --> no surveyData so closing thank you window and showing panel ', options, options.data.surveyData);
              _triggerEvent(_config.EVENTS.SHOW, {
                'reason': 'no surveyData so closing thank you window and showing panel'
              });
              // showVaPanel();
              closeThankyouWindow();
            }

            if (options.data.surveyType == 'postChatSurvey') {
              console.log('--> LivePerson :: BEFORE_SUBMIT_SURVEY//postChatSurvey -->  closing thank you window and showing panel ', options, options.data.surveyData);
              _triggerEvent(_config.EVENTS.SHOW, {
                'reason': 'BEFORE_SUBMIT_SURVEY//postChatSurvey -->  closing thank you window and showing panel '
              });
              // showVaPanel();
              closeThankyouWindow();
            }
            return options;
          }
        });
      } else if (_waitForHooksCounter > 10) {
        console.log('--> LivePerson :: cancelling loop to use lpTag.hooks after 2 seconds trying...survey close events will not capture all use cases as a result!', _waitForHooksCounter);
        clearInterval(_waitForHooks); // stop looping for hooks after 2 seconds
      }
    }, 200);
  }

  function bindToChatEvents() {
    
    // make sure the function and objects exist
    if (lpTag && lpTag.events && lpTag.events.bind) {
      console.log('// -> bindToChatEvents ...');
      lpTag.events.bind('lpUnifiedWindow', 'state', function (e, d) {
        /* 
        lpUnifiedWindow/state 
          tracks the state of the window itself
          possible values from e.state object:
          init / initialised / waiting / chatting / interactive / resume
       */

        console.log('--> LivePerson Chat Window Event Detected: state == ', e.state);
        if (e.state == 'preChat' || e.state == 'waiting' || e.state == 'resume' || e.state == 'interactive'|| e.state == 'postChat') {
          _triggerEvent(_config.EVENTS.HIDE, {
            'reason': 'lpUnifiedWindow State = '+e.state
          });
          // hideVaPanel();
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
        console.log('--> LivePerson conversationInfo event : ', eventData.state);

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
          console.log('LivePerson --> ', eventData.state, ' event fired means post chat survey has been submitted');
          closeThankyouWindow();
          _triggerEvent(_config.EVENTS.SHOW, {
            'reason': 'lpUnifiedWindow conversationInfo  ' + eventData.state + ' event fired = post chat survey has been submitted'
          });
          // showVaPanel();
        }

        if (eventData.state == 'ended') {
          checkWindowStatus();
        }

      });

      lpTag.events.bind('LP_OFFERS', 'OFFER_IMPRESSION', checkIfButtonImpressionIsForVaPanel);

      // custom event to react to when other parts of the code detect the button loaded on the page is for the VA Panel
      lpTag.events.bind(_config.EVENT_NAMESPACE, _config.EVENTS.BUTTON_IMPRESSION, showTheLivePersonButtonInsideVaPanel);

    }

  }

  function triggerChatButtonClick(faqHistorySoFar) {
    console.log('LivePerson --> triggerChatButtonClick ... this function will grab the FAQ conversation lines and feed them to the chat window and then click the hidden button using the rendererStub API');
    // DOCS: https://developers.liveperson.com/trigger-click.html
    var clicked;

    if (lpTag && lpTag.taglets && lpTag.taglets.rendererStub) {
      if (_config.SEND_FAQ_CONVERSATION_AS_PRECHAT_LINES && faqHistorySoFar.length > 0) {
        console.log('LivePerson --> _config.SEND_FAQ_CONVERSATION_AS_PRECHAT_LINES && faqHistorySoFar ', _config.SEND_FAQ_CONVERSATION_AS_PRECHAT_LINES,faqHistorySoFar);
        // grab FAQ lines...this POC just gets the HTML content from specific class elements...you will use your own API and functions to get this information from the chat in progress.
        // var preChatLinesArray = addPreChatLinesToChat();
        var preChatLinesIntroMessages = getPreChatLinesIntroMessages();
        var preChatLinesArray = [];
        if(preChatLinesIntroMessages) {
          preChatLinesArray.push(preChatLinesIntroMessages);
        } else if (preChatLinesIntroMessages === false) {
          // we could not find a cart item which matched a supported language in our translation list, therefore we do not have any intro messages to add to the conversation
          console.log('--> LivePerson : we could not find a cart item which matched a supported language in our translation list for intro messages = none added!');
        }
        preChatLinesArray = preChatLinesArray.concat(faqHistorySoFar);
        // if preChatLinesContent.length > 0 then we have been supplied with faq history so far.
        console.log('--> LivePerson // preChatLinesArray => ',preChatLinesArray);
        // UPDATE : DO NOT SEND preChatLines if empty! otherwise this will cause the 400 bad request error in the chat window
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

  function getCurrentCountrySelection(){

  }

  function isSupportedLanguage(lang) {
    var supportedLanguage = false;
    if(_supportedLanguages.indexOf(lang) > -1) {
      supportedLanguage = true;
    }
    return supportedLanguage;
  }

  function getCurrentLanguageSelection(){
    var cartItems = lpTag.sdes.get('cart')[0] || false;
    var foundSupportedLanguage = false;
    var currentLanguageSelection = null;
    if(cartItems && cartItems.products && cartItems.products.length) {
      for (let i = 0; i < cartItems.products.length; i++) {
        const possibleLanguageSelection = cartItems.products[i].product.name || null;
        if(isSupportedLanguage(possibleLanguageSelection)) {
          currentLanguageSelection = possibleLanguageSelection;
          foundSupportedLanguage = true;
          break;
        }
      }
    }
    return currentLanguageSelection;
  }

  function getPreChatLinesIntroTranslation() {
    var language = getCurrentLanguageSelection();
    if(language) {
      return _translations.intro[language];
    } else {
      return false;
    }
  }

  function getPreChatLinesIntroMessages() {
    var preChatLinesIntroMessages = getPreChatLinesIntroTranslation();
    return preChatLinesIntroMessages || false;
  }


  function closeThankyouWindow() {
    var closeBtn = document.querySelector('.lp_close'); // this is the class of the close button

    // if we find it, click to close the thank you screen
    if (closeBtn) {
      closeBtn.click();
      console.log('--> LivePerson :: auto closing the thank you screen');
      _triggerEvent(_config.EVENTS.CLOSE_THANKYOU_WINDOW, {
        'info': 'attempted to close thank you window'
      });
    }
  }


  function checkButtonState() {
    // example of how you can query the lpTag and get the latest button state for a unique button engagement id
    // 1 = online
    // 2 = offline
    // 4 = busy
    var buttonState = 0;
    if (_config.EMBEDDED_BUTTON_INFO && _config.EMBEDDED_BUTTON_INFO.id) {
      var buttonState = lpTag.taglets.rendererStub.getEngagementState(_config.EMBEDDED_BUTTON_INFO.id).state; // use the number you grabbed earlier when the button was loaded inside the panel
      console.log('--> the button id ', _config.EMBEDDED_BUTTON_INFO.id, ' has the state of ', buttonState);
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

  function escalateToChat(conversationSoFar) {
    var preChatLines = conversationSoFar || [];
    var state = checkButtonState();
    // only trigger the click function if the button is ONLINE
    if(state != BUTTON_STATES.ONLINE) {
      return false;
    }

    if(state == BUTTON_STATES.ONLINE) {
      triggerChatButtonClick(conversationSoFar);
    } 
  }


  function _toggleClass(selector, className) {
    var el = document.querySelector(selector);
    if (el.classList) {
      el.classList.toggle(className);
    } else {
      var classes = el.className.split(' ');
      var existingIndex = classes.indexOf(className);

      if (existingIndex >= 0)
        classes.splice(existingIndex, 1);
      else
        classes.push(className);

      el.className = classes.join(' ');
    }
  }

  function _removeClass(selector, className) {
    var el = document.querySelector(selector);

    if (el.classList) {
      el.classList.remove(className);
    }
    else {
      el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ');
    }

  }


  // function togglePanel(selector) {
  //   _toggleClass(selector || _config.VA_PANEL_CONTAINER_SELECTOR, 'on');
  // }
  // function hideVaPanel(panelIdSelector,helpBtnIdSelector) {
  //   // This now allows 2 selectors to be passed in - thus giving the option to override the selectors used to find the panel and help button if required
  //   console.log('--> LivePerson Chat window is open ... hiding NEED HELP panel and button...');
  //   _removeClass(panelIdSelector || _config.VA_PANEL_CONTAINER_SELECTOR,'on');
  //   document.querySelector(helpBtnIdSelector || '#need-help').style.display = 'none';
  // }

  // function showVaPanel(helpBtnIdSelector) {
  //   console.log('--> LivePerson Chat session has ended ... bringing back NEED HELP button...');
  //   document.querySelector(helpBtnIdSelector || '#need-help').style.display = '';
  // }

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
      console.log('--> LivePerson // -> injectButtonContainerId : ',sdes);
      if (lpTag && lpTag.sdes && lpTag.sdes.send) {
        lpTag.sdes.send(sdes);
      } else if (lpTag && lpTag.sdes.push) {
        lpTag.sdes.push(sdes);
      }
      // ^ The above will tell LP that the div now exists and is ready to receive the content - online/offline/busy etc...
    }
  }

  // Reveal public pointers to
  // private functions and properties

  return {
    version:_version,
    start: _init,
    init: _init,
    injectButtonContainer: injectLivePersonEmbeddedButtonContainer,
    escalateToChat: escalateToChat,
    startChat: escalateToChat,
    agentsAreAvailable: agentsAreAvailable,
    agentsAreBusy: agentsAreBusy,
    agentsAreOffline: agentsAreOffline,
    getActiveButton:getActiveButton
  };

})();




// click function for the panel tab
