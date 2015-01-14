var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , info                          = require('debug')('stores/assignment-store.js:info')
  , warn                          = require('debug')('stores/assignment-store.js:warn')
  , error                         = require('debug')('stores/assignment-store.js:error');

var AssignmentStore = Fluxxor.createStore({

  initialize: function (options) {
    info('initialize', { options: options })
    var options             = options || {};
    this.db                 = options.db;

    info('bindActions', { this: this })

    this.bindActions(
      constants.CREATE_ASSIGNMENT_SUCCESS, this.handleCreateAssignmentSuccess,
      constants.DESTROY_ASSIGNMENT, this.handleDestroyAssignment,
      constants.REQUEST_ASSIGNMENTS, this.handleRequestAssignments,
      constants.UPDATE_ASSIGNMENT_TITLE, this.handleUpdateAssignmentTitle,
      constants.ASSIGNMENTS_SYNCHRONIZED, this.handleAssignmentsSynchronized
    );
  },

  handleCreateAssignmentSuccess: function () {
    this.db.assignments.all().then( function (assignments) {
      this.emit('change', { assignments: assignments });
    }.bind(this));
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
