// config
var config                = require('./config');

// helpers
var _                     = require('lodash');

/**
 * Initialize logging.
 *
 * Logger name should be the file path, relative to src/ (e.g. background.js,
 * stores/map-store.js)
 *
 * Debug objects that are passed to the logger should be wrapped in an object
 * to minimise console noise (e.g. { assignments: assignments } instead of
 * assignments)
 *
 * Log levels are:
 * - INFO
 * - WARN
 * - ERROR
 */
var debug = require('debug')
  , info  = debug('background.js:info');

// Enable or disable logging per configuration
if (config.logging) {
  debug.enable('*');
} else {
  debug.disable('*');
}

/**
 * Main dependencies.
 *
 */
var UIDispatcher          = require('./background/ui-dispatcher.js')
  , actions               = require('./actions')
  , stores                = require('./stores')
  , Fluxxor               = require('fluxxor')
  , constants             = require('./constants');

info("Initializing!", { actions: actions });

info("Initializing extension UI state");
var extensionUIState = require('./core/extension-ui-state');
extensionUIState.init();

info("Running install hooks");
chrome.runtime.onInstalled.addListener(require('./core/install-hooks'));

info("Initializing Flux");
var flux = new Fluxxor.Flux(stores, actions);

// log each dispatch to the console
flux.on("dispatch", function(type, payload) {
  info("Dispatched", { type: type, payload: payload });
})

info("Initializing UI Dispatcher");
UIDispatcher(flux, ['MapStore']);


/**
 * Listen for select messages that are sent over chrome.runtime and dispatch
 * their actions
 */
chrome.runtime.onMessage.addListener(function (message) {
  info("Recieved message over chrome.runtime", {message: message});

  switch (message.action) {
    case constants.LOAD_ASSIGNMENTS:
      flux.actions.loadAssignments();
      break;
    case constants.LOAD_NODES:
      flux.actions.loadNodes(message.payload);
      break;
    case constants.SELECT_ASSIGNMENT:
      flux.actions.selectAssignment(message.payload.assignmentId);
      break;
  }
});



