// config
var config                = require('./config');

// adapters
var ChromeIdentityAdapter = require('./adapter/chrome_identity_adapter');

// core
var extensionStates       = require('./core/extension-states')
  , updateUIState         = require('./core/update-ui-state');

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
 ,  constants             = require('./constants')
 ,  IDBStore              = require('idb-wrapper');

var tabDb = new IDBStore({
  storeName: 'tabs',
  dbVersion: 1,
  keyPath: 'id',
  autoIncrement: false
});

var nodeDb = new IDBStore({
  storeName: 'nodes',
  dbVersion: 1,
  keyPath: 'id',
  autoIncrement: false
});

var assignmentDb = new IDBStore({
  storeName: 'assignments',
  dbVersion: 1,
  keyPath: 'id',
  autoIncrement: false
});

var stores = {
  TabStore: new TabStore({ db: tabDb }),
  NodeStore: new NodeStore({ db: nodeDb }),
  MapStore: new MapStore({ db: assignmentDb })
};


//instantiate flux and background app
var flux = new Fluxxor.Flux(stores, actions);

App(flux, 'MapStore');

//logging
flux.on("dispatch", function(type, payload) {
  console.log("Dispatched", type, payload);
})

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


