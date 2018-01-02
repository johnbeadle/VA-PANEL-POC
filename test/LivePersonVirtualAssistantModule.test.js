// var assert = require('assert');
// var chai = require('chai');
// var module = require('../libs/LivePersonVirtualAssistantModule.js');
// var should = chai.should();
// var expect = require('chai').expect;
// console.log(module);
describe('LivePersonVirtualAssistantModule tests', () => {
  const MODULE_EVENT_NAMESPACE = 'LP_VA_PANEL_MODULE';
  const LP_UNIFIED_WINDOW_EVENT_NAMESPACE = 'lpUnifiedWindow';
  const LP_OFFERS_EVENT_NAMESPACE = 'LP_OFFERS';
  var spy = sinon.spy();
  sandbox = sinon.sandbox.create();
  var bindCallback = sinon.stub();
  var triggerCallback = sinon.stub();
  var hasFiredCallback = sinon.stub();
  var sdesGetCallback = sinon.stub();
  sdesGetCallback.withArgs('get').returns(true);

  var appendChildStub = sinon.stub(document, 'appendChild').returns(true);
  var getElementByIdStub = sinon.stub(document, 'getElementById');
  getElementByIdStub.withArgs('button-container').returns({
    'appendChild': appendChildStub
  });
  var moduleCallbacks = [];

  var bindCallbackHandler = function(namespace,evName,callback) {
    console.log('@bindCallback withArgs ', namespace, evName, callback);
    // console.log('@bindCallback withArgs --> saving to moduleCallbacks[] @ ', namespace + ':' + evName);
    moduleCallbacks[namespace + ':' + evName] = callback;
    // console.log('@bindCallback moduleCallbacks/', namespace + ':' + evName, moduleCallbacks[namespace + ':' + evName]);
    return true;
  };

  var triggerCallbackHandler = function (namespace, evName, data) {
    console.log('@triggerCallback invoked --> ', namespace, evName, data);

    var callback = moduleCallbacks[namespace + ':' + evName] || false;
    // console.log('@triggerCallback moduleCallbacks/', namespace + ':' + evName, moduleCallbacks[namespace + ':' + evName]);
    // console.log('@triggerCallback callback ', callback);
    if (callback) {
      callback(data);
      console.log('@triggerCallback --> firing stored callback with data ', callback, data);
    }
    return true;
  }; 

  before(() => {
    module = LivePersonVirtualAssistantModule;
    expect = chai.expect;
    should = chai.should();
    
  });
  beforeEach(() => {
    hasFiredCallback.reset();
    sdesGetCallback.reset();
    bindCallback.reset();
    triggerCallback.reset();
    // this.clock.restore();

  });
  it('check exposed functions', () => {
    
    // console.log(LivePersonVirtualAssistantModule);
    module.should.be.a('Object'); 
    module.start.should.be.a('function'); 
    module.init.should.be.a('function'); 
    module.injectButtonContainer.should.be.a('function'); 
    module.escalateToChat.should.be.a('function'); 
    module.startChat.should.be.a('function'); 
    module.agentsAreAvailable.should.be.a('function'); 
    module.agentsAreBusy.should.be.a('function'); 
    module.agentsAreOffline.should.be.a('function'); 
    module.getActiveButton.should.be.a('function'); 
    module.getEventLog.should.be.a('function'); 
  });
  it('should start and bind events', () => {
    
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo').returns(false);
    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'state').returns(false);
    hasFiredCallback.withArgs(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION').returns(false);
    hasFiredCallback.withArgs(MODULE_EVENT_NAMESPACE, 'EMBEDDED_BUTTON_IMPRESSION').returns(false);

    bindCallback.withArgs(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION').callsFake(bindCallbackHandler);
    bindCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE).callsFake(bindCallbackHandler);
    triggerCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE).callsFake(triggerCallbackHandler);

    bindCallback.withArgs(MODULE_EVENT_NAMESPACE).callsFake(bindCallbackHandler);

    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE).callsFake(triggerCallbackHandler);

    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE, 'SHOULD_HIDE_VA_PANEL').callsFake(function (namespace, evName, data) {
      console.log('@triggerCallback SHOULD_HIDE_VA_PANEL withArgs => ', namespace, evName, data);
      return true;
    });
    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL').callsFake(function (namespace, evName, data) {
      console.log('@triggerCallback SHOULD_SHOW_VA_PANEL withArgs => ', namespace, evName, data);
      return true;
    });

    triggerCallback.withArgs(LP_OFFERS_EVENT_NAMESPACE, 'OFFER_IMPRESSION').callsFake(triggerCallbackHandler);
    triggerCallback.withArgs(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_BUTTON_CONTENT').returns(true);

    lpTag = {};
    lpTag.events = {
      'bind': bindCallback.returns(true),
      'trigger': triggerCallback,
      'hasFired': hasFiredCallback
    };
    lpTag.sdes = {
      'get': sdesGetCallback,
      'send': sinon.stub(),
      'push': sinon.stub()
    };

    lpTag.hooks = {
      'push' : sinon.stub()
    };
    var clock = sinon.useFakeTimers({
      now: Date.now(),
      shouldAdvanceTime:true
    }); // fake setTimeout and setInterval used by the modue
    
    // ********************************** START THE MODULE ******************************** //
    module.start(); // starts the module
    // *********************************************************************************** //

    clock.runAll();
    console.log('lpTag.hooks.push.firstCall.args[0].name ==> ',lpTag.hooks.push.firstCall.args[0].name);

    // cache hooks callback function for manual trigger later on
    var hooksModuleCallback = lpTag.hooks.push.firstCall.args[0].callback;
    console.log('hooksModuleCallback ==> ', hooksModuleCallback);

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

  /* trigger chat button click function to start  */

    lpTag.events.trigger(LP_UNIFIED_WINDOW_EVENT_NAMESPACE,'state',{
      state:'preChat'
    });
    // hooksModuleCallback({
    //   data : {
    //     surveyType: 'preChatSurvey',
    //     surveyData: null
    //   }
    // });

    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_HIDE_VA_PANEL')).to.equal(true);
    expect(triggerCallback.calledWith(MODULE_EVENT_NAMESPACE, 'SHOULD_SHOW_VA_PANEL')).to.equal(false);

    hasFiredCallback.withArgs(LP_UNIFIED_WINDOW_EVENT_NAMESPACE, 'conversationInfo').callsFake(function(){
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
});