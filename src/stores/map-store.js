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
      constants.LOAD_NODES_SUCCESS, this.handleLoadNodesSuccess,
      constants.SELECT_ASSIGNMENT, this.handleSelectAssignment
    );
  },

  getState: function () {
    info('getting map state');

    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  onDbFail: function (err) {
    error('db error', { error: err });
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
  }

});

module.exports = MapStore;
