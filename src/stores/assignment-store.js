var _         = require('lodash')
 ,  Fluxxor   = require('fluxxor')
 ,  constants = require('../constants')
 ,  Immutable = require('immutable')
 ,  uuid      = require('node-uuid');

var AssignmentStore = Fluxxor.createStore({

  initialize: function (options) {
    var options = options || {};
    this.assignmentMap = options.assignmentMap || {};
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
    console.log('getting assignment state')

    return {
      assignmentMap: this.assignmentMap
    };
  },

  onLoadAssignments: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadAssignmentsSuccess: function(payload) {
    this.loading = false;
    this.error = null;


    //make an immutable map.
    var map = payload.assignments
      .reduce(function(acc, assignment) {
        console.log('reducing', acc, assignment)
        var id = assignment.id;
        acc[id] = assignment;
        return acc;
      }, {});

    this.assignmentMap = Immutable.fromJS(map);

    this.emit("change");
  },

  onLoadAssignmentsFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit("change");
  },

  onAddAssignment: function(payload) {
    var node = payload.node;
    var id = node.id || Node._getId();
    this.assignmentMap.set(id, node);
    this.emit("change");
  },

  onAddAssignmentSuccess: function(payload) {
    var id = payload.node.id;
    this.assignmentMap.updateIn([id, 'status'], function(val) { return "OK" });
    this.emit("change");
  },

  onAddAssignmentFail: function(payload) {
    var id = payload.node.id;
    this.assignmentMap.updateIn([id, 'status'], function(val) { return "ERROR" });
    this.assignmentMap.updateIn([id, 'error'], function(val) { return payload.error });
    this.emit("change");Assignment
  }

});

module.exports = AssignmentStore;