var _         = require('lodash')
  , info      = require('debug')('stores/node-store.js:info')
  , error     = require('debug')('stores/node-store.js:error')
  , camelize  = require('camelize')
  , constants = require('../constants')
  , Fluxxor   = require('fluxxor');

var debug = require('debug')
  , info  = debug('node-store.js:info')
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
      constants.SELECT_ASSIGNMENT, this.handleSelectAssignment,

      constants.TAB_CREATED, this.handleTabCreated,
      constants.CREATED_NAVIGATION_TARGET, this.handleCreatedNavigationTarget,
      constants.TAB_UPDATED, this.handleTabUpdated,
      constants.HISTORY_STATE_UPDATED, this.handleHistoryStateUpdated,
      constants.WEB_NAV_COMMITTED, this.handleWebNavCommitted,
      constants.TAB_CLOSED, this.handleTabClosed,
      constants.TAB_REPLACED, this.handleTabReplaced,
      constants.NODE_MARKED_AS_WAYPOINT, this.handleNodeMarkedAsWaypoint
    );
  },

  getState: function () {
    info('getting node state')
    return {
      //NOTE: Unsure if this is needed when the all stores can access the main dbObj
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
          this.flux.actions.fetchNodesSuccess({ nodes: response.nodes, assignmentId: assignmentId });
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
    this.flux.actions.updateNodeCache(nodes, payload.assignmentId);
  },

  /**
   * Failure handler for FETCH_NODES
   */
  handleFetchNodesFail: function (payload) {
    info('handleFetchNodesFail');
    this.loading = false;
  },

  getIds: function (nodes) {
    return _.pluck(nodes, 'id')
  },

  /* *
   * expects payload: Object {nodes: Array, assignmentId: Integer}
   */
  handleUpdateNodeCache: function (payload) {
    info("Fetched nodes");
    var nodes = payload.nodes
     ,  del   = [];

    var remoteIds = _.pluck(nodes, 'id');

    //synch local nodes with remote
    // 1. remove nonexisting nodes
    // 2. create/update existing nodes

    //get all local nodes that match assignmentID
    this.db.nodes.index('assignmentId').get(payload.assignmentId)
        .then(this.getIds)
        .then(function(localIds) {
          //prepare a batch deletion object
          return localIds.reduce(function (acc, id) {
            if (remoteIds.indexOf(id) !== -1) {
            // local nodes do not match remote nodes set id as null to delete
              acc[id] = null;
            }
            return acc;
          }, {})
        })
        //batch delete nodes not present remotely
        .then(this.db.nodes.batch)
        //batch create/update nodes in local cache
        .then(function () {
          return this.db.nodes.batch(nodes)
        }.bind(this))
        .done(
          //success
          function () {
            this.flux.actions
              .updateNodeCacheSuccess();
          },
          //fail. If any methods up the chain throw an error they will propogate here.
          function (err) {
            this.flux.actions
              .updateNodeCacheFail(err);
          }
        )
  },

  handleUpdateNodeCacheFail: function (err) {
    error('updateNodeCache Failed', { error: err })
  },

  handleUpdateNodeCacheSuccess: function () {
    this.flux.actions.nodesSynchronised();
  },

  handleNodesSynchronized: function () {
    warn('not implemented')
  },

  handleTabCreated: function (payload) {
    // Wait until we know if the tab is in a recording state
    this.waitFor(["TabStore"], function(tabStore) {

      var parentTabId = payload.parentTabId;

      // If the parent tab is recording, then get it from the DB and create a
      // new child node in the same assignment/localAssignment
      if (parentTabId && tabStore.tabs[parentTabId] === true) {
        this.db.nodes.index('tabId').get(payload.tabObj.openerTabId)
          .then(function (nodes) {
            var parentNode = _.last(nodes);

            var node = {
              localAssignmentId:  parentNode.localAssignmentId,
              assignmentId:       parentNode.assignmentId,
              tabId:              payload.tabId,
              url:                payload.tabObj.url,
              title:              payload.tabObj.title
            };

            this.db.nodes.put(node);
          }.bind(this));
      }
    });
  },

  handleCreatedNavigationTarget: function (payload) {
    info("handleCreatedNavigationTarget", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabUpdated: function (payload) {
    info("handleTabUpdated:", { payload: payload });
    throw "NotImplementedError";
  },

  handleHistoryStateUpdated: function (payload) {
    info("handleHistoryStateUpdated:", { payload: payload });
    throw "NotImplementedError";
  },

  handleWebNavCommitted: function (payload) {
    info("handleWebNavCommitted:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabClosed: function (payload) {
    info("handleTabClosed:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabReplaced: function (payload) {
    info("handleTabReplaced:", { payload: payload });
    throw "NotImplementedError";
  },

  handleNodeMarkedAsWaypoint: function(payload) {
    info("handleNodeMarkedAsWaypoint:", { payload: payload });
    throw "NotImplemented";
  }

});

module.exports = NodeStore;
