var actions = require('./actions.js');
var App = require('./content/app.js')
var Fluxxor = require('fluxxor');
var NodeStore = require('./stores/node-store');
var AssignmentStore = require('./stores/assignment-store');
var stores = {
  NodeStore: new NodeStore(),
  AssignmentStore: new AssignmentStore()
};
var flux = new Fluxxor.Flux(stores, actions);
//logging
flux.on("dispatch", function(type, payload) {
  if (console && console.log) {
    console.log("[Dispatch]", type, payload);
  }
});



//variables
var assignmentId;
var chrome = window.chrome;

if (window.location.hash) {
  var o = {};
  _.each(window.location.hash.substring(1).split('&'), function(i) {
    var kv = i.split('=');
    o[kv[0]] = kv[1];
  });
  assignmentId = parseInt(o.assignment);
};

React.render(<App flux={flux} assignment={assignmentId} />)



// function setupPort() {
//   port = chrome.runtime.connect({name: 'state'});
//   port.onMessage.addListener(
//     function handleMessage (request) {
//       app.update(request);
//     }
//   );

//   port.onDisconnect.addListener(setupPort);
// }

// actions.dispatch = function(actionName, payload) { // override the fluxxor
//   // this allows the background and content to share the same actions
//   port.postMessage({type: actionName, payload: payload});
// };

// setupPort();
// actions.init(); // refresh the store to get whatever existing data
