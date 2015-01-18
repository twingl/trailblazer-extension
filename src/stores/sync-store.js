var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
  , camelize                      = require('camelize')
  , NodeHelper                    = require('../helpers/node-helper')
  , AssignmentHelper              = require('../helpers/assignment-helper')
  , info                          = require('debug')('stores/sync-store.js:info')
  , warn                          = require('debug')('stores/sync-store.js:warn')
  , error                         = require('debug')('stores/sync-store.js:error');


var SyncStore = Fluxxor.createStore({

  initialize: function (options) {
    info('initialize', { options: options })
    var options = options || {};
    this.db = options.db;

    this.pending = {
      assignments: {},
      nodes: {}
    };

    info('bindActions', { this: this });

    this.bindActions(
      constants.CREATE_ASSIGNMENT_SUCCESS,        this.handleCreateAssignmentSuccess,
      constants.CREATE_NODE_SUCCESS,              this.handleCreateNodeSuccess,

      constants.UPDATE_NODE_SUCCESS,              this.handleUpdateNodeSuccess,

      constants.PERSIST_ASSIGNMENT,               this.handlePersistAssignment,
      constants.PERSIST_ASSIGNMENT_SUCCESS,       this.handlePersistAssignmentSuccess,

      constants.PERSIST_NODE,                     this.handlePersistNode,
      constants.PERSIST_NODE_SUCCESS,             this.handlePersistNodeSuccess,

      constants.FETCH_ASSIGNMENTS,                this.handleFetchAssignments,
      constants.FETCH_ASSIGNMENTS_SUCCESS,        this.handleFetchAssignmentsSuccess,
      constants.FETCH_ASSIGNMENTS_FAIL,           this.handleFetchAssignmentsFail,
      constants.UPDATE_ASSIGNMENT_CACHE,          this.handleUpdateAssignmentCache,
      constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS,  this.handleUpdateAssignmentCacheSuccess,
      constants.UPDATE_ASSIGNMENT_CACHE_FAIL,     this.handleUpdateAssignmentCacheFail,

      constants.FETCH_NODES,                      this.handleFetchNodes,
      constants.FETCH_NODES_SUCCESS,              this.handleFetchNodesSuccess,
      constants.FETCH_NODES_FAIL,                 this.handleFetchNodesFail,
      constants.UPDATE_NODE_CACHE,                this.handleUpdateNodeCache,
      constants.UPDATE_NODE_CACHE_SUCCESS,        this.handleUpdateNodeCacheSuccess,
      constants.UPDATE_NODE_CACHE_FAIL,           this.handleUpdateNodeCacheFail
    );
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
  handleCreateAssignmentSuccess: function (payload) {
    info('handleCreateAssignmentSuccess', { payload: payload });
    this.flux.actions.persistAssignment(payload.assignment.localId);
  },

  /**
   * Invokes the persistence event chain for a newly created Node.
   */
  handleCreateNodeSuccess: function (payload) {
    info('handleCreateNodeSuccess', { payload: payload });
    this.db.nodes.get(payload.localId).then(function(node) {
      if (node.assignmentId) {
        this.flux.actions.persistNode(node.localId);
      }
    }.bind(this));
  },

  handleUpdateNodeSuccess: function (payload) {
    info('handleUpdateNodeSuccess', { payload: payload });
    this.db.nodes.get(payload.localId).then(function(node) {
      if (node.assignmentId) {
        this.flux.actions.persistNode(node.localId);
      }
    }.bind(this));
  },

  /**
   * Starts the persistence process for a newly created Assignment
   * On successful response, it will update all nodes which point to the
   * assignment's localId, and search for un-persisted root nodes and invoke
   * the persistence process for them.
   */
  handlePersistAssignment: function (payload) {
    info('handlePersistAssignment');
    this.db.assignments.get(payload.localId).done(function(assignment) {
      console.log(assignment);
      var data = AssignmentHelper.getAPIData(assignment);

      if (!this.pending.assignments[assignment.localId]) {
        this.pending.assignments[assignment.localId] = true;

        new TrailblazerHTTPStorageAdapter().create("assignments", data, {})
          .then(
              function(response) {
                this.db.nodes.db.transaction("readwrite", ["assignments", "nodes"], function(err, tx) {
                  var nodeStore       = tx.objectStore("nodes")
                    , assignmentStore = tx.objectStore("assignments");

                  assignmentStore.get(assignment.localId).onsuccess = function(evt) {
                    var assignment  = evt.target.result;
                    assignment.id   = response.id;
                    assignmentStore.put(assignment);
                  };

                  // Get nodes and add the newly created assignmentId to them
                  nodeStore.index('localAssignmentId')
                    .openCursor(IDBKeyRange.only(assignment.localId)).onsuccess = function(evt) {
                      var cursor = evt.target.result;
                      if (cursor) {
                        var node = cursor.value;
                        node.assignmentId = response.id;
                        nodeStore.put(node);

                        cursor.continue();
                      }
                    }.bind(this);

                  // Fire the success event when the transaction is finished
                  tx.oncomplete = function() {
                    delete this.pending.assignments[assignment.localId];
                    this.flux.actions.persistAssignmentSuccess(assignment.localId);
                  }.bind(this);

                  tx.onerror = function() {
                    delete this.pending.assignments[assignment.localId];
                    // error
                  }.bind(this);

                }.bind(this));
              }.bind(this),
              function(response) {
                delete this.pending.assignments[assignment.localId];
              }.bind(this));
      }
    }.bind(this),
    function () {
      delete this.pending.assignments[assignment.localId];
    });
  },

  /**
   * Invokes the persistence process on any logical next targets (root nodes)
   */
  handlePersistAssignmentSuccess: function (payload) {
    info('handlePersistAssignmentSuccess');

    this.db.nodes.index('localAssignmentId').get(payload.localId)
      .then(function(nodes) {
        _.each(nodes, function(node) {
          this.flux.actions.persistNode(node.localId);
        }.bind(this));
      }.bind(this));
  },

  /**
   * Starts the persistence process for a newly created Node.
   * On successful response, it will search for un-persisted child nodes and
   * invoke the persistence process for them. If the parent of the recently
   * created node isn't persisted, it will add itself to a pending list.
   */
  handlePersistNode: function (payload) {
    info('handlePersistNode');

    var persistNode = function(payload, node) {
      var data = NodeHelper.getAPIData(node);

      if (!this.pending.nodes[payload.localId]) {
        this.pending.nodes[payload.localId] = true;

        var promise;
        if (node.id) {
          promise = new TrailblazerHTTPStorageAdapter().update("nodes", node.id, data, {});
        } else {
          promise = new TrailblazerHTTPStorageAdapter().create("nodes", data, {
            parentResource: {
              name: "assignments",
              id: node.assignmentId
            }
          });
        }
        promise.then(
          function(response) {
            delete this.pending.nodes[payload.localId];
            this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
              var store = tx.objectStore("nodes");

              var toPersist = [];

              store.get(payload.localId).onsuccess = function(evt) {
                var node = evt.target.result;

                // If the node still exists
                if (node) {
                  node.id = response.id;
                  store.put(node);
                }
              }.bind(this);

              store.index("localParentId").openCursor(IDBKeyRange.only(payload.localId)).onsuccess = function(evt) {
                var cursor = evt.target.result;

                if (cursor) {
                  var node = cursor.value;

                  node.parentId = response.id;
                  store.put(node);

                  cursor.continue();
                }
              }.bind(this);

              tx.oncomplete = function() {
                this.flux.actions.persistNodeSuccess(node.localId);
              }.bind(this)

            }.bind(this));
          }.bind(this),
          function(response) {
            delete this.pending.nodes[payload.localId];
          }.bind(this));
      }
    }.bind(this);

    this.db.nodes.get(payload.localId).then(function(node) {
      if (!node.localParentId && !node.id) {
        // Persist root nodes that don't have IDs
        persistNode(payload, node);
      } else if (node.parentId && !node.id) {
        // Persist nodes that have a parent persisted and don't have IDs
        persistNode(payload, node);
      } else if (node.id) {
        // Persist the node - updating it
        persistNode(payload, node);
      }
    }.bind(this));
  },

  /**
   * Invokes the persistence process on any logical next targets (children)
   */
  handlePersistNodeSuccess: function (payload) {
    info('handlePersistNodeSuccess');
    this.db.nodes.index('localParentId').get(payload.localId).then(function(nodes) {
      _.each(nodes, function(node) {
        this.flux.actions.persistNode(node.localId);
      }.bind(this));
    }.bind(this));
  },

  /**
   * Fetches the assignments from Trailblazer's HTTP API
   *
   * Fires FETCH_ASSIGNMENTS_SUCCESS if successful, FETCH_ASSIGNMENTS_FAIL if
   * not
   */
  handleFetchAssignments: function() {

    // Request assignments from the storage adapter
    info('handleFetchAssignments: Requesting /assignments')
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(
        // Success
        function(response) {
          info('handleFetchAssignments: Assignments received', { response: response });
          this.flux.actions.fetchAssignmentsSuccess(response.assignments);
        }.bind(this),

        // Error
        function(response) {
          warn('handleFetchAssignments: Unsuccessful response', { response: response });
          this.flux.actions.fetchAssignmentsFail({ error: response.error });
        }.bind(this)
      );
  },

  /**
   * Camelizes the object keys on the assignments in the payload before firing
   * UPDATE_ASSIGNMENT_CACHE
   */
  handleFetchAssignmentsSuccess: function (payload) {
    info('handleFetchAssignmentsSuccess: Camelizing assignment attribute keys');
    var assignments = _.collect(payload.assignments, camelize);

    this.flux.actions.updateAssignmentCache(assignments);
  },

  /**
   * Failure handler for FETCH_ASSIGNMENTS
   */
  handleFetchAssignmentsFail: function (payload) {
  },

  /**
   * Updating the cache: logic summary
   *
   * We first read the local assignments so we can figure out what needs to be
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
   * The action does this by iterating over the local assignments which have
   * server IDs populated, and querying the server's response to see if the
   * server ID still exists.
   *
   * It should be noted that the CREATE and UPDATE actions are both rolled into
   * a single array (UPDATEs have `localId` populated on their objects).
   * CREATE, UPDATE and DELETE are all rolled into a single transaction.
   *
   * When the WRITE is completed (or fails), the appropriate next
   * action is fired. A successful action ALWAYS carries the entire
   * collection of Assignments returned from the server (which may not have
   * `localId`s populated).
   */
  handleUpdateAssignmentCache: function (payload) {
    info("handleUpdateAssignmentCache: Updating cache", { payload: payload });

    var assignments = payload.assignments;

    //TODO this sync process should be in one transaction
    this.db.assignments.all()
      .then(function(localAssignments) {
        var changes = {
          put: [],
          del: []
        };

        var remoteIds = _.pluck(assignments, 'id');
        var persistedAssignments = _.filter(localAssignments, 'id');

        // Iterate over the local assignments that have a server ID,
        // checking if they still exist on the server. If they do, set
        // the `localId` on the server's response so we can update our
        // local copy. If not, push it to the delete queue.
        _.each(persistedAssignments, function(localAssignment) {
          if (localAssignment.id && remoteIds.indexOf(localAssignment.id) >= 0) {
            var remoteAssignment = _.find(assignments, { 'id': localAssignment.id });
            // Set the localId on the remoteAssignment we just received
            remoteAssignment.localId = localAssignment.localId;
          } else {
            // Push the localId of the record to be removed from the store
            changes.del.push(localAssignment.localId);
          }
        });

        changes.put = assignments;

        return changes;
      })
      .then(function (changes) {
        // We're doing this in a manual transaction instead of a single `batch`
        // call as there are bugs in Treo's batch function.
        // When passing in an array of records incorrect primary keys are used
        // (because Object.keys). When passing in an object to batch delete
        // records, keys are stringified (again, Object.keys) and so no records
        // are deleted
        var storeName = this.db.assignments.name;
        this.db.assignments.db.transaction("readwrite", [storeName], function(err, tx) {
          var store = tx.objectStore(storeName);

          info("handleUpdateAssignmentCache: Deleting records", { del: changes.del });
          _.each(changes.del, function(key) { store.delete(key); });

          info("handleUpdateAssignmentCache: Putting records", { put: changes.put });
          _.each(changes.put, function(record) { store.put(record); });
        });
      }.bind(this))
      .done(
        //success
        function () {
          this.flux.actions.updateAssignmentCacheSuccess();
        }.bind(this),
        //fail. If any methods up the chain throw an error they will propagate here.
        function (err) {
          this.flux.actions.updateAssignmentCacheFail(err);
        }.bind(this));

  },

  /**
   * Success handler for UPDATE_ASSIGNMENT_CACHE
   *
   * Fires ASSIGNMENTS_SYNCHRONIZED
   */
  handleUpdateAssignmentCacheSuccess: function () {
    this.flux.actions.assignmentsSynchronized();
  },

  /**
   * Failure handler for UPDATE_ASSIGNMENT_CACHE
   */
  handleUpdateAssignmentCacheFail: function (payload) {
    error('updateAssignmentCacheFail', { error: payload.error });
  },

  /**
   * Initiate the sync process for nodes associated with the specified
   * assignment by fetching the data from the API
   */
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
    warn('handleFetchNodesFail');
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
        //FIXME breaks when the nodes exist locally but the assignment doesn't
        //exist locally (i.e. new node records can't be created due to the
        //unique constraint on id)
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
              if (remoteNode.parentId) {
                remoteNode.localParentId = _.find(nodes, { 'id': remoteNode.parentId }).localId;
              }
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

  /**
   * Log an error when the cache update process fails
   */
  handleUpdateNodeCacheFail: function (err) {
    error('updateNodeCache Failed', { error: err })
  },

  /**
   * Emit an event signifying that the cache has been updated successfully
   */
  handleUpdateNodeCacheSuccess: function (payload) {
    this.flux.actions.nodesSynchronized(payload.assignment);
  },

});

module.exports = SyncStore;
