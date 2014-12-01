var _                             = require('lodash')
 ,  Fluxxor                       = require('fluxxor')
 ,  constants                     = require('../constants')
 ,  Immutable                     = require('immutable')
 ,  uuid                          = require('node-uuid')
 ,  TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');

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
      constants.LOAD_ASSIGNMENTS, this.onLoadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.onLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.onLoadAssignmentsFail

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

  onLoadAssignments: function() {
    this.loading = true;
    this.emit('change', constants.LOAD_ASSIGNMENTS)

    console.log('onLoadAssignments fired')
    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(function(response) {
        console.log('response in load assignments action', response, constants.LOAD_ASSIGNMENTS_SUCCESS)
        if (response.assignments) {
          this.emit(
            'change',
            constants.LOAD_ASSIGNMENTS_SUCCESS, 
            { assignments: response.assignments}
          )
        } else {

        }

      }.bind(this));
  },

  onLoadAssignmentsSuccess: function(payload) {
    this.emit("change", constants.LOAD_ASSIGNMENTS_SUCCESS, payload);
  },

  onLoadAssignmentsFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit('change', constants.LOAD_ASSIGNMENTS_FAIL, { error: response.error });
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