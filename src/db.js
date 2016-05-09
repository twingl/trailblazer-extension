/**
 * Initialize IndexedDB and its object stores, ready for use elsewhere
 * (predominantly by services and flux stores)
 */
import treo        from 'treo';
import treoPromise from 'treo/plugins/treo-promise';

import Logger from './util/logger';
var logger = Logger('db.js');

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

var db = treo('trailblazer-wash', schema)
  .use(treoPromise());

var objectStores = {
  assignments: db.store('assignments'),
  nodes: db.store('nodes'),
};

export { db, objectStores };
export default db;
