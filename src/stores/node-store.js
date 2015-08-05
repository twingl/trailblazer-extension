import _          from 'lodash';
import constants  from '../constants';
import NodeHelper from '../helpers/node-helper';
import Logger     from '../util/logger';

import Store from '../lib/store';
import { query, action, deprecated } from '../decorators';

var logger = new Logger('stores/node-store.js');

class NodeStore extends Store {

  constructor (options = {}) {
    super(options);

    // Instance of IDBDatabase
    this.db       = options.db;
    this.error    = null;

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
  }

  @query
  async getNodesByRemoteAssignmentId (assignmentId) {
    var nodes = await this.db.nodes.index('assignmentId').get(assignmentId);
    return nodes;
  }

  @query
  async getNodesByLocalAssignmentId (localAssignmentId) {
    var nodes = await this.db.nodes.index('localAssignmentId').get(localAssignmentId);
    return nodes;
  }

  @query
  async getNodeByRemoteId (id) {
    var node = await this.db.nodes.index('id').get(id);
    return node;
  }

  @query
  async getNodeByLocalId (localId) {
    var node = await this.db.nodes.get(localId);
    return node;
  }

  @query
  getState () {
    logger.info('getting node state')
    return {
      //NOTE: Unsure if this is needed when the all stores can access the main dbObj
      db: this.db,
      error: this.error
    };
  }

  @action(constants.SIGN_OUT)
  handleSignOut () {
    this.db.nodes.clear();
  }

  /**
   * Emit a change event containing data for the specified assignment
   */
  @deprecated
  @action(constants.REQUEST_NODES)
  handleRequestNodes (payload) {
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
  }

