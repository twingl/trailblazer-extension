/**
 * Initializes the IDB Object stores, Flux stores, and exports them in an
 * object ready to be passed to flux.
 */

var IDBStore              = require('idb-wrapper');

var TabStore              = require('./stores/tab-store')
  , NodeStore             = require('./stores/node-store')
  , MapStore              = require('./stores/map-store');

var db = {};

/**
 * Initialize the IDB stores for each data model
 */
db.tab = new IDBStore({
  storeName: 'tabs',
  dbVersion: 1,
  keyPath: 'localId',
  autoIncrement: true
});

db.node = new IDBStore({
  storeName: 'nodes',
  dbVersion: 1,
  keyPath: 'localId',
  autoIncrement: true,
  index: [ { name: 'tabId' }, { name: 'assignmentId' } ]
});

db.assignment = new IDBStore({
  storeName: 'assignments',
  dbVersion: 1,
  keyPath: 'localId',
  autoIncrement: true
});

/**
 * Initialize the Flux stores
 */
var fluxStores = {
  TabStore: new TabStore({ db: db }),
  NodeStore: new NodeStore({ db: db }),
  MapStore: new MapStore({ db: db })
};

module.exports = fluxStores;
