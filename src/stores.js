/**
 * Initializes the IDB Object stores, Flux stores, and exports them in an
 * object ready to be passed to flux.
 */

import treo                from 'treo';
import treoPromise         from 'treo/plugins/treo-promise';

import TabStore            from './stores/tab-store';
import NodeStore           from './stores/node-store';
import AssignmentStore     from './stores/assignment-store';
import AuthenticationStore from './stores/authentication-store';
import SyncStore           from './stores/sync-store';
import MetricsStore        from './stores/metrics-store';
import MapStore            from './stores/map-store';
import ErrorStore          from './stores/error-store';

import Logger from './util/logger';
var logger = Logger('stores.js');

logger.info("Initializing Indexdb");
var schema = treo.schema()
  .version(1)
    // Node storage
    .addStore('nodes', { keyPath: 'localId', increment: true })
    .addIndex('id',                'id',                { unique: true })
    .addIndex('tabId',             'tabId',             { unique: false })
    .addIndex('assignmentId',      'assignmentId',      { unique: false })
    .addIndex('localAssignmentId', 'localAssignmentId', { unique: false })
    .addIndex('url',               'url',               { unique: false })

    // Assignment storage
    .addStore('assignments', { keyPath: 'localId', increment: true })
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
export default {
  TabStore: new TabStore({ db: objectStores }),
  NodeStore: new NodeStore({ db: objectStores }),
  AssignmentStore: new AssignmentStore({ db: objectStores }),
  AuthenticationStore: new AuthenticationStore({ db: objectStores }),
  SyncStore: new SyncStore({ db: objectStores }),
  MetricsStore: new MetricsStore({ db: objectStores }),
  MapStore: new MapStore({ db: objectStores }),
  ErrorStore: new ErrorStore()
};
