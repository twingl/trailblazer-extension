var _           = require('lodash')
  , constants   = require('../constants')
  , Fluxxor     = require('fluxxor')
  , NodeHelper  = require('../helpers/node-helper')
  , debug       = require('debug')
  , info        = debug('stores/node-store.js:info')
  , warn        = debug('stores/node-store.js:warn')
  , error       = debug('stores/node-store.js:error');

var NodeStore = Fluxxor.createStore({

  initialize: function (options) {
    var options   = options || {};

    // Instance of IDBDatabase
    this.db       = options.db;
    this.error    = null;

    this.bindActions(
      constants.REQUEST_NODES,              this.handleRequestNodes,

      constants.DESTROY_ASSIGNMENT,         this.handleDestroyAssignment,

      constants.TAB_CREATED,                this.handleTabCreated,
      constants.CREATED_NAVIGATION_TARGET,  this.handleCreatedNavigationTarget,
      constants.TAB_UPDATED,                this.handleTabUpdated,
      constants.HISTORY_STATE_UPDATED,      this.handleHistoryStateUpdated,
      constants.WEB_NAV_COMMITTED,          this.handleWebNavCommitted,
      constants.TAB_CLOSED,                 this.handleTabClosed,
      constants.TAB_REPLACED,               this.handleTabReplaced,

      constants.RANK_NODE_WAYPOINT,         this.handleRankNodeWaypoint,
      constants.RANK_NODE_NEUTRAL,          this.handleRankNodeNeutral,

      constants.NODES_SYNCHRONIZED,         this.handleNodesSynchronized
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
      error: this.error
    };
  },

  /**
   * Emit a change event containing data for the specified assignment
   */
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

  /**
   * Remove all nodes associated with the destroyed assignment
   */
  handleDestroyAssignment: function (payload) {
    this.waitFor(["AssignmentStore", "TabStore"], function() {
      this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
        var nodeStore = tx.objectStore("nodes");

        nodeStore.index('localAssignmentId').openCursor(IDBKeyRange.only(payload.localId)).onsuccess = function(evt) {
          var cursor = evt.target.result;
          if (cursor) {
            nodeStore.delete(cursor.value.localId);
            cursor.continue();
          }
        };
      });
    });
    this.db.nodes.index('localAssignmentId').get(payload.localId).then(function(nodes) {

      // Fire API deletion
      this.db.assignments.del(payload.localId).then(function() {

        this.db.assignments.all().then(function(assignments) {
          this.emit('change', { assignments: assignments });
        }.bind(this));

      }.bind(this));

    }.bind(this));
  },

  /**
   * Create a record for a newly created tab
   */
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

  /**
   * Handle a tab's state update by mutating or creating nodes
   */
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

  /**
   * Remove the tabId from an existing node
   */
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

  /**
   * Replaces an existing node's tabId with a new one when chrome replaces a
   * tab
   */
  handleTabReplaced: function (payload) {
    info("handleTabReplaced:", { payload: payload });
    this.waitFor(["TabStore"], function(tabStore) {
      this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
        var store = tx.objectStore("nodes");

        store.index("tabId").get(payload.oldTabId).onsuccess = function(evt) {
          var node = evt.target.result;

          if (node && tabStore.getState().tabs[payload.newTabId]) {
            node.tabId = payload.newTabId;
            store.put(node);
          }
        }
      });
    });
  },

  /**
   * Update a node's rank
   */
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

  /**
   * Update a node's rank
   */
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
  },

  /**
   * Emit a change event containing the data associated with the specified
   * assignment
   */
  handleNodesSynchronized: function (payload) {
    this.db.nodes.index('localAssignmentId')
      .get(payload.assignment.localId)
      .then(function(nodes) {
        this.emit('change', { assignment: payload.assignment, nodes: nodes });
      }.bind(this));
  }

});

module.exports = NodeStore;
