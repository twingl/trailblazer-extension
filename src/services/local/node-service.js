import { objectStores } from '../../db';

/**
 * Wrapper around the indexeddb operations commonly performed on Nodes.
 *
 * This will emit flux actions to notify stores and other listeners of updated
 * data.
 */
class NodeService {
  constructor(flux) {
    this.flux = flux;
    this.objectStore = objectStores.nodes;
  }

  /**
   * Resolves with all nodes in storage
   */
  list() {
    return this.objectStore.all();
  }

  /**
   * Creates a new Node with `attributes`, resolving with the new record
   */
  create(attributes) {
    return new Promise((resolve, reject) => {
      // Add the new record to the IDB store, then resolve with the newly
      // allocated localId on the record
      this.objectStore.put(attributes)
        .then(localId => {
          attributes.localId = localId;
          resolve(attributes);
        })
        .catch(reject);
    });
  }

  /**
   * Attempts to read a specific record from the store
   */
  read(localId) {
    return this.objectStore.get(localId);
  }

  /**
   * Updates the local copy of an node with `updatedAttributes` and saves
   * it, resolving with the updated record
   */
  update(localId, updatedAttributes) {
    return new Promise((resolve, reject) => {
      // Lock the DB before performing the update so we don't have problems
      // with race conditions and lose data
      this.objectStore.db.transaction('readwrite', ['nodes'], (err, tx) => {
        const store = tx.objectStore('nodes');

        // Fetch the existing record
        store.get(localId).onsuccess = (evt) => {
          let node = evt.target.result;

          // Apply the new attributes to the node
          Object.assign(node, updatedAttributes);

          // Save it
          store.put(node);

          // When we're done saving, resolve the promise with the new record
          tx.oncomplete = evt => resolve(evt.target.result);

          // Let the caller be aware of any errors during the transaction
          tx.onerror = reject;
        };
      });
    });
  }

  /**
   * Destroy a record from the store
   */
  destroy(localId) {
    return this.objectStore.del(localId);
  }
};

export { NodeService };
export default NodeService;