  /**
   * Remove all nodes associated with the destroyed assignment
   */
  @action(constants.DESTROY_ASSIGNMENT)
  handleDestroyAssignment (payload) {
    this.waitFor(["AssignmentStore", "TabStore"], function() {
      this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
        var nodeStore = tx.objectStore("nodes");

        nodeStore.index('localAssignmentId').openCursor(IDBKeyRange.only(payload.localId)).onsuccess = function(evt) {
          var cursor = evt.target.result;
          if (cursor) {
            nodeStore.delete(cursor.value.localId);
            cursor.continue();
            // Don't worry about remote copies - they're deleted with the assignment
          }
        };
      });
    });
  }

  @action(constants.SET_NODE_TITLE)
  handleSetNodeTitle (payload) {
    logger.info('handleSetNodeTitle');

    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes")
        , oncomplete = [];

      store.get(payload.localId).onsuccess = function(evt) {
        var node = evt.target.result;

        node.title = payload.title;

        store.put(node).onsuccess = function(evt) {
          oncomplete.push(function() {
            this.flux.actions.updateNodeSuccess(node.localId);
          }.bind(this));
        }.bind(this);
      }.bind(this);

      tx.oncomplete = function() {
        _.each(oncomplete, function(cb) { cb(); });
      };

    }.bind(this));
  }

  /**
   * Create a record for a newly created tab
   */
  @action(constants.TAB_CREATED)
  handleTabCreated (payload) {
    // Wait until we know if the tab is in a recording state
    this.waitFor(["TabStore"], function(tabStore) {

      var parentTabId = payload.parentTabId;

      // If the parent tab is recording, then get it from the DB and create a
      // new child node in the same assignment/localAssignment
      if (parentTabId && tabStore.tabs[parentTabId] === true) {
        this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
          var store = tx.objectStore("nodes")
            , oncomplete = [];

          store.index("tabId").openCursor(IDBKeyRange.only(payload.tabObj.openerTabId)).onsuccess = function(evt) {
            var cursor = evt.target.result;

            if (cursor) {
              var parentNode = cursor.value;

              var node = {
                localAssignmentId:  parentNode.localAssignmentId,
                assignmentId:       parentNode.assignmentId,
                localParentId:      parentNode.localId,
                parentId:           parentNode.id,
                tabId:              payload.tabId,
                url:                payload.tabObj.url,
                title:              payload.tabObj.title
              };

              store.put(node).onsuccess = function(evt) {
                oncomplete.push(function() {
                  this.flux.actions.createNodeSuccess(evt.target.result);
                }.bind(this));
              }.bind(this);
            }
          }.bind(this);

          tx.oncomplete = function() {
            _.each(oncomplete, function(cb) { cb(); });
          };

        }.bind(this));
      }
    }.bind(this));
  }

  @action(constants.CREATE_NODE_SUCCESS)
  handleCreateNodeSuccess (payload) {
    this.emit('change');
  }

  @action(constants.BULK_DESTROY_NODES)
  handleBulkDestroyNodes(payload) {
    this.waitFor(["SyncStore"], () => {
      this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
        let store = tx.objectStore("nodes");
        tx.oncomplete = () => {
          this.emit('change');
        };

        payload.localIds.map(id => store.delete(id));
      });
    });
  }

  @action(constants.CREATED_NAVIGATION_TARGET)
  handleCreatedNavigationTarget (payload) {
    logger.info("handleCreatedNavigationTarget", { payload: payload });
    throw "NotImplementedError";
  }

  /**
   * Handle a tab's state update by mutating or creating nodes
   */
  @action(constants.TAB_UPDATED)
  handleTabUpdated (payload) {
    logger.info("handleTabUpdated:", { payload: payload });

    // Find the parent + children of the tabId
    // Filter out any that don't have the same URL
    // Check that they don't have any tabIds already
    // If any nodes remain, it's probably a back/forward nav
    //  - move the tabId over to the found node, removing it from the current one
    // If not, create a new node and move the tabId from the old one to the new one

    // Open up a transaction so no records change while we're figuring stuff out
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var nodeStore = tx.objectStore("nodes")
        , oncomplete = [];

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
            } else if (currentNode.url === "" || currentNode.url === "chrome://newtab/") {
              // Fill in the current node
              currentNode.url = payload.url;
              currentNode.title = payload.title;

              nodeStore.put(currentNode);
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

              delete currentNode.tabId;
              nodeStore.put(currentNode);
              nodeStore.put(node).onsuccess = function(evt) {
                oncomplete.push(function() {
                  this.flux.actions.createNodeSuccess(evt.target.result);
                }.bind(this));
              }.bind(this);

            }
          }.bind(this); //cursor

        } //if
      }.bind(this);

      tx.oncomplete = function() {
        _.each(oncomplete, function(cb) { cb(); });
      };
    }.bind(this)); //tx
  }

  @action(constants.HISTORY_STATE_UPDATED)
  handleHistoryStateUpdated (payload) {
    logger.info("handleHistoryStateUpdated:", { payload: payload });

    this.waitFor(["TabStore"], function(tabStore) {

      var qualifiers = payload.transitionQualifiers;

      if (tabStore.getState().tabs[payload.tabId] && (
          _.contains(qualifiers, "client_redirect") ||
          _.contains(qualifiers, "server_redirect"))) {
        // If the payload is a redirect of some kind
        var updatedNode;

        this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
          var store = tx.objectStore("nodes");

          store.index("tabId").get(payload.tabId).onsuccess = function(evt) {
            var node = evt.target.result;

            if (node.url === payload.url) {
              store.get(node.localParentId).onsuccess = function(evt) {
                var parentNode = evt.target.result;

                node.localParentId  = parentNode.localParentId;
                node.parentId       = parentNode.parentId;
                node.redirect       = true;
                node.redirectedFrom = parentNode.url;

                store.put(node).onsuccess = function() {
                  updatedNode = node.localId;
                };

                this.flux.actions.destroyNode(parentNode.localId);
              }.bind(this);
            }

          };

          tx.oncomplete = function() {
            if (updatedNode) {
              this.flux.actions.updateNodeSuccess(updatedNode);
            }
          }.bind(this);

          // Get the node corresponding to the tabId
          // If its URL matches the payload, set the parent node's metadata to reflect it

        }.bind(this));
      }
    }.bind(this));
  }

  @action(constants.WEB_NAV_COMMITTED)
  handleWebNavCommitted (payload) {
    logger.info("handleWebNavCommitted:", { payload: payload });

    this.waitFor(["TabStore"], function(tabStore) {

      var qualifiers = payload.transitionQualifiers;

      if (tabStore.getState().tabs[payload.tabId] && (
          _.contains(qualifiers, "client_redirect") ||
          _.contains(qualifiers, "server_redirect"))) {
        // If the payload is a redirect of some kind
        var updatedNode;

        this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
          var store = tx.objectStore("nodes");

          store.index("tabId").get(payload.tabId).onsuccess = function(evt) {
            var node = evt.target.result;

            if (node.url === payload.url) {
              store.get(node.localParentId).onsuccess = function(evt) {
                var parentNode = evt.target.result;

                node.localParentId  = parentNode.localParentId;
                node.parentId       = parentNode.parentId;
                node.redirect       = true;
                node.redirectedFrom = parentNode.url;

                store.put(node).onsuccess = function() {
                  updatedNode = node.localId;
                };

                this.flux.actions.destroyNode(parentNode.localId);
              }.bind(this);
            }

          }.bind(this);

          tx.oncomplete = function() {
            if (updatedNode) {
              this.flux.actions.updateNodeSuccess(updatedNode);
            }
          }.bind(this);

          // Get the node corresponding to the tabId
          // If its URL matches the payload, set the parent node's metadata to reflect it

        }.bind(this));
      }
    }.bind(this));
  }

  /**
   * Remove the tabId from an existing node
   */
  @action(constants.TAB_CLOSED)
  handleTabClosed (payload) {
    logger.info("handleTabClosed:", { payload: payload });

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
  }

  /**
   * Replaces an existing node's tabId with a new one when chrome replaces a
   * tab
   */
  @action(constants.TAB_REPLACED)
  handleTabReplaced (payload) {
    logger.info("handleTabReplaced:", { payload: payload });
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
  }

  /**
   * Update a node's rank
   */
  @action(constants.RANK_NODE_WAYPOINT)
  handleRankNodeWaypoint (payload) {
    logger.info("handleRankNodeWaypoint:", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes");

      store.get(payload.localId).onsuccess = function (evt) {
        var node = evt.target.result;

        if (node) {
          node.rank = 1;
          store.put(node).onsuccess = function (evt) {
            this.emit('change', { node: node });
            this.flux.actions.updateNodeSuccess(node.localId);
          }.bind(this);
        }
      }.bind(this);
    }.bind(this));
  }

  /**
   * Update a node's rank
   */
  @action(constants.RANK_NODE_NEUTRAL)
  handleRankNodeNeutral (payload) {
    logger.info("handleRankNodeNeutral:", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      var store = tx.objectStore("nodes");

      store.get(payload.localId).onsuccess = function (evt) {
        var node = evt.target.result;

        if (node) {
          node.rank = 0;
          store.put(node).onsuccess = function (evt) {
            this.emit('change', { node: node });
            this.flux.actions.updateNodeSuccess(node.localId);
          }.bind(this);
        }
      }.bind(this);
    }.bind(this));
  }

  /**
   * Emit a change event containing the data associated with the specified
   * assignment
   */
  @action(constants.NODES_SYNCHRONIZED)
  handleNodesSynchronized (payload) {
    this.db.nodes.index('localAssignmentId')
      .get(payload.assignment.localId)
      .then(function(nodes) {
        this.emit('change', { assignment: payload.assignment, nodes: nodes });
      }.bind(this));
  }

};

export default NodeStore;
