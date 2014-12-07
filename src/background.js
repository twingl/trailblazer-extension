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
 */
var UIDispatcher          = require('./background/ui-dispatcher.js')
  , UIReceiver            = require('./background/ui-receiver.js')
  , actions               = require('./actions')
  , stores                = require('./stores')
  , Fluxxor               = require('fluxxor');

info("Initializing Trailblazer!");

/**
 * Initialize the extension.
 *
 * Set the initial UI state and run the install hooks
 */
info("Initializing extension UI state");
var extensionUIState = require('./core/extension-ui-state');
extensionUIState.init();

info("Running install hooks");
chrome.runtime.onInstalled.addListener(require('./core/install-hooks'));

/**
 * Set up Flux.
 *
 * Initialize with the stores and actions, and set up a listener to log all
 * dispatches to the console.
 */
info("Initializing Flux", { stores: stores, actions: actions });
var flux = new Fluxxor.Flux(stores, actions);

flux.on("dispatch", function(type, payload) {
  info("Dispatched", { type: type, payload: payload });
});

/**
 * Initialize the dispatcher and receiver to allow communication between the
 * background process and the UI
 */
info("Initializing UI Dispatcher");
UIDispatcher(flux, ['MapStore']);

info("Initializing UI Receiver");
chrome.runtime.onMessage.addListener(UIReceiver(flux));
