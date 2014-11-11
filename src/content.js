var actions = require('./actions.js');
var app = require('./content/app.js')([], actions);

var port;

function setupPort() {
  port = chrome.runtime.connect({name: 'state'});
  port.onMessage.addListener(
    function handleMessage (request) {
      app.update(request);
    }
  );

  port.onDisconnect.addListener(setupPort);
}

actions.dispatch = function(actionName, payload) { // override the fluxxor
  // this allows the background and content to share the same actions
  port.postMessage({type: actionName, payload: payload});
};

setupPort();
actions.init(); // refresh the store to get whatever existing data