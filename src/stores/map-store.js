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
      constants.FETCH_ASSIGNMENTS, this.handleFetchAssignments,
      constants.FETCH_ASSIGNMENTS_SUCCESS, this.handleFetchAssignmentsSuccess,
      constants.FETCH_ASSIGNMENTS_FAIL, this.handleFetchAssignmentsFail,
      constants.UPDATE_ASSIGNMENT_CACHE, this.handleUpdateAssignmentCache,
      constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS, this.handleUpdateAssignmentCacheSuccess,
      constants.UPDATE_ASSIGNMENT_CACHE_FAIL, this.handleUpdateAssignmentCacheFail,
      constants.ASSIGNMENTS_SYNCHRONIZED, this.handleAssignmentsSynchronized,
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
   * Fetches the assignments from Trailblazer's HTTP API
   *
   * Fires FETCH_ASSIGNMENTS_SUCCESS if successful, FETCH_ASSIGNMENTS_FAIL if
   * not
   *
   * FIXME: Belongs on AssignmentStore
   */
  handleFetchAssignments: function() {
    this.loading = true;

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
   *
   * FIXME: Belongs on AssignmentStore
   */
  handleFetchAssignmentsSuccess: function (payload) {
    info('handleFetchAssignmentsSuccess: Camelizing assignment attribute keys');
    var assignments = _.collect(payload.assignments, camelize);

    this.flux.actions.updateAssignmentCache(assignments);
  },

  /**
   * Failure handler for FETCH_ASSIGNMENTS
   *
   * FIXME: Belongs on AssignmentStore
   */
  handleFetchAssignmentsFail: function (payload) {
    this.loading = false;
    this.error = payload.error; //unnecessary state
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
   * FIXME: Belongs on AssignmentStore
   */
  handleUpdateAssignmentCache: function (payload) {
    var assignments = payload.assignments;

    this.db.assignments.getAll(
      // Success
      function (localAssignments) {
        info("Fetched assignments");
        var put = []
          , del = [];

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
        info("handleUpdateAssignmentCache: Assignment changes to commit:", { put: put, del: del});
        if (put.length > 0) {
          this.db.assignments.putBatch(put,
            // Success
            function () {
              info('handleUpdateAssignmentCache: Successfully inserted new records.');

              // Only attempt deletion if there's something to delete
              if (del.length > 0) {
                info('handleUpdateAssignmentCache: Cleaning up old records', { del: del });
                this.db.assignments.removeBatch(del,
                  // Success (removeBatch)
                  function () {
                    info('handleUpdateAssignmentCache: Successfully removed old records.');
                    this.flux.actions.updateAssignmentCacheSuccess();
                  }.bind(this),

                  // Error (removeBatch)
                  function (error) {
                    error('handleUpdateAssignmentCache: Error in batch delete from DB', { error: error })
                    this.flux.actions.updateAssignmentCacheFail(error);
                  }.bind(this));
              } else {
                info("handleUpdateAssignmentCache: No assignments to delete.");
                this.flux.actions.updateAssignmentCacheSuccess();
              }
            }.bind(this),

            // Error (putBatch)
            function (error) {
              error('handleUpdateAssignmentCache: Error in batch insert into DB', { error: error })
              this.flux.actions.updateAssignmentCacheFail(error);
            }.bind(this));
        } else {
          info("handleUpdateAssignmentCache: No assignments to load.");
          this.flux.actions.updateAssignmentCacheSuccess();
        }
      }.bind(this),

      // Error
      function (error) {
        error('handleUpdateAssignmentCache: Error reading from DB', { error: error })
        this.flux.actions.updateAssignmentCacheFail(error);
      }.bind(this)
    );
  },

  /**
   * Success handler for UPDATE_ASSIGNMENT_CACHE
   *
   * Fires ASSIGNMENTS_SYNCHRONIZED
   *
   * FIXME: Belongs on AssignmentStore
   */
  handleUpdateAssignmentCacheSuccess: function () {
    this.flux.actions.assignmentsSynchronized();
  },

  /**
   * Failure handler for UPDATE_ASSIGNMENT_CACHE
   *
   * FIXME: Belongs on AssignmentStore
   */
  handleUpdateAssignmentCacheFail: function (payload) {
    error('updateAssignmentCacheFail', { error: payload.error });
  },

  /**
   * Emits a change event from this store with the complete list of assignments
   *
   * FIXME: Belongs on AssignmentStore
   */
  handleAssignmentsSynchronized: function () {
    // Fetch all assignments and tell the UI
    this.db.assignments.getAll(function (assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
  },

  handleDispatchNodes: function (data) {
    this.emit('change', { nodes: data });
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
  }

});

module.exports = MapStore;
