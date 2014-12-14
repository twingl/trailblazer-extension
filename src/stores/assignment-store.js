var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , Promise                       = require('promise')
  , TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
  , camelize                      = require('camelize')
  , info                          = require('debug')('stores/assignment-store.js:info')
  , warn                          = require('debug')('stores/assignment-store.js:warn')
  , error                         = require('debug')('stores/assignment-store.js:error');

var AssignmentStore = Fluxxor.createStore({

  initialize: function (options) {
    info('initialize', { options: options })
    var options             = options || {};
    this.db                 = options.db;
    this.loading            = false;

    info('bindActions', { this: this })

    this.bindActions(
      constants.FETCH_ASSIGNMENTS, this.handleFetchAssignments,
      constants.FETCH_ASSIGNMENTS_SUCCESS, this.handleFetchAssignmentsSuccess,
      constants.FETCH_ASSIGNMENTS_FAIL, this.handleFetchAssignmentsFail,
      constants.UPDATE_ASSIGNMENT_CACHE, this.handleUpdateAssignmentCache,
      constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS, this.handleUpdateAssignmentCacheSuccess,
      constants.UPDATE_ASSIGNMENT_CACHE_FAIL, this.handleUpdateAssignmentCacheFail,
      constants.ASSIGNMENTS_SYNCHRONIZED, this.handleAssignmentsSynchronized
    );
  },

  getIds: function (nodes) {
    return _.pluck(nodes, 'id')
  },

  /**
   * Fetches the assignments from Trailblazer's HTTP API
   *
   * Fires FETCH_ASSIGNMENTS_SUCCESS if successful, FETCH_ASSIGNMENTS_FAIL if
   * not
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
    this.loading = false;
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
   * a single `batch` call.
   * When the WRITE is completed (or fails), the appropriate next
   * action is fired. A successful action ALWAYS carries the entire
   * collection of Assignments returned from the server (which may not have
   * `localId`s populated).
   */
  handleUpdateAssignmentCache: function (payload) {
    var assignments = payload.assignments;

    var remoteIds = _.pluck(assignments, 'id');

    this.db.assignments.all()
      .then(this.getIds)
      .then(function (localIds) {
        info({localIds: localIds})
        //prepare a batch deletion object
        return localIds.reduce(function (acc, id) {
          if (remoteIds.indexOf(id) !== -1) {
          // local assignments do not match remote asssignments set id as null to delete
            acc[id] = null;
          }
          return acc;
        }, {})
      })
      //batch delete assignments not present remotely
      .then(function (delObj) {
        return this.db.assignments.batch(delObj)
      }.bind(this)
        )
      .then(function () {
        return this.db.assignments.batch(assignments)
      }.bind(this))
      .done(
      //success
      function () {
        this.flux.actions
          .updateAssignmentCacheSuccess();
      }.bind(this),
      //fail. If any methods up the chain throw an error they will propogate here.
      function (err) {
        this.flux.actions
          .updateAssignmentCacheFail(err);
      }.bind(this)
    )

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
   * Emits a change event from this store with the complete list of assignments
   */
  handleAssignmentsSynchronized: function () {
    // Fetch all assignments and tell the UI
    this.db.assignments.all(function (assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
  },

});

module.exports = AssignmentStore;
