var _                             = require('lodash')
  , Fluxxor                       = require('fluxxor')
  , constants                     = require('../constants')
  , TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter')
  , camelize                      = require('camelcase-keys')
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
//      constants.FETCH_ASSIGNMENTS, this.handleFetchAssignments,
//      constants.FETCH_ASSIGNMENTS_SUCCESS, this.handleFetchAssignmentsSuccess,
//      constants.FETCH_ASSIGNMENTS_FAIL, this.handleFetchAssignmentsFail,
//      constants.UPDATE_ASSIGNMENT_CACHE, this.handleUpdateAssignmentCache,
//      constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS, this.handleUpdateAssignmentCacheSuccess,
//      constants.UPDATE_ASSIGNMENT_CACHE_FAIL, this.handleUpdateAssignmentCacheFail,
//      constants.ASSIGNMENTS_SYNCHRONIZED, this.handleAssignmentsSynchronized,
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

  handleDispatchNodes: function (data) {
    this.emit('change', { nodes: data });
  },

  handleGetAllNodesFail: function (error) {
    warn('handleGetAllNodesFail', { error: error })
  },

  handleLoadNodesSuccess: function (payload) {
    info('handleLoadNodesSuccess', { payload: payload });
    this.waitFor(['NodeStore'], function (nodeStore) {
      //TODO search by currentAssignment index
      var nodes = nodeStore.getState().db.getAll(this.dispatchNodes, this.handleGetAllNodesFail)
    }.bind(this))
  },

  handleSelectAssignment: function (payload) {
    info('handleSelectAssignment', { payload: payload })
    this.currentAssignment = payload.assignmentId; //NO
  }

});

module.exports = MapStore;
