import _         from 'lodash';
import constants from '../constants';

import Logger from '../util/logger';
var logger = Logger('stores/map-store.js');

import Store from '../lib/store';
import { action } from '../decorators';

class MapStore extends Store {

  constructor (options = {}) {
    super(options);

    this.db = options.db;
  }

  //NOTES
  //When an XHR goes out, an entry is added to
  //SyncStore.pending.{assignment,node} specifying the localId. When the
  //response comes in, the entry is removed. This is a very basic semaphore to
  //ensure that multiple requests don't go out for the same resource resulting
  //in duplicates.

  /**
   * Invokes the persistence event chain for a newly created Assignment.
   */
  @action(constants.SAVE_MAP_LAYOUT)
  handleSaveMapLayout(payload) {
    logger.info('handleSaveMapLayout', { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
      var store = tx.objectStore("nodes");

      _.each(payload.coordinates, (coord, key) => {
        store.get(parseInt(key)).onsuccess = (evt) => {
          var node = evt.target.result;
          node.x = coord.x;
          node.y = coord.y;
          store.put(node);
        };
      });

      tx.oncomplete = () => {
        this.flux.actions.persistMapLayout(payload.localId, payload.coordinates);
      };
    });
  }

};

export default MapStore;
