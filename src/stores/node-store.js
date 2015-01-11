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
      constants.REQUEST_NODES, this.handleRequestNodes,
      constants.FETCH_NODES, this.handleFetchNodes,
      constants.FETCH_NODES_SUCCESS, this.handleFetchNodesSuccess,
      constants.FETCH_NODES_FAIL, this.handleFetchNodesFail,
      constants.UPDATE_NODE_CACHE, this.handleUpdateNodeCache,
      constants.UPDATE_NODE_CACHE_SUCCESS, this.handleUpdateNodeCacheSuccess,
      constants.UPDATE_NODE_CACHE_FAIL, this.handleUpdateNodeCacheFail,
      constants.NODES_SYNCHRONIZED, this.handleNodesSynchronized,

      constants.TAB_CREATED, this.handleTabCreated,
      constants.CREATED_NAVIGATION_TARGET, this.handleCreatedNavigationTarget,
      constants.TAB_UPDATED, this.handleTabUpdated,
      constants.HISTORY_STATE_UPDATED, this.handleHistoryStateUpdated,
      constants.WEB_NAV_COMMITTED, this.handleWebNavCommitted,
      constants.TAB_CLOSED, this.handleTabClosed,
      constants.TAB_REPLACED, this.handleTabReplaced,
      constants.RANK_NODE_WAYPOINT, this.handleRankNodeWaypoint,
      constants.RANK_NODE_NEUTRAL, this.handleRankNodeNeutral
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

  handleRequestNodes: function (payload) {
    this.db.assignments.get(payload.localAssignmentId)
      .then(function(assignment) {
        this.db.nodes.index('localAssignmentId').get(assignment.localId)
          .then(function(nodes) {
            this.emit('change', {
              assignment: assignment,
              nodes: nodes
            });
          }.bind(this));

        if (assignment.id) {
          // We've got a remote ID, so let's get the updated nodes
          this.flux.actions.fetchNodes(assignment.id);
        }
      }.bind(this));
  },

  handleFetchNodes: function (payload) {
    var assignmentId = payload.assignmentId;

    // Request nodes from the storage adapter
    info('handleFetchNodess: Requesting /assignments/:id/nodes')
    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(
        // Success
        function(response) {
          info('handleFetchNodes: Nodes received', { response: response });
          this.flux.actions.fetchNodesSuccess(assignmentId, response.nodes);
        }.bind(this),

        // Error
        function(response) {
          warn('handleFetchNodes: Unsuccessful response', { response: response });
          this.flux.actions.fetchNodesFail(error);
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
    this.flux.actions.updateNodeCache(payload.assignmentId, nodes);
  },

  /**
   * Failure handler for FETCH_NODES
   */
  handleFetchNodesFail: function (payload) {
    info('handleFetchNodesFail');
    this.loading = false;
  },

  /**
   * Expects payload: Object {nodes: Array, assignmentId: Integer}
   *
   * Updating the cache: logic summary
   *
   * We first read the local nodes so we can figure out what needs to be
   * updated.
   *
   * - If a local record has a server ID, and its server ID is present
   *   in the response from the server, it is UPDATED.
   *
   * - If a local record has a server ID, and its server ID is NOT
   *   present in the response from the server, it is DELETED.
   *
   * - If a local record does not exist, it is CREATED
   *
   * The action does this by iterating over the local nodes which have server
   * IDs populated, and querying the server's response to see if the server ID
   * still exists.
   *
   * It should be noted that the CREATE and UPDATE actions are both rolled into
   * a single array (UPDATEs have `localId` populated on their objects).
   * CREATE, UPDATE and DELETE are all rolled into a single transaction.
   *
   * When the WRITE is completed (or fails), the appropriate next
   * action is fired. A successful action ALWAYS carries the entire
   * collection of Nodes returned from the server for that assignment (which
   * may not have `localId`s populated).
   */
  handleUpdateNodeCache: function (payload) {
    info("handleUpdateNodeCache: Updating cache", { payload: payload });
    var nodes = payload.nodes;

    var remoteIds = _.pluck(nodes, 'id');

    //synch local nodes with remote
    // 1. remove nonexisting nodes
    // 2. create/update existing nodes

    //TODO this sync process should be in one transaction
    this.db.assignments.index('id').get(payload.assignmentId)
      .then(function(assignment) {
        if (!assignment) throw "Unsynchronised Assignment";
        return assignment;
      })
      .then(function(assignment) {
        this.db.nodes.index('localAssignmentId').get(assignment.localId)
          .then(function(localNodes) {
            changes = {
              put: [],
              del: []
            };

            var remoteIds = _.pluck(nodes, 'id');
            var persistedNodes = _.filter(localNodes, 'id');

            // Iterate over the local nodes that have a server ID, checking if they
            // still exist on the server. If they do, set the `localId` on the
            // server's response so we can update our local copy. If not, push it
            // to the delete queue.
            _.each(persistedNodes, function(localNode) {
              if (localNode.id && remoteIds.indexOf(localNode.id) >= 0) {
                var remoteNode = _.find(nodes, { 'id': localNode.id });
                // Set the localId on the remoteNode we just received
                remoteNode.localId = localNode.localId;
              } else {
                // Push the localId of the record to be removed from the store
                changes.del.push(localNode.localId);
              }
            });

            _.each(nodes, function(remoteNode) {
              remoteNode.localAssignmentId = assignment.localId;
            });


            changes.put = nodes;

            return changes;
          })
          .then(function(changes) {
            // We're doing this in a manual transaction instead of a single `batch`
            // call as there are bugs in Treo's batch function.
            // When passing in an array of records incorrect primary keys are used
            // (because Object.keys). When passing in an object to batch delete
            // records, keys are stringified (again, Object.keys) and so no records
            // are deleted
            this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
              var store = tx.objectStore("nodes");

              info("handleUpdateNodeCache: Deleting records", { del: changes.del });
              _.each(changes.del, function(key) { store.delete(key); });

              info("handleUpdateNodeCache: Putting records", { put: changes.put });
              _.each(changes.put, function(record) { store.put(record) });
            });
            return assignment;
          }.bind(this))
          .done(
            //success
            function (assignment) {
              this.flux.actions.updateNodeCacheSuccess(assignment);
            }.bind(this),
            //fail. If any methods up the chain throw an error they will propagate here.
            function (err) {
              this.flux.actions.updateNodeCacheFail(err);
            }.bind(this));

      }.bind(this)); //assignments.index('id').get
  },

  handleUpdateNodeCacheFail: function (err) {
    error('updateNodeCache Failed', { error: err })
  },

  handleUpdateNodeCacheSuccess: function (payload) {
    this.flux.actions.nodesSynchronized(payload.assignment);
  },

  handleNodesSynchronized: function (payload) {
    this.db.nodes.index('localAssignmentId')
      .get(payload.assignment.localId)
      .then(function(nodes) {
        this.emit('change', { assignment: payload.assignment, nodes: nodes });
      }.bind(this));
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

      // Get the current node associated with the tabId
      nodeStore.index("tabId").get(payload.tabId).onsuccess = function(evt) {
        var currentNode = evt.target.result;

        if (currentNode && currentNode.url !== payload.url) {
          nodeStore.index("url").openCursor(IDBKeyRange.only(payload.url), "prev").onsuccess = function(evt) {
            // Grab everything that matches the URL change and check if any of them
            // are a parent or child of the current node.
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

  handleRankNodeWaypoint: function(payload) {
    info("handleRankNodeWaypoint:", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes");

      store.get(payload.localId).onsuccess = function (evt) {
        var node = evt.target.result;

        if (node) {
          node.rank = 1;
          store.put(node).onsuccess = function (evt) {
            this.emit('change', { node: node });
          }.bind(this);
        }
      }.bind(this);
    }.bind(this));
  },

  handleRankNodeNeutral: function(payload) {
    info("handleRankNodeNeutral:", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes");

      store.get(payload.localId).onsuccess = function (evt) {
        var node = evt.target.result;

        if (node) {
          node.rank = 0;
          store.put(node).onsuccess = function (evt) {
            this.emit('change', { node: node });
          }.bind(this);
        }
      }.bind(this);
    }.bind(this));
  }

});

module.exports = NodeStore;
