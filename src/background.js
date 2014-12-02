// config
var config                = require('./config');

// adapters
var ChromeIdentityAdapter = require('./adapter/chrome_identity_adapter');

// core
var StateManager          = require('./core/state-manager')
  , tabIdMap              = require('./core/tab-id-map')
  , extensionStates       = require('./core/extension-states')
  , updateUIState         = require('./core/update-ui-state');

//actions
var getMap                = require('./lib/get-map')
  , getNode               = require('./lib/get-node')
  // , resumeRecording       = require('./lib/resume-recording');
  , startRecording        = require('./lib/start-recording')
  , stopRecording         = require('./lib/stop-recording')
  , getCurrentNode        = require('./lib/get-current-node');


// helpers
var Keen                  = require('../vendor/keen')
  , _                     = require('lodash');

//main 
var App                   = require('./background/app.js')
 ,  actions               = require('./actions')
 ,  Fluxxor               = require('fluxxor')
 ,  TabStore              = require('./stores/tab-store')
 ,  NodeStore             = require('./stores/node-store')
 ,  MapStore              = require('./stores/map-store')
 ,  level                 = require('level-browserify')
 ,  Sublevel              = require('level-sublevel')
 ,  constants             = require('./constants');

var db      = Sublevel(level('main'))
 ,  tabDb   = db.sublevel('tabs')
 ,  nodeDb  = db.sublevel('nodes')
 ,  mapDb   = db.sublevel('maps');

var stores = {
  TabStore: new TabStore({ db: tabDb }),
  NodeStore: new NodeStore({ db: nodeDb }),
  MapStore: new MapStore({ db: mapDb })
};


//instantiate flux and background app
var flux = new Fluxxor.Flux(stores, actions);

console.log('MapStore', flux)

App(flux, 'MapStore');



//TODO chrome.tabs.listeners


//receive messages from UI thread
chrome.runtime.onMessage.addListener(function (message) {
  console.log('message', message)
  switch (message.action) {
    case constants.LOAD_ASSIGNMENTS:
      flux.actions.loadAssignments();
      break;
    case constants.LOAD_NODES:
      flux.actions.loadNodes(message.payload);
      break;



  }
});




var keenClient = new Keen({
  requestType: "xhr",
  projectId: config.keen.projectId,
  writeKey: config.keen.writeKey
});

 var keenUserData = {};

// Set the state of the popup when we change tabs
chrome.tabs.onActivated.addListener(function(activeInfo) {
  new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
    var node = Node.cache.read(tabIdMap[activeInfo.tabId]);

    if (signedIn && node && node.recording) {
      // The extension is signed in and is recording the current page
      updateUIState(activeInfo.tabId, "recording");
    } else if (signedIn && node) {
      // The extension is signed in and idle
      updateUIState(activeInfo.tabId, "idle");
    } else if (signedIn) {
      updateUIState(activeInfo.tabId, "unknown");
    } else {
      // The extension is not signed in
      updateUIState(activeInfo.tabId, "notAuthenticated");
    }
  });
});

// Set the state of the popup a tab is updated
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
    var node = Node.cache.read(tabIdMap[tabId]);

    if (signedIn && node && node.recording) {
      // The extension is signed in and is recording the current page
      updateUIState(tabId, "recording");
    } else if (signedIn && node) {
      // The extension is signed in and idle
      updateUIState(activeInfo.tabId, "idle");
    } else if (signedIn) {
      updateUIState(tabId, "unknown");
    } else {
      // The extension is not signed in
      updateUIState(tabId, "notAuthenticated");
    }
  });
});

var stateManager = new StateManager();

chrome.runtime.onInstalled.addListener(function(details) {
  switch(details.reason) {
    case "update":
      // Do stuff
      var identity = new ChromeIdentityAdapter();
      identity.getToken().then(function(token) {
        identity.storeToken(token);
      });
      break;
    case "install":
      // Show onboarding
      chrome.tabs.create({ active: true, url: chrome.runtime.getURL("/src/ui/pages/welcome.html") });
      break;
    case "chrome_update":
      //
      break;
  }
});

// Set initial popup state
new ChromeIdentityAdapter().isSignedIn().then(function (signedIn) {
  if (signedIn) {
    // Set the extension to Idle
    chrome.browserAction.setPopup({
      popup: extensionStates.idle.popup
    });
    chrome.browserAction.setIcon({
      path: extensionStates.idle.browserAction
    });

    //TODO fetch existing assignments and query which tabs are currently
    //recording, restoring their recording state where needed
  } else {
    // Set the extension to Idle
    chrome.browserAction.setPopup({
      popup: extensionStates.notAuthenticated.popup
    });
    chrome.browserAction.setIcon({
      path: extensionStates.notAuthenticated.browserAction
    });
  }
});


