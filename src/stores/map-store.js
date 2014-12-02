var _                             = require('lodash')
 ,  Fluxxor                       = require('fluxxor')
 ,  constants                     = require('../constants')
 ,  Immutable                     = require('immutable')
 ,  uuid                          = require('node-uuid')
 ,  TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
 ,  camelize                      = require('camelcase-keys');

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
    var options = options || {};
    this.db     = options.db;
    this.loading = false;
    this.error = null;

    this.bindActions(
      constants.LOAD_ASSIGNMENTS, this.loadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.handleLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.handleLoadAssignmentsFail,
      constants.PERSIST_ASSIGNMENTS, this.persistAssignments

      // constants.ADD_ASSIGNMENT, this.onAddMap,
      // constants.ADD_ASSIGNMENT_SUCCESS, this.onAddMapSuccess,
      // constants.ADD_ASSIGNMENT_FAIL, this.onAddMapFail
    );
  },

  getState: function () {
    console.log('getting map state')

    // return {
    //   mapObj: this.mapObj,
    //   loading: this.loading,
    //   error: this.error
    // };
  },

  loadAssignments: function() {
    this.loading = true;
    // this.emit('update-ui', constants.LOAD_ASSIGNMENTS)

    console.log('onLoadAssignments fired')
    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(function(response) {
        console.log('response in load assignments action', response, constants.LOAD_ASSIGNMENTS_SUCCESS)
        if (response.assignments) {
          this.emit(
            constants.LOAD_ASSIGNMENTS_SUCCESS, 
            { assignments: response.assignments }
          )
        } else {

        }

      }.bind(this));
  },

  handleLoadAssignmentsSuccess: function(payload) {
    console.log('handleLoadAssignmentsSuccess fired')
    var assignments = payload.assignments.map(function (assignment) { return camelize(assignment) });
    var payload = { assignments: assignments };
    this.emit(constants.PERSIST_ASSIGNMENTS, payload);
    this.emit('update-ui', constants.ASSIGNMENTS_READY, payload)
  },

  handleLoadAssignmentsFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit('update-ui', constants.LOAD_ASSIGNMENTS_FAIL, { error: response.error });
  },

  persistAssignments: function(payload) {
    console.log('PERSIST_ASSIGNMENTS fired')
    var ops = payload.assignments.map(function (assignment) { 
      return { type: 'put', key: assignment.id, value: assignment }
    });

    this.db.batch(ops, function (err) {
      if (err) throw err;
      console.log('assignments persisted')
    })
  },

  onAddMap: function(payload) {
    var node = payload.node;
    var id = node.id || Node._getId();
    this.mapObj.set(id, node);
    this.emit("change");
  },

  onAddMapSuccess: function(payload) {
    var id = payload.node.id;
    this.mapObj.updateIn([id, 'status'], function(val) { return "OK" });
    this.emit("change");
  },

  onAddMapFail: function(payload) {
    var id = payload.node.id;
    this.mapObj.updateIn([id, 'status'], function(val) { return "ERROR" });
    this.mapObj.updateIn([id, 'error'], function(val) { return payload.error });
    this.emit("change");Map
  }

});

module.exports = MapStore;