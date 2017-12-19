// var assert = require('assert');
// var chai = require('chai');
// var module = require('../libs/LivePersonVirtualAssistantModule.js');
// var should = chai.should();
// var expect = require('chai').expect;
// console.log(module);
describe('LivePersonVirtualAssistantModule tests', () => {
  before(() => {
    module = LivePersonVirtualAssistantModule;
    expect = chai.expect;
    should = chai.should();
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
    // lpTag = sinon.stub();

    const OFFER_IMPRESSION_EVENT_NAME = 'LP_OFFERS:OFFER_IMPRESSION';
    const MODULE_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME = 'LP_VA_PANEL_MODULE:EMBEDDED_BUTTON_IMPRESSION';

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
      'appendChild':appendChildStub
    });

    hasFiredCallback.withArgs('lpUnifiedWindow', 'conversationInfo').returns(false);
    hasFiredCallback.withArgs('lpUnifiedWindow', 'state').returns(false);
    hasFiredCallback.withArgs('LP_OFFERS', 'OFFER_IMPRESSION').returns(false);
    hasFiredCallback.withArgs('LP_VA_PANEL_MODULE', 'EMBEDDED_BUTTON_IMPRESSION').returns(false);
    
    var moduleCallbacks = [];

    bindCallback.withArgs('LP_OFFERS', 'OFFER_IMPRESSION').callsFake(function(namespace,evName,callback){
      console.log('@bindCallback withArgs \'LP_OFFERS\', \'OFFER_IMPRESSION\' ',namespace,evName,callback);
      console.log('@bindCallback withArgs --> saving to moduleCallbacks[] @ ',OFFER_IMPRESSION_EVENT_NAME);
      moduleCallbacks[OFFER_IMPRESSION_EVENT_NAME] = callback;
      return true;
    });

    bindCallback.withArgs('LP_VA_PANEL_MODULE', 'EMBEDDED_BUTTON_IMPRESSION').callsFake(function(namespace,evName,callback){
      console.log('@bindCallback withArgs \'LP_VA_PANEL_MODULE\', \'EMBEDDED_BUTTON_IMPRESSION\' ',namespace,evName,callback);
      console.log('@bindCallback withArgs --> saving to moduleCallbacks[] @ ', MODULE_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME);

      moduleCallbacks[MODULE_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME] = callback;
      return true;
    });

    triggerCallback.withArgs('LP_OFFERS', 'OFFER_IMPRESSION').callsFake(function (namespace, evName, data) {
      console.log('@triggerCallback invoked! ',namespace,evName,data);
      var callback = moduleCallbacks[OFFER_IMPRESSION_EVENT_NAME];
      callback(data);
      console.log('@triggerCallback --> firing stored callback with data ', callback, data);

    });
    triggerCallback.withArgs('LP_VA_PANEL_MODULE', 'EMBEDDED_BUTTON_IMPRESSION').callsFake(function (namespace, evName, data) {
      var callback = moduleCallbacks[MODULE_EMBEDDED_BUTTON_IMPRESSION_EVENT_NAME];
      callback(data);
      console.log('@triggerCallback --> firing stored callback with data ', callback, data);
     
    });

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

    lpTag.hooks = sinon.stub();
    module.start();
    expect(lpTag.events.bind.called).to.equal(true);
    expect(lpTag.events.hasFired.called).to.equal(true);

    expect(lpTag.events.bind.calledWith('lpUnifiedWindow','state')).to.equal(true);
    expect(lpTag.events.bind.calledWith('lpUnifiedWindow', 'conversationInfo')).to.equal(true);
    expect(lpTag.events.bind.calledWith('LP_OFFERS', 'OFFER_IMPRESSION')).to.equal(true);
    expect(lpTag.events.bind.calledWith('LP_VA_PANEL_MODULE', 'EMBEDDED_BUTTON_IMPRESSION')).to.equal(true);

    expect(lpTag.events.hasFired.calledWith('lpUnifiedWindow','state')).to.equal(true);
    expect(lpTag.events.hasFired.calledWith('lpUnifiedWindow','conversationInfo')).to.equal(false); // not called during .start --> only when checking window status during active chat
    expect(lpTag.events.trigger.calledWith('LP_VA_PANEL_MODULE','EMBEDDED_BUTTON_IMPRESSION')).to.equal(false);
    module.injectButtonContainer();
    var eventData = {
      engagementId: '1234',
      engagementType:5,
      engagementName: ':vap: test button',
      campaignId: '5678',
      state: 1
    };
    lpTag.events.trigger('LP_OFFERS','OFFER_IMPRESSION',eventData);
    expect(lpTag.events.trigger.calledWith('LP_VA_PANEL_MODULE', 'EMBEDDED_BUTTON_IMPRESSION')).to.equal(true);
    expect(lpTag.events.trigger.calledWith('LP_OFFERS', 'OFFER_IMPRESSION')).to.equal(true);

  });
});