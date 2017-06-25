import _          from 'lodash';
import constants  from '../constants';
import NodeHelper from '../helpers/node-helper';

import Store from '../lib/store';
import { query, action, deprecated } from '../decorators';

import Logger from '../util/logger';
var logger = Logger('stores/node-store.js');

class NodeStore extends Store {

  constructor (options = {}) {
    super(options);

    // Instance of IDBDatabase
    this.db       = options.db;
    this.error    = null;
  }

  // Called explicitly by background.js on extension startup
  onBoot() {
    // Remove all tabId references from the DB - we can't guarantee anything
    // about tab state right now as we're booting.
    this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
      var store = tx.objectStore("nodes");
      store.openCursor().onsuccess = (evt) => {
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
  async getNodes() {
    var nodes = await this.db.nodes.all();
    return nodes;
  }

  @query
  async getNodesByRemoteAssignmentId(assignmentId) {
    var nodes = await this.db.nodes.index('assignmentId').get(assignmentId);
    return nodes;
  }

  @query
  async getNodesByLocalAssignmentId(localAssignmentId) {
    var nodes = await this.db.nodes.index('localAssignmentId').get(localAssignmentId);
    return nodes;
  }

  @query
  async getNodeByRemoteId(id) {
    var node = await this.db.nodes.index('id').get(id);
    return node;
  }

  @query
  async getNodeByLocalId(localId) {
    var node = await this.db.nodes.get(localId);
    return node;
  }

  @query
  getState() {
    logger.info('getting node state')
    return {
      //NOTE: Unsure if this is needed when the all stores can access the main dbObj
      db: this.db,
      error: this.error
    };
  }

  @action(constants.SIGN_OUT)
  handleSignOut() {
    this.db.nodes.clear();
  }

  /**
   * Emit a change event containing data for the specified assignment
   */
  @deprecated
  @action(constants.REQUEST_NODES)
  handleRequestNodes(payload) {
    this.db.assignments.get(payload.localAssignmentId)
      .then((assignment) => {
        this.db.nodes.index('localAssignmentId').get(assignment.localId)
          .then((nodes) => {
            this.emit('change', {
              assignment: assignment,
              nodes: nodes
            });
          });

        if (assignment.id) {
          // We've got a remote ID, so let's get the updated nodes
          this.flux.actions.fetchNodes(assignment.id);
        }
      });
  }

  /**
   * Remove all nodes associated with the destroyed assignment
   */
  @action(constants.DESTROY_ASSIGNMENT)
  handleDestroyAssignment(payload) {
    this.waitFor(["AssignmentStore", "TabStore"], () => {
      this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
        var nodeStore = tx.objectStore("nodes");

        nodeStore.index('localAssignmentId').openCursor(IDBKeyRange.only(payload.localId)).onsuccess = (evt) => {
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
  handleSetNodeTitle(payload) {
    logger.info('handleSetNodeTitle');

    this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
      var store = tx.objectStore("nodes")
        , oncomplete = [];

      store.get(payload.localId).onsuccess = (evt) => {
        var node = evt.target.result;

        node.title = payload.title;

        store.put(node).onsuccess = (evt) => {
          oncomplete.push(() => {
            this.flux.actions.updateNodeSuccess(node.localId);
          });
        };
      };

      tx.oncomplete = () => {
        _.each(oncomplete, cb => cb());
      };

    });
  }

  /**
   * Create a record for a newly created tab
   */
  @action(constants.TAB_CREATED)
  handleTabCreated(payload) {
    // Wait until we know if the tab is in a recording state
    this.waitFor(["TabStore"], (tabStore) => {

      var parentTabId = payload.parentTabId;

      // If the parent tab is recording, then get it from the DB and create a
      // new child node in the same assignment/localAssignment
      if (parentTabId && tabStore.tabs[parentTabId] === true) {
        this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
          var store = tx.objectStore("nodes")
            , oncomplete = [];

          store.index("tabId").openCursor(IDBKeyRange.only(payload.tabObj.openerTabId)).onsuccess = (evt) => {
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

              store.put(node).onsuccess = (evt) => {
                oncomplete.push(() => {
                  this.flux.actions.createNodeSuccess(evt.target.result);
                });
              };
            }
          };

          tx.oncomplete = () => {
            _.each(oncomplete, cb => cb());
          };

        });
      }
    });
  }

  @action(constants.CREATE_NODE_SUCCESS)
  handleCreateNodeSuccess(payload) {
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
  handleCreatedNavigationTarget(payload) {
    logger.info("handleCreatedNavigationTarget", { payload: payload });
    throw "NotImplementedError";
  }

  /**
   * Handle a tab's state update by mutating or creating nodes
   */
  @action(constants.TAB_UPDATED)
  handleTabUpdated(payload) {
    logger.info("handleTabUpdated:", { payload: payload });

    // Find the parent + children of the tabId
    // Filter out any that don't have the same URL
    // Check that they don't have any tabIds already
    // If any nodes remain, it's probably a back/forward nav
    //  - move the tabId over to the found node, removing it from the current one
    // If not, create a new node and move the tabId from the old one to the new one

    // Open up a transaction so no records change while we're figuring stuff out
    this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
      var nodeStore = tx.objectStore("nodes")
        , oncomplete = [];

      // Get the current node associated with the tabId
      nodeStore.index("tabId").get(payload.tabId).onsuccess = (evt) => {
        var currentNode = evt.target.result;

        if (currentNode && currentNode.url !== payload.url) {
          nodeStore.index("url").openCursor(IDBKeyRange.only(payload.url), "prev").onsuccess = (evt) => {
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
              nodeStore.put(node).onsuccess = (evt) => {
                oncomplete.push(() => {
                  this.flux.actions.createNodeSuccess(evt.target.result);
                });
              };

            }
          }; //cursor

        } //if
      };

      tx.oncomplete = () => {
        _.each(oncomplete, cb => cb());
      };
    }); //tx
  }

  @action(constants.HISTORY_STATE_UPDATED)
  handleHistoryStateUpdated(payload) {
    logger.info("handleHistoryStateUpdated:", { payload: payload });

    this.waitFor(["TabStore"], (tabStore) => {

      var qualifiers = payload.transitionQualifiers;

      if (tabStore.getState().tabs[payload.tabId] && (
          _.includes(qualifiers, "client_redirect") ||
          _.includes(qualifiers, "server_redirect"))) {
        // If the payload is a redirect of some kind
        var updatedNode;

        this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
          var store = tx.objectStore("nodes");

          store.index("tabId").get(payload.tabId).onsuccess = (evt) => {
            var node = evt.target.result;

            if (node.url === payload.url) {
              store.get(node.localParentId).onsuccess = (evt) => {
                var parentNode = evt.target.result;

                node.redirect       = true;
                node.redirectedFrom = parentNode.url;

                store.put(node).onsuccess = () => {
                  updatedNode = node.localId;
                };
              };
            }

          };

          tx.oncomplete = () => {
            if (updatedNode) {
              this.flux.actions.updateNodeSuccess(updatedNode);
            }
          };

          // Get the node corresponding to the tabId
          // If its URL matches the payload, set the parent node's metadata to reflect it

        });
      }
    });
  }

  @action(constants.WEB_NAV_COMMITTED)
  handleWebNavCommitted(payload) {
    logger.info("handleWebNavCommitted:", { payload: payload });

    this.waitFor(["TabStore"], (tabStore) => {

      var qualifiers = payload.transitionQualifiers;

      if (tabStore.getState().tabs[payload.tabId] && (
          _.includes(qualifiers, "client_redirect") ||
          _.includes(qualifiers, "server_redirect"))) {
        // If the payload is a redirect of some kind
        var updatedNode;

        this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
          var store = tx.objectStore("nodes");

          store.index("tabId").get(payload.tabId).onsuccess = (evt) => {
            var node = evt.target.result;

            if (node.url === payload.url) {
              store.get(node.localParentId).onsuccess = (evt) => {
                var parentNode = evt.target.result;

                node.redirect       = true;
                node.redirectedFrom = parentNode.url;

                store.put(node).onsuccess = () => {
                  updatedNode = node.localId;
                };
              };
            }

          };

          tx.oncomplete = () => {
            if (updatedNode) {
              this.flux.actions.updateNodeSuccess(updatedNode);
            }
          };

          // Get the node corresponding to the tabId
          // If its URL matches the payload, set the parent node's metadata to reflect it

        });
      }
    });
  }

  /**
   * Remove the tabId from an existing node
   */
  @action(constants.TAB_CLOSED)
  handleTabClosed(payload) {
    logger.info("handleTabClosed:", { payload: payload });

    // Find the node, remove the tabId
    this.db.nodes.index('tabId').get(payload.tabId)
      .then((nodes) => {
        if (nodes.length > 0) this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {

          var nodeStore = tx.objectStore("nodes");

          // Fetch each record within the tx and remove its tabId
          _.each(nodes, (node) => {
            nodeStore.get(node.localId).onsuccess = (evt) => {
              var record = evt.target.result;

              delete record.tabId;
              nodeStore.put(record);
            };
          }); //each

        }); //transaction
      }); //then
  }

  /**
   * Replaces an existing node's tabId with a new one when chrome replaces a
   * tab
   */
  @action(constants.TAB_REPLACED)
  handleTabReplaced(payload) {
    logger.info("handleTabReplaced:", { payload: payload });
    this.waitFor(["TabStore"], (tabStore) => {
      this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
        var store = tx.objectStore("nodes");

        store.index("tabId").get(payload.oldTabId).onsuccess = (evt) => {
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
  @action(constants.RANK_NODE_FAVOURITE)
  handleRankNodeFavourite(payload) {
    logger.info("handleRankNodeFavourite:", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
      var store = tx.objectStore("nodes");

      store.get(payload.localId).onsuccess = (evt) => {
        var node = evt.target.result;

        if (node) {
          node.rank = 1;
          store.put(node).onsuccess = (evt) => {
            this.emit('change', { node: node });
            this.flux.actions.updateNodeSuccess(node.localId);
          };
        }
      };
    });
  }

  /**
   * Update a node's rank
   */
  @action(constants.RANK_NODE_NEUTRAL)
  handleRankNodeNeutral(payload) {
    logger.info("handleRankNodeNeutral:", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], (err, tx) => {
      var store = tx.objectStore("nodes");

      store.get(payload.localId).onsuccess = (evt) => {
        var node = evt.target.result;

        if (node) {
          node.rank = 0;
          store.put(node).onsuccess = (evt) => {
            this.emit('change', { node: node });
            this.flux.actions.updateNodeSuccess(node.localId);
          };
        }
      };
    });
  }

  /**
   * Emit a change event containing the data associated with the specified
   * assignment
   */
  @action(constants.NODES_SYNCHRONIZED)
  handleNodesSynchronized(payload) {
    this.db.nodes.index('localAssignmentId')
      .get(payload.assignment.localId)
      .then((nodes) => {
        this.emit('change', { assignment: payload.assignment, nodes: nodes });
      });
  }

};

export default NodeStore;
