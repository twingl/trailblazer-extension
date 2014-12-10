var _         = require('lodash')
  , info      = require('debug')('stores/node-store.js:info')
  , error     = require('debug')('stores/node-store.js:error')
  , camelize  = require('camelize')
  , constants = require('../constants')
  , Fluxxor   = require('fluxxor');

 var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

var NodeStore = Fluxxor.createStore({

  initialize: function (options) {
    var options   = options || {};

    // Instance of IDBDatabase
    this.db       = options.db;
    this.loading  = false;
    this.error    = null;

    this.bindActions(
      // constants.FETCH_NODES, this.handleFetchNodes,
      // constants.FETCH_NODES_SUCCESS, this.handleFetchNodesSuccess,
      // constants.FETCH_NODES_FAIL, this.handleFetchNodesFail,
      // constants.UPDATE_NODE_CACHE, this.handleUpdateNodeCache,
      // constants.UPDATE_NODE_CACHE_SUCCESS, this.handleUpdateNodeCacheSuccess,
      // constants.UPDATE_NODE_CACHE_FAIL, this.handleUpdateNodeCacheFail,
      // constants.NODES_SYNCHRONIZED, this.handleNodesSynchronized,
      // constants.LOAD_NODES, this.handleLoadNodes,
      // constants.LOAD_NODES_SUCCESS, this.handleLoadNodesSuccess,
      // constants.SELECT_ASSIGNMENT, this.handleSelectAssignment
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

  getAll: function (callback) {
    //
    // var 

    // this.db.nodes.getAll(
    //   function()
    //   )
  },

  getAllSuccessUpdate: function(localNodes) {
    var batch = createDbBatch(localNodes, assignments);


  },

  getAllFail: function (error) {
    error('handleUpdateAssignmentCache: Error reading from DB', { error: error })
    this.flux.actions.updateAssignmentCacheFail(error);
  },

  handleUpdateNodeCache: function (localNodes) {
    info("Fetched nodes");
    var nodes = payload.nodes;
    this.db.nodes.getAll(
      this.getAllSuccessUpdate,
      this.getAllFail
    );
  },

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
