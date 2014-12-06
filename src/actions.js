var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');
var info = require('debug')('actions.js:info');

module.exports = {

  loadAssignments: function () {
    info('loadAssignments')
    this.dispatch(constants.LOAD_ASSIGNMENTS);
  },

  loadNodes: function (assignmentId) {
    info('loadNodes')
    this.dispatch(constants.LOAD_NODES, {assignmentId: assignmentId});
  },

  loadAssignmentsSuccess: function (assignments) {
    info('loadAssignmentsSuccess')
    this.dispatch(constants.LOAD_ASSIGNMENTS_SUCCESS, { assignments: assignments })
  },

  loadNodesSuccess: function (nodes) {
    info('loadNodesSuccess')
    this.dispatch(constants.LOAD_NODES_SUCCESS, { nodes: nodes })
  },

  //UI ACTIONS. Dispatch is overwritten in UI and passes a message through runtime
  //which then calls the *same* method in background. [Mind Blown]
  selectAssignment: function (assignmentId) {
    info('selectAssignment');
    this.dispatch(constants.SELECT_ASSIGNMENT, { assignmentId: assignmentId });
  }

  

  // createdTab: function () {
  //   this.dispatch(constants.CREATED_TAB);

    


  // },

  // closedTab: function () {
    
  // }
}
