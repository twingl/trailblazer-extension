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
    var options   = options || {};
    this.db       = options.db;
    this.loading  = false;
    this.error     = null;

    console.log('this' ,this)

    this.bindActions(
      constants.LOAD_ASSIGNMENTS, this.handleLoadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.handleLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.handleLoadAssignmentsFail
    );
  },

  getState: function () {
    console.log('getting map state')

    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  onDbSuccess: function () {
    console.log('db updated')
  },

  onDbFail: function (err) {
    console.log('db error ', err)
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
    this.loading = false
    this.error  = null;
    console.log('handleLoadAssignmentsSuccess fired');
    var assignments = payload.assignments;
    
    //send assignments to the UI
    this.emit('update-ui', constants.ASSIGNMENTS_READY, { assignments: assignments })
  
    //NOTE IDB wrapper doesnt support putBatch for out-of-line keys
    assignments.forEach(function (assignment) {
      this.db.put(assignment.id, assignment, this.onDbSuccess, this.onDbFail)
    }.bind(this))
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