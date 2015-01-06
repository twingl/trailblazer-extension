var _         = require('lodash')
  , info      = require('debug')('stores/node-store.js:info')
  , error     = require('debug')('stores/node-store.js:error')
  , camelize  = require('camelize')
  , constants = require('../constants')
  , Fluxxor   = require('fluxxor');

var debug = require('debug')
  , info  = debug('stores/node-store.js:info')
  , warn  = debug('stores/node-store.js:warn');

var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

var NodeHelper = {
  isChild: function(node, candidateChild) {
    return (candidateChild.localParentId && candidateChild.localParentId === node.localId);
  },

  isParent: function(node, canidateParent) {
    return (canidateParent.localId && canidateParent.localId === node.localParentId);
  },

  isOpenTab: function(node) {
    return !!node.tabId;
  }
}

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

    // Assume we're booting, remove all tabId references from the DB
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes");
      store.openCursor().onsuccess = function (evt) {
        var cursor = evt.target.result;

        if (cursor) {
          var node = cursor.value;
          delete node.tabId;
          store.put(node);
          cursor.continue();
        }
      };
    });
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
              localParentId:      parentNode.localId,
              parentId:           parentNode.id,
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

    // Find the parent + children of the tabId
    // Filter out any that don't have the same URL
    // Check that they don't have any tabIds already
    // If any nodes remain, it's probably a back/forward nav 
    //  - move the tabId over to the found node, removing it from the current one
    // If not, create a new node and move the tabId from the old one to the new one

    // Open up a transaction so no records change while we're figuring stuff out
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var nodeStore = tx.objectStore("nodes");
      info("handleTabUpdated: tx");

      // Get the current node associated with the tabId
      nodeStore.index("tabId").get(payload.tabId).onsuccess = function(evt) {
        var currentNode = evt.target.result;
        info("handleTabUpdated: tabId", currentNode);

        if (currentNode && currentNode.url !== payload.url) {
          nodeStore.index("url").openCursor(IDBKeyRange.only(payload.url), "prev").onsuccess = function(evt) {
            // Grab everything that matches the URL change and check if any of them
            // are a parent or child of the current node.
            info("handleTabUpdated: url");
            var cursor = evt.target.result;

            // Skip tabs that are open
            if (cursor && !NodeHelper.isOpenTab(cursor.value)) {
              var candidateNode = cursor.value;

              // if the candidate node is a child or the parent of the current one
              if ( NodeHelper.isChild(currentNode, candidateNode) || NodeHelper.isParent(currentNode, candidateNode) ) {
                candidateNode.tabId = currentNode.tabId;
                nodeStore.put(candidateNode);

                delete currentNode.tabId;
                nodeStore.put(currentNode);

              } else {
                // No match - move on
                cursor.continue();
              }
            } else {
              // Create a new node!

              var node = {
                assignmentId:       currentNode.assignmentId,
                localAssignmentId:  currentNode.localAssignmentId,
                parentId:           currentNode.id,
                localParentId:      currentNode.localId,
                tabId:              currentNode.tabId,
                url:                payload.url,
                title:              payload.title
              };
              nodeStore.put(node);

              delete currentNode.tabId;
              nodeStore.put(currentNode);
            }
          }; //cursor
        } //if
      }; //tx
    }.bind(this));

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

    // Find the node, remove the tabId
    this.db.nodes.index('tabId').get(payload.tabId)
      .then(function (nodes) {
        if (nodes.length > 0) this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {

          var nodeStore = tx.objectStore("nodes");

          // Fetch each record within the tx and remove its tabId
          _.each(nodes, function(node) {
            nodeStore.get(node.localId).onsuccess = function (evt) {
              var record = evt.target.result;

              delete record.tabId;
              nodeStore.put(record);
            };
          }); //each

        }); //transaction
      }.bind(this)); //then
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
