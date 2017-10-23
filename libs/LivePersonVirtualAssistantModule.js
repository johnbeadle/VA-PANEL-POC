var LivePersonVirtualAssistantModule = (function () {
  var _config = {
    USING_PROXY_BUTTON: true, // setting this to FALSE will tell the code that you are NOT going to be providing your own custom buttons on the page. This will require an accompanying change on the LE2 admin side to insert the HTML of the button content rather than just empty HTML when using this setting set to TRUE
    SEND_LAST_QUESTION_ASKED_INTO_CHAT: true, 
    EMBEDDED_BUTTON_ID_LOADED: null,
    EMBEDDED_BUTTON_TYPE: 5,
    ENGAGEMENT_NAME_SHORTCODE: ':vap:', // this will used to pattern match against the name of the engagements to also check for button matches for VAP specific engagements. #
    EMBEDDED_BUTTON_IDS: [972162932], // These are the unique button ids within our system that correspond to your CLONE/PROD accounts
    // PLEASE NOTE ^^^ you should NOT need to change the array above - I have preconfigured it with your engagement ids for your clone/prod accounts
    EMBEDDED_BUTTON_DIV_CONTAINER_ID: 'lpButtonDiv-need-help-panel',
    WINDOW_CLOSE_BUTTON_CLASS:'lp_close',
    VA_PANEL_EVENT_NAMESPACE: 'VA_PANEL',
    VA_PANEL_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME: 'EMBEDDED_BUTTON_IMPRESSION',
    VA_PANEL_CONTAINER_SELECTOR:'#slideout',
    VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_CLASS: 'faq-chat-line', // replace with whatever class/logic you might use to get the last question/ chat lines. I suspect it will be completely different with the actual AskAndrew and you will call an API to get that data. this is just POC.
    VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_INTRO: 'Your conversation history so far...', //replace with your own message if needed else set to blank or remove this code from the function
    VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_TAGLINE: 'An agent will be with your shortly to continue the discussion...' //replace with your own message if needed else set to blank or remove this code from the function
  };
  /*
Styling and class names used by the POC - may or may not be relevant to how you choose to handle showing or hiding the content 
 */
  var LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS = 'lp-va-panel-button';
  var LP_VISIBLE_ONLINE_BUTTON_CLASS_NAME_LIST = 'btn btn-success ' + LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS;
  var LP_VISIBLE_OFFLINE_BUTTON_CLASS_NAME_LIST = 'btn btn-warning ' + LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS;
  var LP_HIDDEN_BUTTON_CLASS_NAME_LIST = 'btn btn-success hide-lp-button ' + LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS;
  var VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_CLASS = 'faq-chat-line';
  var LP_PROXY_BUTTON_ONLINE_CLASS_NAME = 'lp-va-panel-button-online';
  var LP_PROXY_BUTTON_OFFLINE_CLASS_NAME = 'lp-va-panel-button-offline';

  var BUTTON_STATES = {
    ONLINE:1,
    OFFLINE:2,
    BUSY:4,
    UNKNOWN:0
  };

  var _eventBindingsDone = false;


  function checkIfButtonImpressionIsForVaPanel(e, d) {
    console.log('--> checkIfButtonImpressionIsForVaPanel // ', e.state, e.engagementId,e.engagementName);
    
    /* 
     This event fires every time a button is displayed on the page
     You will need to check the e.engagementType value to see what type it is.
     5 = embedded but there may be more than one embedded button on some pages that are NOT va panel related.
     otherwise the engagementName property may give some indication if named correctly on the liveperson side.
    */
    // check if the type is embedded (5) AND the id matches the array constant of all ids on both accounts DEV/PROD
    // .match(/:vap:/g);
    var _regexCheckEngagementName = new RegExp(_config.ENGAGEMENT_NAME_SHORTCODE,'g');
    if (e.engagementType == _config.EMBEDDED_BUTTON_TYPE && ( _config.EMBEDDED_BUTTON_IDS.indexOf(e.engagementId) > -1 || _regexCheckEngagementName.test(e.engagementName) ) )
    {
      // means embedded button and the unique id the button matches the specific buttons we have configured with the LE2 system to be shown within the VA panel
      // LP_VA_PANEL_EMBEDDED_BUTTON_IDS[] array contains the expected/allowed values
      _config.EMBEDDED_BUTTON_ID_LOADED = e.engagementId; // store the value so we can use it later when we need to query the button state later in the process for an accurate value - this is in case the refresh timer has changed the state from online/offline and vice versa
      console.log('--> checkIfButtonImpressionIsForVaPanel // passed validation -> is a VA Panel related engagement => ', e.state, e.engagementId,e.engagementName);
      
      // trigger a custom event using the lpTag.events bridge to notify other parts of the code that we have successfull loaded the embedded button for VA panel
      lpTag.events.trigger(_config.VA_PANEL_EVENT_NAMESPACE, _config.VA_PANEL_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME, {
        id: e.engagementId,
        name: e.engagementName,
        cid: e.campaignId,
        state: e.state
      });
    } else {
      console.log('--> checkIfButtonImpressionIsForVaPanel // IGNORING => NOT a VA Panel related engagement / button event => ', e.state, e.engagementId,e.engagementName);
    }
  }

  function hideLivePersonButtonContainers() {
    // ...check the state to determine which custom HTML code for our own button should be shown?
    var lpButtons = document.getElementsByClassName(LP_EXAMPLE_VA_PANEL_CSS_CLASS_NAME_FOR_MARKING_ELEMENTS);
    console.log('--> hiding buttons // ', lpButtons);
    for (var i = 0; i < lpButtons.length; i++) {
      var lpButton = lpButtons[i];
      lpButton.className = LP_HIDDEN_BUTTON_CLASS_NAME_LIST; // apply static list of class names to hide the button -- replace with however you choose to do this in the panel
    }
  }

  function refreshProxyButtonStatus(state) {
    // this demos how you can control the content of both the online and offline button HTML elements
    // because you will be "fake" clicking the actual LivePerson button hidden on the page with no content, you can display your own responsive buttons and HTML and then control the click function, pass the chat lines and trigger the chat start.
    // this section of code just checks the state of the va panel embedded button from LP and allows to choose which one to show
    // this is because the design agreed allows shows the button at the bottom of the panel - there is NOT an escalation button to reveal it
    if (state === 1) {
      console.log('--> button is online, show that custom button html element which you can control in the panel');
      document.getElementById(LP_PROXY_BUTTON_ONLINE_CLASS_NAME).classList = LP_VISIBLE_ONLINE_BUTTON_CLASS_NAME_LIST;
    } else if (state === 2) {
      console.log('--> button is offline, show that custom button html element which you can control in the panel');
      document.getElementById(LP_PROXY_BUTTON_OFFLINE_CLASS_NAME).classList = LP_VISIBLE_OFFLINE_BUTTON_CLASS_NAME_LIST;
    }
  }

  function showTheLivePersonButtonInsideVaPanel(eventData) {
    // the hidden empty HTML button inside the va panel has been loaded
    console.log('--> event fired ', _config.VA_PANEL_EVENT_NAMESPACE, '/', _config.VA_PANEL_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME, eventData);
    // as this could happen many times for button on refresh rates, we should always hide both buttons by default and then reshow the relevant one...
    if (_config.USING_PROXY_BUTTON) {
      hideLivePersonButtonContainers();
      refreshProxyButtonStatus(eventData.state);
    }

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

  function lpPanelInit() {
    // bind to the window
    if (lpTag && lpTag.events && lpTag.events.hasFired) {
      // events.hasFired exists - check if the lpTag window is already on the page before we got here?
      // if we find any events, we should hide the panel
      var _windowEvents = lpTag.events.hasFired('lpUnifiedWindow', 'state');
      if (chatWindowIsActive()) {
        hideVaPanel();
      }
    }
    //still call bindToChatEvents so we listen for other events that may still fire.
    if(_eventBindingsDone === false) {
      bindToChatEvents();
      _eventBindingsDone = true;      
    } else {
      console.log('// -> eventBindings already enabled...skipping');
    }

  }

  // workaround for #CMBWSUAT-31
  function checkWindowStatus(element) {
    var lpChatWindowEvents = lpTag.events.hasFired('lpUnifiedWindow', 'conversationInfo');
    console.log('-> chat window events when clicking close button', lpChatWindowEvents);

    var lastEvent = lpChatWindowEvents.pop();
    if (lastEvent.data.state == 'preChat' || lastEvent.data.state == 'waiting') {
      // visitor abandonded without submitted survey or connecting to agent...show panel
      console.log('-> lastEvent ', lastEvent.data.state);
      console.log('-> visitor abandonded without submitted survey or connecting to agent...show panel');
      showVaPanel();
    }
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
        if (e.state == 'preChat' || e.state == 'waiting' || e.state == 'resume' || e.state == 'interactive') {
          hideVaPanel();
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
        if (eventData.state == 'preChat') {
          // when the prechat survey is shown attach a click event listener to the close button of the window.
          // if this is clicked the checkWindowStatus function is then called to see if the survey was completed or not.
          var matches = document.getElementsByClassName(_config.WINDOW_CLOSE_BUTTON_CLASS);
          for (var i = 0; i < matches.length; i++) {
            matches[i].addEventListener('click', checkWindowStatus, true);
          }

        }

        // if the post chat exit survey has been submitted then auto close the thank you window
        if (eventData.state == 'applicationEnded') {
          console.log('--> ', eventData.state, ' event fired means post chat survey has been submitted');
          closeThankyouWindow();
          showVaPanel();
        }
        // NOTE: if the chat configuration of the LivePerson Campaign does NOT have an exit survey attached, this event will NOT fire
        // Instead you should trigger this code on the "ended" event instead.
        if (eventData.state == 'ended') {
          console.log('--> ', eventData.state, ' event fired means post chat survey has been submitted');
          // only use this conditional if you DO NOT have a post chat exit survey configured
          // you would put the same code as above to close the thank you screen
          closeThankyouWindow();
          showVaPanel();
        }

      });

      lpTag.events.bind('LP_OFFERS', 'OFFER_IMPRESSION', checkIfButtonImpressionIsForVaPanel);

      // custom event to react to when other parts of the code detect the button loaded on the page is for the VA Panel
      lpTag.events.bind(_config.VA_PANEL_EVENT_NAMESPACE, _config.VA_PANEL_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME, showTheLivePersonButtonInsideVaPanel);

    }

  }

  function triggerChatButtonClick() {
    console.log('--> triggerChatButtonClick ... this function will grab the FAQ conversation lines and feed them to the chat window and then click the hidden button using the rendererStub API');
    // DOCS: https://developers.liveperson.com/trigger-click.html
    var clicked;

    if (lpTag && lpTag.taglets && lpTag.taglets.rendererStub) {
      if (_config.SEND_LAST_QUESTION_ASKED_INTO_CHAT) {
        // grab FAQ lines...this POC just gets the HTML content from specific class elements...you will use your own API and functions to get this information from the chat in progress.
        var preChatLinesArray = addPreChatLinesToChat();
        // UPDATE : DO NOT SEND preChatLines if empty! otherwise this will cause the 400 bad request error
        if (preChatLinesArray.length > 0) {
          clicked = lpTag.taglets.rendererStub.click(_config.EMBEDDED_BUTTON_ID_LOADED, {
            preChatLines: preChatLinesArray
          });
        } else {
          clicked = lpTag.taglets.rendererStub.click(_config.EMBEDDED_BUTTON_ID_LOADED); // this will open the chat window
        }

      } else {
        clicked = lpTag.taglets.rendererStub.click(_config.EMBEDDED_BUTTON_ID_LOADED); // this will open the chat window
      }

    }
  }

  function addPreChatLinesToChat() {
    // replace logic with however you get the last question/chat history from AskAndrew session and return an array of strings to feed into the chat window.
    var faqLines = document.getElementsByClassName(_config.VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_CLASS);
    var preChatLinesArray = [_config.VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_INTRO]; // add a message to give context to the chat lines
    for (var f = 0; f < faqLines.length; f++) {
      var faqChatLine = faqLines[f].innerHTML;
      preChatLinesArray.push(faqChatLine);
    }
    preChatLinesArray.push(_config.VIRTUAL_ASSISTANT_CONVERSATION_CHAT_LINES_TAGLINE); // add a message at the end to tell the customer what will happen next
    console.log('--> preChatLinesArray : ', preChatLinesArray);

    return preChatLinesArray;
  }

  function closeThankyouWindow() {
    var closeBtn = document.querySelector('.lp_close'); // this is the class of the close button

    // if we find it, click to close the thank you screen
    if (closeBtn) {
      closeBtn.click();
      console.log('--> auto closing the thank you screen');

    }
  }

  function _toggleClass(selector,className) {
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

  function togglePanel(selector) {
    // $(selector || _config.VA_PANEL_CONTAINER_SELECTOR).toggleClass('on');
    // $(selector || _config.VA_PANEL_CONTAINER_SELECTOR).toggleClass('on');
    _toggleClass(selector|| _config.VA_PANEL_CONTAINER_SELECTOR,'on');
  }

  function checkButtonState() {
    // example of how you can query the lpTag and get the latest button state for a unique button engagement id
    // 1 = online
    // 2 = offline
    // 4 = busy
    var buttonState = 0;
    if (_config.EMBEDDED_BUTTON_ID_LOADED) {
      var buttonState = lpTag.taglets.rendererStub.getEngagementState(_config.EMBEDDED_BUTTON_ID_LOADED).state; // use the number you grabbed earlier when the button was loaded inside the panel
      console.log('--> the button id ', _config.EMBEDDED_BUTTON_ID_LOADED, ' has the state of ', buttonState);
    }
    return buttonState;
  }

  function agentsAreAvailable() {
    return checkButtonState() == BUTTON_STATES.ONLINE ? true : false;
  }

  function escalateToChat() {
    var state = checkButtonState();
    if(state != BUTTON_STATES.ONLINE) {
      return false;
    }

    if(state == BUTTON_STATES.ONLINE) {
      triggerChatButtonClick();
    } 
  }
  function hideVaPanel(panelIdSelector,helpBtnIdSelector) {
    console.log('--> LivePerson Chat window is open ... hiding NEED HELP panel and button...');
    // $(panelIdSelector || _config.VA_PANEL_CONTAINER_SELECTOR).removeClass('on');
    _removeClass(panelIdSelector || _config.VA_PANEL_CONTAINER_SELECTOR,'on');
    document.querySelector(helpBtnIdSelector || '#need-help').style.display = 'none';
    // $(helpBtnIdSelector || '#need-help').hide();
  }

  function showVaPanel(helpBtnIdSelector) {
    console.log('--> LivePerson Chat session has ended ... bringing back NEED HELP button...');
    // $(helpBtnIdSelector || '#need-help').show();
    document.querySelector(helpBtnIdSelector || '#need-help').style.display = '';
    
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
      console.log('// -> injectButtonContainerId : ',sdes);
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
    start: lpPanelInit,
    injectButtonContainer: injectLivePersonEmbeddedButtonContainer,
    escalateToChat: escalateToChat,
    agentsAreAvailable: agentsAreAvailable
  };

})();




// click function for the panel tab
