// var assert = require('assert');
// var chai = require('chai');
// var module = require('../libs/LivePersonVirtualAssistantModule.js');
// var should = chai.should();
// var expect = require('chai').expect;

describe('LivePersonVirtualAssistantModule tests', () => {
  const MODULE_EVENT_NAMESPACE = 'LP_VA_PANEL_MODULE';
  const LP_UNIFIED_WINDOW_EVENT_NAMESPACE = 'lpUnifiedWindow';
  const LP_OFFERS_EVENT_NAMESPACE = 'LP_OFFERS';
  var spy = sinon.spy();
  sandbox = sinon.sandbox.create();
  var bindCallback = sinon.stub(); // used for stubbing all lpTag.events.bind calls
  var getEngagementStateCallback = sinon.stub(); // used for stubbing all lpTag.taglets.rendererStub.getEngagementState calls
  var rendererStubCallback = sinon.stub(); // used for stubbing all lpTag.events.rendererStub calls
  var triggerCallback = sinon.stub(); // used for stubbing all lpTag.events.trigger calls
  var hasFiredCallback = sinon.stub(); // used for stubbing all lpTag.events.hasFired calls
  var sdesGetCallback = sinon.stub(); // lpTag.sdes.get(type) stub
  sdesGetCallback.withArgs('get').returns(true);

  var appendChildStub = sinon.stub(document, 'appendChild').returns(true);
  var getElementByIdStub = sinon.stub(document, 'getElementById');
  getElementByIdStub.withArgs('button-container').returns({
    'appendChild': appendChildStub
  });
  var moduleCallbacks = [];
  var clock;
  // generic handler for all lpTag.bind event calls when invoked with specific arguments to the sinon stub
  var bindCallbackHandler = function(namespace,evName,callback) {
    console.log('@bindCallback withArgs ', namespace, evName, callback);
    // console.log('@bindCallback withArgs --> saving to moduleCallbacks[] @ ', namespace + ':' + evName);
    moduleCallbacks[namespace + ':' + evName] = callback;
    // console.log('@bindCallback moduleCallbacks/', namespace + ':' + evName, moduleCallbacks[namespace + ':' + evName]);
    return true;
  };

  var sdesCallbackHandler = function(type) {
    var cartItems = [
      {
        products: [
          {
            product : {
              name: 'en'
            }
          }
        ]
      }
    ];

    var data = [];

    switch (type) {
    case 'cart':
      data = cartItems;
      break;
    
    default:
      break;
    }
    return data;
  };
  
  var getEngagementStateCallbackHandler = function(buttonId) {
    console.log('@getEngagementStateCallbackHandler withArgs => ', buttonId);
    
    var fakeButtonState = 0;
    switch (buttonId) {
    case 'forceOnlineState':
      fakeButtonState = 1;
      break;
    case 'forceOfflineState':
      fakeButtonState = 2;
      break;
    case 'forceBusyState':
      fakeButtonState = 4;
      break;
    default:
      fakeButtonState = 1;
      break;
    }
    console.log('@getEngagementStateCallbackHandler returning state =>  ', fakeButtonState);

    return {
      state: fakeButtonState
    };
  };

  var triggerCallbackHandler = function (namespace, evName, data) {
    console.log('@triggerCallback invoked --> ', namespace, evName, data);
    var callback = moduleCallbacks[namespace + ':' + evName] || false;
    if (callback) {
      callback(data);
      console.log('@triggerCallback --> firing stored callback with data ', callback, data);
    }
    return true;
  }; 

  // ToDo 
  // stub document.getElementsByClassName
  // should return object with stubbed .addEventListener function

  // stub document.querySelector for closeBtn

  before(() => {
    module = LivePersonVirtualAssistantModule;
    expect = chai.expect;
    should = chai.should();
    
  });
  afterEach(() => {
    clock.restore();
    module.reset();
  });
  beforeEach(() => {
    hasFiredCallback.reset();
    sdesGetCallback.reset();
    bindCallback.reset();
    triggerCallback.reset();
    getEngagementStateCallback.reset();
    clock = sinon.useFakeTimers({
      now: Date.now(),
      shouldAdvanceTime: true
    }); // fake setTimeout and setInterval used by the modue

    /* define the matching arguments for the hasFired stub and how they should be returned */
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo').returns(false);
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'state').returns(false);
    hasFiredCallback.withArgs(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION').returns(false);
    hasFiredCallback.withArgs(MODULE_EVENT_NAMESPACE, 'EMBEDDED_BUTTON_IMPRESSION').returns(false);

    /* define the matching arguments passed into the .bind stub which then map to the generic bindCallbackHandler method */
    bindCallback.withArgs(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION').callsFake(bindCallbackHandler);
    bindCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE).callsFake(bindCallbackHandler);
    bindCallback.withArgs(MODULE_EVENT_NAMESPACE).callsFake(bindCallbackHandler);

    /* define the matching arguments passed into the .trigger stub which then map to the generic triggerCallbackHandler method */
    triggerCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE).callsFake(triggerCallbackHandler);
    triggerCallback.withArgs(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION').callsFake(triggerCallbackHandler);

    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE).callsFake(triggerCallbackHandler); // this sets up generic handler for all MODULE_EVENT_NAMESPACE events on the .trigger stub to pass through into the triggerCallbackHandler

    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_BUTTON_CONTENT').returns(true); // however here we override this behaviour for specific, verbose event args to define unique return behaviour...in this case the SHOULD_SHOW_BUTTON_CONTENT should return true regardless.

    /* 
      we then change the behaviour to capture and log when SHOULD_HIDE_VA_PANEL and SHOULD_SHOW_VA_PANEL are called.
    */
    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE, 'SHOULD_HIDE_VA_PANEL').callsFake(function (namespace, evName, data) {
      console.log('@triggerCallback SHOULD_HIDE_VA_PANEL withArgs => ', namespace, evName, data);
      return true;
    });
    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL').callsFake(function (namespace, evName, data) {
      console.log('@triggerCallback SHOULD_SHOW_VA_PANEL withArgs => ', namespace, evName, data);
      return true;
    });
    /* 
      stub the lpTag object and properties as required
    */
    lpTag = {};
    lpTag.events = {
      'bind': bindCallback.returns(true),
      'trigger': triggerCallback,
      'hasFired': hasFiredCallback
    };
    lpTag.sdes = {
      'get': sdesCallbackHandler,
      'send': sinon.stub(),
      'push': sinon.stub()
    };

    lpTag.taglets = {
      'rendererStub': {
        'click': sinon.stub(),
        'getEngagementState': getEngagementStateCallbackHandler
      }
    };


    lpTag.hooks = {
      'push': sinon.stub()
    };

  });
  it('check exposed functions', () => {
    
    // console.log(LivePersonVirtualAssistantModule);
    module.should.be.a('Object'); 
    module.startChat.should.be.a('function'); 
    module.reset.should.be.a('function'); 
    module.agentsAreAvailable.should.be.a('function'); 
    module.agentsAreBusy.should.be.a('function'); 
    module.agentsAreOffline.should.be.a('function'); 
    module.getActiveButton.should.be.a('function'); 
    module.getEventLog.should.be.a('function'); 
  });
  it('should start and bind events', () => {
    
    // ********************************** START THE MODULE ******************************** //
    module.init(); // starts the module
    // *********************************************************************************** //

    clock.runAll(); // enable the fake timers to run as normal
    // console.log('lpTag.hooks.push.firstCall.args[0].name ==> ',lpTag.hooks.push.firstCall.args[0].name);

    // cache hooks callback function for manual trigger later on
    var hooksModuleCallback = lpTag.hooks.push.firstCall.args[0].callback;
    console.log('1 --> hooksModuleCallback ==> ', hooksModuleCallback);

    expect(lpTag.hooks.push.firstCall.args[0].name).to.equal('BEFORE_SUBMIT_SURVEY'); // checks the hooks have been added to the correct event

    expect(lpTag.events.bind.called).to.equal(true);
    expect(lpTag.events.hasFired.called).to.equal(true);

    expect(lpTag.events.bind.calledWith(LP_UNIFIED_WINDOW_EVENT_NAMESPACE,'state')).to.equal(true);
    expect(lpTag.events.bind.calledWith(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo')).to.equal(true);
    expect(lpTag.events.bind.calledWith(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION')).to.equal(true);
    expect(lpTag.events.bind.calledWith(MODULE_EVENT_NAMESPACE, 'EMBEDDED_BUTTON_IMPRESSION')).to.equal(true);

    expect(lpTag.events.hasFired.calledWith(LP_UNIFIED_WINDOW_EVENT_NAMESPACE,'state')).to.equal(true);
    expect(lpTag.events.hasFired.calledWith(LP_UNIFIED_WINDOW_EVENT_NAMESPACE,'conversationInfo')).to.equal(false); // not called during .start --> only when checking window status during active chat
    expect(lpTag.events.trigger.calledWith(MODULE_EVENT_NAMESPACE,'EMBEDDED_BUTTON_IMPRESSION')).to.equal(false);
    module.injectButtonContainer(); // typically called once the containing panel has been revealed. This will create the DIV container for the incoming embedded button.
    var eventData = {
      engagementId: '1234',
      engagementType:5,
      engagementName: ':vap: test button',
      campaignId: '5678',
      state: 1
    };
    lpTag.events.trigger(LP_OFFERS_EVENT_NAMESPACE,'OFFER_IMPRESSION',eventData); // mimics the button impression event
    expect(lpTag.events.trigger.calledWith(MODULE_EVENT_NAMESPACE, 'EMBEDDED_BUTTON_IMPRESSION')).to.equal(true); // now that button impression event has been faked, this internal event within the module should now have been triggered.
    expect(lpTag.events.trigger.calledWith(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION')).to.equal(true);
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_BUTTON_CONTENT')).to.equal(true); // based on the eventData object this should have triggered this event within the module

    module.startChat([
      'line1',
      'line2'
    ]);
    /* trigger chat button click function to start  */

    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE,'state',{
      state:'preChat'
    });

    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_HIDE_VA_PANEL')).to.equal(true);
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(false);

    /* 
    NOTE: below we are changing the fake stub for this specific combination of hasFiredCallback mid test to fit with the flow of responses we would have from lpTag object in the real world.
    */
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo').callsFake(function(namespace,event){
      console.log('@hasFiredCallback => namespace / event inputs // ',namespace,event);
      var eventLog = [
        {
          data : {
            state: 'chatting'
          }
        },
        {
          data : {
            state: 'ended'
          }
        }
      ];
      console.log('@hasFiredCallback returning eventLogs for conversationInfo : ',eventLog);
      return eventLog;

    });

    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'postChat'
    });
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(false);
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'ended'
    });
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'applicationEnded'
    });
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(true);

  });
  it('should fire the HIDE event if the window is already open when the module starts', () => {
    /* 
      Fake loading the chat window for chat in progress on page refresh
    */
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'state', {
      state: 'initialising'
    });
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'state', {
      state: 'interactive'
    });
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'state', {
      state: 'resume'
    });

    // ********************************** START THE MODULE ******************************** //
    module.init(); // starts the module
    clock.runAll(); // enable the fake timers to run as normal
    // *********************************************************************************** //
    var hooksModuleCallback = lpTag.hooks.push.firstCall.args[0].callback;
    console.log('2 --> hooksModuleCallback ==> ', hooksModuleCallback);
   
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(false);
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_HIDE_VA_PANEL')).to.equal(true);
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo').callsFake(function (namespace, event) {
      console.log('@hasFiredCallback => namespace / event inputs // ', namespace, event);
      var eventLog = [
        {
          data: {
            state: 'chatting'
          }
        },
        {
          data: {
            state: 'ended'
          }
        }
      ];
      console.log('@hasFiredCallback returning eventLogs for conversationInfo : ', eventLog);
      return eventLog;

    });

    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'postChat'
    });
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(false);

    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'applicationEnded'
    });
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(true);
  });

  it('should fire the hooks callback after prechat survey submission', () => {
    // ********************************** START THE MODULE ******************************** //
    module.init(); // starts the module
    // *********************************************************************************** //

    clock.runAll(); // enable the fake timers to run as normal
    var hooksModuleCallback = lpTag.hooks.push.firstCall.args[0].callback;
    console.log('3 --> hooksModuleCallback ==> ', hooksModuleCallback);

    expect(lpTag.hooks.push.firstCall.args[0].name).to.equal('BEFORE_SUBMIT_SURVEY'); // checks the hooks have been added to the correct event
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'preChat'
    });
    // lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
    //   state: 'ended'
    // });
    hooksModuleCallback({
      data: {
        surveyType: 'preChatSurvey',
        surveyData: null
      }
    });
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(true);
    
    var lastCall = triggerCallback.lastCall;
    var lastCallEventData = lastCall.args[2] || null;
    console.log('triggerCallback lastCallEventData', lastCallEventData);
    expect(lastCallEventData['options.data.surveyType']).to.equal('preChatSurvey');
    expect(lastCallEventData['options.data.surveyData']).to.equal(null);
    expect(lastCallEventData['reason']).to.equal('BEFORE_SUBMIT_SURVEY // preChatSurvey / no surveyData so closing thank you window and showing panel');
  });
  it('should fire the SHOW event after postchat survey submission', () => {
    // ********************************** START THE MODULE ******************************** //
    module.init(); // starts the module
    // *********************************************************************************** //

    clock.runAll(); // enable the fake timers to run as normal
    var hooksModuleCallback = lpTag.hooks.push.firstCall.args[0].callback;
    console.log('3 --> hooksModuleCallback ==> ', hooksModuleCallback);

    expect(lpTag.hooks.push.firstCall.args[0].name).to.equal('BEFORE_SUBMIT_SURVEY'); // checks the hooks have been added to the correct event
    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo', {
      state: 'applicationEnded'
    });
    hooksModuleCallback({
      data: {
        surveyType: 'postChatSurvey',
        surveyData: true
      }
    });
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(true);
    
    var lastCall = triggerCallback.lastCall;
    var lastCallEventData = lastCall.args[2] || null;
    console.log('triggerCallback lastCallEventData', lastCallEventData);
    expect(lastCallEventData['options.data.surveyType']).to.equal('postChatSurvey');
    expect(lastCallEventData['options.data.surveyData']).to.equal(true);
    expect(lastCallEventData['reason']).to.equal('BEFORE_SUBMIT_SURVEY // postChatSurvey / closing thank you window and showing panel');
  });
  it('should return correct states for the active button after it is shown / changes', () => {
    // init module
    // ********************************** START THE MODULE ******************************** //
    module.init(); // starts the module
    // *********************************************************************************** //

    clock.runAll(); // enable the fake timers to run as normal
    // return null before button impression
    // console.log(module.getActiveButton());
    expect(module.agentsAreAvailable()).to.equal(false);
    expect(module.agentsAreBusy()).to.equal(false);
    expect(module.agentsAreOffline()).to.equal(false);

    expect(module.getActiveButton()).to.equal(null);
    // fake button impression with ONLINE
    var eventData = {
      engagementId: 'forceOnlineState',
      engagementType: 5,
      engagementName: ':vap: test button 2',
      campaignId: '8888',
      state: 1
    };
    lpTag.events.trigger(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION', eventData); // mimics the button impression event
    // check state function responses
    expect(module.agentsAreAvailable()).to.equal(true);
    expect(module.agentsAreBusy()).to.equal(false);
    expect(module.agentsAreOffline()).to.equal(false);
    var activeBtn = module.getActiveButton();
    console.log('activebtn => ',activeBtn);
    expect(activeBtn).should.be.a('Object');
    expect(activeBtn.id).to.equal(eventData.engagementId);
    expect(activeBtn.state).to.equal(eventData.state);
    expect(activeBtn.cid).to.equal(eventData.campaignId);
    expect(activeBtn.name).to.equal(eventData.engagementName);

    // fake with OFFLINE and repeat
    var eventData = {
      engagementId: 'forceOfflineState',
      engagementType: 5,
      engagementName: ':vap: test button 2',
      campaignId: '8888',
      state: 2
    };
    lpTag.events.trigger(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION', eventData); // mimics the button impression event
    // check state function responses
    expect(module.agentsAreAvailable()).to.equal(false);
    expect(module.agentsAreBusy()).to.equal(false);
    expect(module.agentsAreOffline()).to.equal(true);

    var activeBtn = module.getActiveButton();
    console.log('activebtn => ', activeBtn);
    expect(activeBtn).should.be.a('Object');
    expect(activeBtn.id).to.equal(eventData.engagementId);
    expect(activeBtn.state).to.equal(eventData.state);
    expect(activeBtn.cid).to.equal(eventData.campaignId);
    expect(activeBtn.name).to.equal(eventData.engagementName);

    // fake with BUSY and repeat.
    var eventData = {
      engagementId: 'forceBusyState',
      engagementType: 5,
      engagementName: ':vap: test button 2',
      campaignId: '8888',
      state: 4
    };
    lpTag.events.trigger(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION', eventData); // mimics the button impression event
    // check state function responses
    expect(module.agentsAreAvailable()).to.equal(false);
    expect(module.agentsAreBusy()).to.equal(true);
    expect(module.agentsAreOffline()).to.equal(false);

    var activeBtn = module.getActiveButton();
    console.log('activebtn => ', activeBtn);
    expect(activeBtn).should.be.a('Object');
    expect(activeBtn.id).to.equal(eventData.engagementId);
    expect(activeBtn.state).to.equal(eventData.state);
    expect(activeBtn.cid).to.equal(eventData.campaignId);
    expect(activeBtn.name).to.equal(eventData.engagementName);
  });
  it('should return an accurate event log', () => {
    // empty before init
    expect(module.getEventLog().length).to.equal(0);
    // ********************************** START THE MODULE ******************************** //
    module.init(); // starts the module
    // *********************************************************************************** //

    clock.runAll(); // enable the fake timers to run as normal
    console.log(module.getEventLog());
    var events = module.getEventLog();
    expect(events.length).to.equal(1);
    expect(events[0].name).to.equal('bindToChatEvents');
    var eventData = {
      engagementId: '9999',
      engagementType: 5,
      engagementName: ':vap: test button 999',
      campaignId: '8888',
      state: 1
    };
    lpTag.events.trigger(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION', eventData); // mimics the button impression event
    // check state function responses
    console.log(module.getEventLog());
    events = module.getEventLog();
    expect(events.length).to.equal(3);
    events.forEach(event => {
      console.log(event.name);
    });
    expect(events[1].name).to.equal('SHOULD_SHOW_BUTTON_CONTENT');
    expect(events[2].name).to.equal('EMBEDDED_BUTTON_IMPRESSION');

  });
  it('should trigger the HIDE event if the window is active when the module starts', () => {
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'state').returns([0,1,2,3]);
    module.init();
    clock.runAll(); // enable the fake timers to run as normal
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_HIDE_VA_PANEL')).to.equal(true);
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(false);
  });
  it('should only bindToChatEvents once - regardless how many .init calls are made', () => {
    
    module.init();
    expect(lpTag.events.bind.calledWith(MODULE_EVENT_NAMESPACE, 'EMBEDDED_BUTTON_IMPRESSION')).to.equal(true);
    var events = module.getEventLog();
    expect(events.length).to.equal(1);
    expect(events[0].name).to.equal('bindToChatEvents');
    // console.log('------------');
    module.init();
    events = module.getEventLog();
    // console.log('------------',events);
    expect(events.length).to.equal(2);
    expect(events[1].name).to.equal('EVENT_BINDINGS_DONE');
  });
});