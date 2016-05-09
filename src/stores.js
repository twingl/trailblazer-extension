/**
 * Initializes the Flux stores, and exports them in an object ready
 * to be passed to flux.
 */

import { objectStores } from './db';

import TabStore            from './stores/tab-store';
import NodeStore           from './stores/node-store';
import AssignmentStore     from './stores/assignment-store';
import AuthenticationStore from './stores/authentication-store';
import SyncStore           from './stores/sync-store';
import MetricsStore        from './stores/metrics-store';
import MapStore            from './stores/map-store';
import ErrorStore          from './stores/error-store';

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
