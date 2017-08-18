# HSBCNet -- VA PANEL POC

## High Level Process Summary

* Visitor Opens VA Panel
* Registering the Chat Button Div Container to load the hidden button
  * Embedded Chat Button is loaded with online/offline status
  * VA Panel can show/hide custom HTML content responsive buttons
* Visitor has conversation with AI and can see the chat button at the bottom of panel
* If Visit Clicks Chat Button
  + call custom function to "fake" click the hidden button to start the chat
  + inside that custom function, feed in the preChatLines to the chat window
* Listen for Chat Session Started Event to hide VA Panel
* Listen for Chat Session Ended Event/Exit Survey Submitted Event to re-show VA Panel

## Define constants...

```js
var lpButtonEngagementId;
var lpButtonState;
var LP_VA_PANEL_HIDDEN_EMBEDDED_BUTTON_DIV_CONTAINER_ID = "lpButtonDiv-va-panel"; // This will be the unique div id for the embedded panel button within the DOM
var LP_VISIBLE_ONLINE_BUTTON_CLASS_NAME_LIST = "btn btn-success lp-va-panel-button";
var LP_VISIBLE_OFFLINE_BUTTON_CLASS_NAME_LIST = "btn btn-warning lp-va-panel-button";
var LP_HIDDEN_BUTTON_CLASS_NAME_LIST = "btn btn-success lp-va-panel-button hide-lp-button";
var LP_VA_PANEL_EMBEDDED_BUTTON_IDS = [922185332,111]; // NOTE 111 will be replaced by the final ID in PROD account once known.
// show how to listen to the various events raised by the chat window/ lpTag and button refreshes
```


## Registering the Chat Button Div Container

```js
if(!document.getElementById(LP_VA_PANEL_HIDDEN_EMBEDDED_BUTTON_DIV_CONTAINER_ID)) {
  // if the div id has NOT already been created, then make one and add to the panel in the required position with the required id
  var buttonContainer = document.getElementById('button-container');
  var buttonDiv = document.createElement('div');
  buttonDiv.id = LP_VA_PANEL_HIDDEN_EMBEDDED_BUTTON_DIV_CONTAINER_ID;
  buttonContainer.appendChild(buttonDiv);

  /*************** 
      REQUIRED
  ****************/

  // register button div zone with LivePerson now div exists within the DOM   
  // THIS IS CRUCIAL -it tells our system that the container div for the button now exists and can be attempted to be injected onto the page - in either online/offline state. 
  var sdes = [{
    "type": "pagediv",
    "divId": LP_VA_PANEL_HIDDEN_EMBEDDED_BUTTON_DIV_CONTAINER_ID
  }];
  if(lpTag && lpTag.sdes && lpTag.sdes.send) {
    lpTag.sdes.send(sdes);
  } else if (lpTag && lpTag.sdes.push) {
    lpTag.sdes.push(sdes);
  }
  // ^ The above will tell LP that the div now exists and is ready to receive the content - online/offline/busy etc...
}
```


