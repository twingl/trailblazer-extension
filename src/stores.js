/**
 * Initializes the IDB Object stores, Flux stores, and exports them in an
 * object ready to be passed to flux.
 */

var debug               = require('debug')
  , info                = debug('stores.js:info')
  , treo                = require('treo')
  , treoPromise         = require('treo/plugins/treo-promise')
  , TabStore            = require('./stores/tab-store')
  , NodeStore           = require('./stores/node-store')
  , AssignmentStore     = require('./stores/assignment-store')
  , AuthenticationStore = require('./stores/authentication-store')
  , SyncStore           = require('./stores/sync-store')
  , MetricsStore        = require('./stores/metrics-store')
  , MapStore        = require('./stores/map-store');

info("Initializing Indexdb");
var schema = treo.schema()
  .version(1)
    // Node storage
    .addStore('nodes', { keyPath: 'localId', autoIncrement: true })
    .addIndex('id',                'id',                { unique: true })
    .addIndex('tabId',             'tabId',             { unique: false })
    .addIndex('assignmentId',      'assignmentId',      { unique: false })
    .addIndex('localAssignmentId', 'localAssignmentId', { unique: false })
    .addIndex('url',               'url',               { unique: false })

    // Assignment storage
    .addStore('assignments', { keyPath: 'localId', autoIncrement: true })
    .addIndex('id',                'id',                { unique: true })
  .version(2)
    // Node parent ID indices
    .getStore('nodes')
    .addIndex('parentId',          'parentId',          { unique: false })
    .addIndex('localParentId',     'localParentId',     { unique: false })

//initialize db and provide a wrapper object around the treo api
var db = treo('trailblazer-wash', schema)
  .use(treoPromise());

var objectStores = {
  assignments: db.store('assignments'),
  nodes: db.store('nodes')
};


/**
 * Initialize the Flux stores
 */
var fluxStores = {
  TabStore: new TabStore({ db: objectStores }),
  NodeStore: new NodeStore({ db: objectStores }),
  AssignmentStore: new AssignmentStore({ db: objectStores }),
  AuthenticationStore: new AuthenticationStore({ db: objectStores }),
  SyncStore: new SyncStore({ db: objectStores }),
  MetricsStore: new MetricsStore({ db: objectStores }),
  MapStore: new MapStore({ db: objectStores })
};

module.exports = fluxStores;
