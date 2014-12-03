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

    console.log('this' ,this)

    this.bindActions(
      constants.LOAD_ASSIGNMENTS, this.handleLoadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.handleLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.handleLoadAssignmentsFail
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

  handleLoadAssignments: function() {
    this.loading = true;
    // this.emit('update-ui', constants.LOAD_ASSIGNMENTS)

    console.log('onLoadAssignments fired')
    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(function(response) {
        console.log('response in load assignments action', response, constants.LOAD_ASSIGNMENTS_SUCCESS)
        if (response.assignments) {
          console.log('this actions', this.flux.actions)
          this.flux.actions.loadAssignmentsSuccess(response.assignments);
        } else {

        }

      }.bind(this));
  },

  handleLoadAssignmentsSuccess: function(payload) {
    console.log('handleLoadAssignmentsSuccess fired');
    var assignments = payload.assignments;
    
    this.emit('update-ui', constants.ASSIGNMENTS_READY, { assignments: assignments })
  
    var ops = assignments.map(function (assignment) { 
      return { type: 'put', key: assignment.id, value: assignment }
    });

    this.db.batch(ops, function (err) {
      if (err) throw err;
      console.log('assignments persisted')
    })
    
  },

  handleLoadAssignmentsFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit('update-ui', constants.LOAD_ASSIGNMENTS_FAIL, { error: response.error });
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