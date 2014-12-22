// config
var config      = require('./config');

// helpers
var _           = require('lodash')
 ,  treo        = require('treo')
 ,  treoPromise = require('treo/plugins/treo-promise');

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

info("Initializing Indexdb");
var schema = treo.schema()
  .version(1)
  .addStore('tabs', { key: 'id' })
    .addIndex('byNodeId', 'nodeId', { unique: true })
  .addStore('nodes', { key: 'id' })
    .addIndex('byTabId', 'tabId', { unique: true })
    .addIndex('byAssignmentId', 'assignmentID', { unique: false })
  .addStore('assignments', { key: 'id' })
  .addStore('maps', { key: 'id' });

//initialize db and provide a wrapper object around the treo api
var db = treo('db', schema)
  .use(treoPromise());

var dbObj = {
  assignments: db.store('assignments'),
  maps: db.store('maps'),
  nodes: db.store('nodes'),
  tabs: db.store('tabs')
 };

//initialize stores
var stores = {
  AssignmentStore: new AssignmentStore({ db: dbObj }),
  MapStore: new MapStore({ db: dbObj }),
  TabStore: new TabStore({ db: dbObj }),
  NodeStore: new NodeStore({ db: dbObj })
}

info("Initializing Flux", { stores: stores, actions: actions });
var flux = new Fluxxor.Flux(stores, actions);

// Wire up Flux's dispatcher to listen for chrome.runtime messages
// FIXME Candidate for refactor/extraction into a better location
chrome.runtime.onMessage.addListener(function (message) {
  info('message listener', {message: message})
  // if (message.action === "change") return;
  if (message.action) {
    var o = { type: message.action };
    if (message.payload) o.payload = message.payload;

    flux.dispatcher.dispatch(o);
    info("Dispatched", o);
  };
});

// Allow 'change' events to proxy through chrome.runtime messaging to the UI
require('./background/proxy-change')(flux, ['MapStore', 'AssignmentStore']);

// Wire up Chrome events to fire the appropriate actions
require('./background/chrome-events');
