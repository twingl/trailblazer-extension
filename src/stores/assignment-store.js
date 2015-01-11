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
      constants.DESTROY_ASSIGNMENT, this.handleDestroyAssignment,
      constants.REQUEST_ASSIGNMENTS, this.handleRequestAssignments,
      constants.FETCH_ASSIGNMENTS, this.handleFetchAssignments,
      constants.FETCH_ASSIGNMENTS_SUCCESS, this.handleFetchAssignmentsSuccess,
      constants.FETCH_ASSIGNMENTS_FAIL, this.handleFetchAssignmentsFail,
      constants.UPDATE_ASSIGNMENT_CACHE, this.handleUpdateAssignmentCache,
      constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS, this.handleUpdateAssignmentCacheSuccess,
      constants.UPDATE_ASSIGNMENT_CACHE_FAIL, this.handleUpdateAssignmentCacheFail,
      constants.UPDATE_ASSIGNMENT_TITLE, this.handleUpdateAssignmentTitle,
      constants.ASSIGNMENTS_SYNCHRONIZED, this.handleAssignmentsSynchronized
    );
  },

  handleDestroyAssignment: function (payload) {
    this.db.assignments.get(payload.localId).then(function(assignment) {

      // Fire API deletion
      this.db.assignments.del(payload.localId).then(function() {

        this.db.assignments.all().then(function(assignments) {
          this.emit('change', { assignments: assignments });
        }.bind(this));

      }.bind(this));

    }.bind(this));
  },

  handleRequestAssignments: function () {
    // Get the assignments from the DB, fire a change, and fire a fetch assignments
    this.db.assignments.all().then(function(assignments) {
      this.emit('change', { assignments: assignments });
      this.flux.actions.fetchAssignments();
    }.bind(this));
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
    info("Assignments", assignments);

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
   * Updates an assignment record with a new title
   */
  handleUpdateAssignmentTitle: function (payload) {
    info('handleUpdateAssignmentTitle', { payload: payload });
    this.db.assignments.db.transaction("readwrite", ["assignments"], function(err, tx) {
      var store = tx.objectStore("assignments");

      store.get(payload.localId).onsuccess = function(evt) {
        var assignment = evt.target.result;

        assignment.title = payload.title;
        store.put(assignment).onsuccess = function(evt) {
          this.emit('change', { assignment: assignment });
        }.bind(this);
      }.bind(this);
    }.bind(this));
  },

  /**
   * Emits a change event from this store with the complete list of assignments
   */
  handleAssignmentsSynchronized: function () {
    this.db.assignments.all().then(function(assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
  }

});

module.exports = AssignmentStore;
