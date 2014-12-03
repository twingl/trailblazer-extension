var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');
var log = require('debug')('actions');

module.exports = {

  loadAssignments: function () {
    log('loadAssignments')
    this.dispatch(constants.LOAD_ASSIGNMENTS);
  },

  loadNodes: function (assignmentId) {
    log('loadNodes')
    this.dispatch(constants.LOAD_NODES, {assignmentId: assignmentId});
  },

  loadAssignmentsSuccess: function (assignments) {
    log('loadAssignmentsSuccess')
    this.dispatch(constants.LOAD_ASSIGNMENTS_SUCCESS, { assignments: assignments })
  },

  loadNodesSuccess: function (assignments) {
    log('loadNodesSuccess')
    this.dispatch(constants.LOAD_NODES_SUCCESS, { nodes: nodes })
  },

  

  // createdTab: function () {
  //   this.dispatch(constants.CREATED_TAB);

    


  // },

  // closedTab: function () {
    
  // }
}