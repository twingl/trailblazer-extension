// config
import config from './config';
import constants from './constants';

// helpers
import _ from 'lodash';

// Initialize our logger
import Logger from './util/logger';
var logger = Logger('background.js');

// Start tracking errors
var Raven = require('raven-js');
if (config.raven.url) Raven.config(config.raven.url).install();

/**
 * Main dependencies.
 */
var actions               = require('./actions')
  , Fluxxor               = require('fluxxor');

logger.info("Initializing Trailblazer!");

/**
 * Initialize the extension.
 *
 * Set the initial UI state and run the install hooks
 */
logger.info("Initializing extension UI state");
var extensionUIState = require('./core/extension-ui-state');
extensionUIState.init();

logger.info("Running install hooks");
chrome.runtime.onInstalled.addListener(require('./core/install-hooks'));

// Listen for recording changes that will change the extension state
chrome.runtime.onMessage.addListener(function (message, sender, responder) {
  if (message.action === constants.__change__ && message.storeName === 'TabStore') {
    logger.info("Tabstore state change!");
    if (message.payload.tabs) {
      _.each(message.payload.tabs, function(val, key) {
        extensionUIState.update(parseInt(key), (val) ? "recording" : "idle");
      });
    }
  }
});

/**
 * Set up Flux.
 *
 * Initialize with the stores and actions, and set up a listener to log all
 * dispatches to the console.
 */

var stores = require('./stores');
logger.info("Initializing Flux", { stores: stores, actions: actions });
var flux = new Fluxxor.Flux(stores, actions);

_.each(stores, (s) => {
  console.log(s.onBoot, s);
  s.onBoot();
});

// Wire up Flux's dispatcher to listen for chrome.runtime messages
// FIXME Candidate for refactor/extraction into a better location
chrome.runtime.onMessage.addListener(function (message, sender, responder) {
  logger.info('message listener', { message });
  // if (message.action === "change") return;
  if (message.action) {
    var o = { type: message.action };

    o.payload = message.payload || {};
    o.payload.responder = responder;

    flux.dispatcher.dispatch(o);
    logger.info("Dispatched", o);
  };

  if (message.query) {
    // TODO: query method currently needs to respond with a promise. This
    // shouldn't be a requirement, or at least it shouldn't present itself in
    // the source: synchronous methods should work seamlessly.
    flux.store(message.store)[message.query](...message.args).then(responder);
    logger.info("Queried", message);
    return true;
  };
});

// Allow 'change' events to proxy through chrome.runtime messaging to the UI
require('./background/proxy-change')(flux, [
    'AssignmentStore',
    'TabStore',
    'NodeStore',
    'AuthenticationStore',
    'SyncStore',
    'MapStore'
]);

// Wire up Chrome events to fire the appropriate actions
require('./background/chrome-events');

// Inject content-scripts into pages
require('./background/content-scripts');
