var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , info                          = require('debug')('stores/map-store.js:info')
  , warn                          = require('debug')('stores/map-store.js:warn')
  , error                         = require('debug')('stores/map-store.js:error');

var MapStore = Fluxxor.createStore({

  initialize: function (options) {
    info('initialize')
    var options             = options || {};
    this.db                 = options.db;
    this.currentAssignment  = null;
    this.loading            = false;
    this.error              = null;

    this.bindActions(
      constants.SELECT_ASSIGNMENT, this.handleSelectAssignment,
      constants.ASSIGNMENTS_SYNCHRONIZED, this.handleAssignmentsSynchronised
    );
  },


  getState: function () {
    info('getting map state');
    return {
      //NOTE: Unsure if this is needed when the all stores can access the main dbObj
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  handleDispatchNodes: function (data) { //TBD
    this.emit('change', { nodes: data });
  },

  handleGetAllNodesFail: function (error) {
    warn('handleGetAllNodesFail', { error: error })
  },

  handleLoadNodesSuccess: function (payload) { //TBD
    info('handleLoadNodesSuccess', { payload: payload });
    this.waitFor(['NodeStore'], function (nodeStore) { //TBD
      //TODO search by currentAssignment index //TBD
      var nodes = nodeStore.getState().db.getAll(this.dispatchNodes, this.handleGetAllNodesFail) //TBD
    }.bind(this))
  },

  handleSelectAssignment: function (payload) { //TBD
    info('handleSelectAssignment', { payload: payload })
    this.currentAssignment = payload.assignmentId; //NO
  },

  handleAssignmentsSynchronised: function () {
    //NOTE: this is currently just a layer over assignmentStore
    this.waitFor(['AssignmentStore'], function (assignmentStore) {
      assignmentStore.db.assignments.all()
        .then(function (maps) {
            info('handleAssignmentsSynchronised', { maps: maps })
            this.emit('change', { 
              maps: maps, 
              //since this arrives in content as a 'change' action 
              //we need to be able to signal to the UI app to what kind of
              //change has occurred. Adding 'type' to the payload lets the switch/case
              //in content/app.js update UI state appropriately.
              type: constants.ASSIGNMENTS_SYNCHRONIZED 
            })
        }.bind(this))
    })
  }

});

module.exports = MapStore;
