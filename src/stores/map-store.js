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
   * LOGIC SUMMARY
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
   * server ID still exists. If it does, the local assignment's `localId` is
   * set on the server response's counterpart, ready to be pushed into the
   * local IDB.
   *
   * It should be noted that the CREATE and UPDATE actions are both rolled into
   * a single `putBatch` call, whether a record is created or updated just
   * depends on whether the `localId` is present.
   *
   * When the WRITE is completed (or fails), the appropriate next
   * action is fired. A successful action ALWAYS carries the entire
   * collection of Assignments returned from the server (which may not have
   * `localId`s populated).
   *
   * TODO: Address whether deletes of stale assignments should be carried out
   * here or through a separate action. See TODO below.
   *
   * FIXME: This (MapStore#handleLoadAssignments) is a candidate for refactor
   * and method extraction, based on the size of the function and
   * responsibility.
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
          this.db.assignments.getAll(
            // Success
            function (localAssignments) {
              var put = []
                , del = [];

              // We've got to camelize the keys before we operate on anything
              var assignments = _.collect(response.assignments, camelize);

              var remoteIDs = _.pluck(assignments, 'id');
              var persistedAssignments = _.filter(localAssignments, 'id');

              // Iterate over the local assignments that have a server ID,
              // checking if they still exist on the server. If they do, set
              // the `localId` on the server's response so we can update our
              // local copy. If not, push it to the delete queue.
              _.each(persistedAssignments, function(a) {
                if (remoteIDs.indexOf(a.id) >= 0) {
                  _.find(assignments, { 'id': a.id }).localId = a.localId;
                } else {
                  del.push(a.localId);
                }
              });
              put = assignments;

              // We've added our `localId` to the assignments in the response, so
              // now all we need to do is use putBatch to update the local DB.
              // If there are new assignments without a localId, they'll just
              // be inserted as a new record.
              //
              // Only attempt this if there's something to put. IDBWrapper
              // fails with an empty array.
              if (put.length > 0) {
                this.db.assignments.putBatch(put,
                  // Success (putBatch)
                  function () {
                    info('handleLoadAssignments: Successfully inserted new records.');
                    this.flux.actions.loadAssignmentsSuccess(assignments);
                  
                    // Only attempt deletion if there's something to delete
                    if (del.length > 0) {
                      // TODO QN: Do we remove here, or fire REMOVE_ASSIGNMENT
                      // (or whatever action removes local copies of
                      // assignments) for each? Looking to minimize logic
                      // duplication here.
                      info('handleLoadAssignments: Cleaning up old records', { del: del });
                      this.db.assignments.removeBatch(del,
                        // Success (removeBatch)
                        function () {
                          info('handleLoadAssignments: Successfully removed old records.');
                        }.bind(this),

                        // Error (removeBatch)
                        function (error) {
                          error('handleLoadAssignments: Error in batch delete from DB', { error: error })
                          this.flux.actions.loadAssignmentsFail({ error: error });
                        }.bind(this));
                    }
                  }.bind(this),

                  // Error (putBatch)
                  function (error) {
                    error('handleLoadAssignments: Error in batch insert into DB', { error: error })
                    this.flux.actions.loadAssignmentsFail({ error: error });
                  }.bind(this));
              } else {
                info("handleLoadAssignments: No assignments to load.");
                this.flux.actions.loadAssignmentsSuccess(assignments);
              }

              info("handleLoadAssignments: Assignment changes:", { put: put, del: del});
            }.bind(this),

            // Error
            function (error) {
              error('handleLoadAssignments: Error reading from DB', { error: error })
              this.flux.actions.loadAssignmentsFail({ error: error });
            }.bind(this));
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
    // assignments.forEach(function (assignment) {
    //   info('putting assignments', { assignment: assignment })
    //   this.db.put(assignment.id, assignment, this.onDbSuccess, this.onDbFail)
    // }.bind(this))
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
