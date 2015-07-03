var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , Logger                        = require('../util/logger');

var logger = new Logger('stores/map-store.js');

var MapStore = Fluxxor.createStore({

  initialize: function (options) {
    logger.info('initialize', { options: options })
    var options = options || {};
    this.db = options.db;

    logger.info('bindActions', { this: this });

    this.bindActions(constants.SAVE_MAP_LAYOUT, this.handleSaveMapLayout);
  },

  //NOTES
  //When an XHR goes out, an entry is added to
  //SyncStore.pending.{assignment,node} specifying the localId. When the
  //response comes in, the entry is removed. This is a very basic semaphore to
  //ensure that multiple requests don't go out for the same resource resulting
  //in duplicates.

  /**
   * Invokes the persistence event chain for a newly created Assignment.
   */
  handleSaveMapLayout: function (payload) {
    logger.info('handleSaveMapLayout', { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes");

      _.each(payload.coordinates, function(coord, key) {
        store.get(parseInt(key)).onsuccess = function(evt) {
          var node = evt.target.result;
          node.x = coord.x;
          node.y = coord.y;
          store.put(node);
        };
      });

      tx.oncomplete = function() {
        this.flux.actions.persistMapLayout(payload.localId, payload.coordinates);
      }.bind(this);
    }.bind(this));
  }

});

module.exports = MapStore;
