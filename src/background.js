// config
var config      = require('./config');

// helpers
var _           = require('lodash');

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
var actions               = require('./actions')
  , Fluxxor               = require('fluxxor')
  , AssignmentStore       = require('./stores/assignment-store')
  , MapStore              = require('./stores/map-store')
  , NodeStore             = require('./stores/node-store')
  , TabStore              = require('./stores/tab-store');

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

var stores = require('./stores');
info("Initializing Flux", { stores: stores, actions: actions });
var flux = new Fluxxor.Flux(stores, actions);

// Wire up Flux's dispatcher to listen for chrome.runtime messages
// FIXME Candidate for refactor/extraction into a better location
chrome.runtime.onMessage.addListener(function (message, sender, responder) {
  info('message listener', {message: message})
  // if (message.action === "change") return;
  if (message.action) {
    var o = { type: message.action };

    o.payload = message.payload || {};
    o.payload.responder = responder;

    flux.dispatcher.dispatch(o);
    info("Dispatched", o);
  };
});

// Allow 'change' events to proxy through chrome.runtime messaging to the UI
require('./background/proxy-change')(flux, [
    'MapStore',
    'AssignmentStore',
    'TabStore'
]);

// Wire up Chrome events to fire the appropriate actions
require('./background/chrome-events');
