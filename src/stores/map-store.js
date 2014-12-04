var _                             = require('lodash')
 ,  Fluxxor                       = require('fluxxor')
 ,  constants                     = require('../constants')
 ,  Immutable                     = require('immutable')
 ,  uuid                          = require('node-uuid')
 ,  TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
 ,  camelize                      = require('camelcase-keys')
 ,  log                           = require('debug')('map-store');


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
    log('initialize')
    var options             = options || {};
    this.db                 = options.db;
    this.currentAssignment  = null;
    this.loading            = false;
    this.error              = null;

    this.bindActions(
      constants.LOAD_ASSIGNMENTS, this.handleLoadAssignments,
      constants.LOAD_ASSIGNMENTS_SUCCESS, this.handleLoadAssignmentsSuccess,
      constants.LOAD_ASSIGNMENTS_FAIL, this.handleLoadAssignmentsFail,
      constants.LOAD_NODES_SUCCESS, this.handleLoadNodesSuccess,
      constants.SELECT_ASSIGNMENT, this.handleSelectAssignment
    );
  },

  getState: function () {
    log('getting map state')

    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  onDbSuccess: function () {
    log('db updated')
  },

  onDbFail: function (err) {
    log('db error ', err)
  },


  handleLoadAssignments: function() {
    log('handleLoadAssignments')
    this.loading = true;
    // this.emit('update-ui', constants.LOAD_ASSIGNMENTS)
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
    log('handleLoadAssignmentsSuccess');
    this.loading = false
    this.error  = null;
    var assignments = payload.assignments;
    
    //send assignments to the UI
    this.emit('update-ui', constants.ASSIGNMENTS_READY, { assignments: assignments })
  
    //NOTE IDB wrapper doesnt support putBatch for out-of-line keys
    assignments.forEach(function (assignment) {
      this.db.put(assignment.id, assignment, this.onDbSuccess, this.onDbFail)
    }.bind(this))
  },

  handleLoadAssignmentsFail: function (payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit('update-ui', constants.LOAD_ASSIGNMENTS_FAIL, { error: response.error });
  },

  handleLoadNodesSuccess: function (payload) {
    log('handleLoadNodesSuccess', log);
    this.waitFor(['NodeStore'], function (nodeStore) {
      //TODO search by currentAssignment index
      var nodes = nodeStore.getState().db
    })
  },

  handleSelectAssignment: function (payload) {
    log('handleSelectAssignment', payload)
    this.currentAssignment = payload.assignmentId;
    this.emit('update-ui', constants.CURRENT_ASSIGNMENT_CHANGED, payload)
  },


  onAddMap: function (payload) {
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