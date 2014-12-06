var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , Immutable                     = require('immutable')
  , uuid                          = require('node-uuid')
  , TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
  , camelize                      = require('camelcase-keys')
  , info                          = require('debug')('stores/map-store.js:info')
  , warn                          = require('debug')('stores/map-store.js:warn')
  , error                         = require('debug')('stores/map-store.js:error');


//TODO 
// handleTabCreated
// handleTabUpdated
// handleTabClosed
// handleTabFocused
// handleStopRecording
// handleMarkedAsWaypoint
// handleMapTitleUpdated
// handleMapShared


var MapStore = Fluxxor.createStore({

  initialize: function (options) {
    info('initialize')
    var options             = options || {};
    this.db                 = options.db;
    this.currentAssignment  = null;
    this.loading            = false;
    this.error              = null;
    this.index              = 0;

    this.bindActions(
      constants.LOAD_ASSIGNMENTS, this.handleLoadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.handleLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.handleLoadAssignmentsFail,
      constants.LOAD_NODES_SUCCESS, this.handleLoadNodesSuccess,
      constants.SELECT_ASSIGNMENT, this.handleSelectAssignment
    );
  },

  getState: function () {
    info('getting map state');

    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  onDbFail: function (err) {
    error('db error', { error: err });
  },


  /**
   * Retrieves a list of assignments from the server, attempting to store them
   * in the local IDB. Fires LOAD_ASSIGNMENTS_SUCCESS with the assignments if
   * the above was without error, or LOAD_ASSIGNMENTS_FAIL with the error if
   * there was a problem.
   *
   * It first retrieves a current list of Assignments from the server, and
   * matches them up to the local IDB by `id` to avoid duplicates, as `localId`
   * is the primary key for the IDB.
   *
   *                                   * * *
   *
   * TODO: Deletion handling. How do we deal with the case where an assignment
   * was deleted on the server, and is propagating out to the clients? Do we
   * set the state as "deleted", but which can be "undone"?
   *
   * Proposal 1:
   * Perhaps if a local assignment *with* a *server id* disappears, it can be
   * removed from the local IDB
   */
  handleLoadAssignments: function() {
    this.loading = true;

    // Request assignments from the storage adapter
    info('handleLoadAssignments: Requesting /assignments')
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(
        // Success
        function(response) {
          info('handleLoadAssignments: Successful response', { response: response });
          //this.flux.actions.loadAssignmentsSuccess(response.assignments);

          /**
           * We first need to read the local assignments so we can figure out
           * what needs to be updated.
           *
           * - If a local record has a server ID, and its server ID is present
           *   in the response from the server, it is UPDATED.
           *
           * - If a local record has a server ID, and its server ID is NOT
           *   present in the response from the server, it is DELETED.
           *
           * - If a local record does not exist, it is CREATED
           *
           * When the WRITE is completed (or fails), the appropriate next
           * action is fired. A successful action ALWAYS carries the entire
           * collection of Assignments.
           */
        }.bind(this),

        // Error
        function(response) {
          warn('handleLoadAssignments: Unsuccessful response', { response: response })
          this.flux.actions.loadAssignmentsFail({ error: response.error });
        }.bind(this)
      );
  },

  handleLoadAssignmentsSuccess: function(payload) {
    info('handleLoadAssignmentsSuccess');
    this.loading = false
    this.error  = null;
    var assignments = payload.assignments;
    
    //send assignments to the UI
    this.emit('update-ui', constants.ASSIGNMENTS_READY, { assignments: assignments }) //FIXME rename to LOAD_ASSIGNMENTS_SUCCESS?
  
    //NOTE IDB wrapper doesnt support putBatch for out-of-line keys
    //and this will fire once and then stop as the IDBWrapper put api is asynchrnous 
    assignments.forEach(function (assignment) {
      info('putting assignments', { assignment: assignment })
      this.db.put(assignment.id, assignment, this.onDbSuccess, this.onDbFail)
    }.bind(this))
  },

  handleLoadAssignmentsFail: function (payload) {
    this.loading = false;
    this.error = payload.error; //unnecessary state
    this.emit('update-ui', constants.LOAD_ASSIGNMENTS_FAIL, { error: payload.error });
  },

  dispatchNodes: function (data) {
    this.emit('update-ui', constants.NODES_READY, { nodes: data });
  },

  handleGetAllNodesFail: function (error) {
    warn('handleGetAllNodesFail', { error: error })
  },

  handleLoadNodesSuccess: function (payload) {
    info('handleLoadNodesSuccess', { payload: payload });
    this.waitFor(['NodeStore'], function (nodeStore) {
      //TODO search by currentAssignment index
      var nodes = nodeStore.getState().db.getAll(this.dispatchNodes, this.handleGetAllNodesFail)
    }.bind(this))
  },

  handleSelectAssignment: function (payload) {
    info('handleSelectAssignment', { payload: payload })
    this.currentAssignment = payload.assignmentId; //NO
    this.emit('update-ui', constants.CURRENT_ASSIGNMENT_CHANGED, payload)
  }

});

module.exports = MapStore;
