var _       = require('lodash');
var Assignment = require('../model/assignment');

var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

var Fluxxor = require('fluxxor');

var constants = require('../constants');

var AssignmentStore = Fluxxor.createStore({

  initialize: function (options) {
    var options = options || {};
    this.assignmentInstances = options.assignments || {};
    this.loading = false;
    this.error = null;

    this.bindActions(
      constants.LOAD_ASSIGNMENTS, this.onLoadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.onLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.onLoadAssignmentsFail,

      constants.ADD_ASSIGNMENT, this.onAddAssignment,
      constants.ADD_ASSIGNMENT_SUCCESS, this.onAddAssignmentSuccess,
      constants.ADD_ASSIGNMENT_FAIL, this.onAddAssignmentFail
    );
  },

  getState: function () {
    return {
      assignments: this.assignmentInstances
    };
  },

  onLoadAssignments: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadAssignmentsSuccess: function(payload) {
    this.loading = false;
    this.error = null;

    this.assignmentInstances = payload.assignments.reduce(function(acc, assignment) {
      var id = assignment.id;
      acc[id] = assignment;
      return acc;
    }, {});
    this.emit("change");
  },

  onLoadAssignmentsFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit("change");
  },

  onAddAssignment: function(payload) {
    var assignment = payload.assignment;
    var id = assignment.id || Assignment._getId();
    this.assignmentInstances[id] = assignment;
    this.emit("change");
  },

  onAddAssignmentSuccess: function(payload) {
    var id = payload.assignment.id;
    this.assignmentInstances[id].status = "OK";
    this.emit("change");
  },

  onAddAssignmentFail: function(payload) {
    var id = payload.assignment.id;
    this.assignmentInstances[id].status = "ERROR";
    this.assignmentInstances[id].error = payload.error;
    this.emit("change");
  }

});

module.exports = AssignmentStore;