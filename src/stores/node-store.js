var _         = require('lodash')
  , info      = require('debug')('stores/node-store.js:info')
  , error     = require('debug')('stores/node-store.js:error')
  , camelize  = require('camelize')
  , constants = require('../constants')
  , Promise   = require('promise')
  , Immutable = require('immutable')
  , Fluxxor   = require('fluxxor');

var debug = require('debug')
  , info  = debug('background.js:info')
  , warn  = debug('node-store.js:warn');

 var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

var NodeStore = Fluxxor.createStore({

  initialize: function (options) {
    var options   = options || {};

    // Instance of IDBDatabase
    this.db       = options.db;
    this.loading  = false;
    this.error    = null;

    this.bindActions(
      constants.FETCH_NODES, this.handleFetchNodes,
      constants.FETCH_NODES_SUCCESS, this.handleFetchNodesSuccess,
      constants.FETCH_NODES_FAIL, this.handleFetchNodesFail,
      constants.UPDATE_NODE_CACHE, this.handleUpdateNodeCache,
      constants.UPDATE_NODE_CACHE_SUCCESS, this.handleUpdateNodeCacheSuccess,
      constants.UPDATE_NODE_CACHE_FAIL, this.handleUpdateNodeCacheFail,
      constants.NODES_SYNCHRONIZED, this.handleNodesSynchronized,
      constants.LOAD_NODES, this.handleLoadNodes,
      constants.LOAD_NODES_SUCCESS, this.handleLoadNodesSuccess,
      constants.SELECT_ASSIGNMENT, this.handleSelectAssignment
    );
  },

  getState: function () {
    info('getting node state')
    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  handleSelectAssignment: function (payload) {
    warn('handleSelectAssignment not implemented')
    this.handleLoadNodes(payload);
  },

  handleFetchNodes: function(assignmentId) {
    this.loading = true;

    // Request nodes from the storage adapter
    info('handleFetchNodess: Requesting /assignments/:id/nodes')
    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(
        // Success
        function(response) {
          info('handleFetchNodes: Nodes received', { response: response });
          this.flux.actions.fetchNodesSuccess(response.assignments);
        }.bind(this),

        // Error
        function(response) {
          warn('handleFetchNodes: Unsuccessful response', { response: response });
          this.flux.actions.fetchNodesFail({ error: response.error });
        }.bind(this)
      );
  },

  /**
   * Camelizes the object keys on the nodes in the payload before firing
   * UPDATE_NODE_CACHE
   */
  handleFetchNodesSuccess: function (payload) {
    info('handleFetchNodesSuccess: Camelizing assignment attribute keys');
    var nodes = _.collect(payload.nodes, camelize);
    this.flux.actions.updateNodeCache(nodes);
  },

  /**
   * Failure handler for FETCH_NODES
   */
  handleFetchNodesFail: function (payload) {
    this.loading = false;
    this.error = payload.error; //unnecessary state
  },

  getIds: function (nodes) {
    return _.pluck(nodes, 'id')
  },

  handleUpdateNodeCache: function (payload) {
    info("Fetched nodes");
    var nodes = payload.nodes
     ,  del   = [];

    var remoteIds = _.pluck(nodes, 'id');

    //synch local nodes with remote
    // 1. remove nonexisting nodes
    // 2. create/update existing nodes

    this.allAsync()
        .then(this.getIds)
        .then(function(localIds) {
          return _.difference(localIds, remoteIds);
        })



  },

  allAsync: function () {
    var promise = Promise(function (resolve, reject) {
      this.db.nodes.all(function (err, res) {
        if (err) reject(err)
        resolve(res)
      })
    }.bind(this))

    return promise;
  }

  onTabCreated: function(tab) {
    // This is, presently, just a kind of pseudo code until flux is wired up on
    // the background.
    // waitFor(["tabStore"], function(tabStore) {
    //   var objectStore = db.transaction(["nodes"], "readwrite").objectStore("nodes");

    //   var request = objectStore.index("tabId").get(tab.id).onsuccess = function(evt) {
    //     info("onTabCreated: nodes.where tabId = tab.id", evt.target.result);
    //   };
    // });
    throw "NotImplemented";
  },

  onTabUpdated: function() {
    throw "NotImplemented";
  },

  onTabClosed: function() {
    throw "NotImplemented";
  },

  onStartRecording: function() {
    throw "NotImplemented";
  },

  onStopRecording: function() {
    throw "NotImplemented";
  },

  onMarkedAsWaypoint: function() {
    throw "NotImplemented";
  }




});

module.exports = NodeStore;
