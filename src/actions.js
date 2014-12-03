var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');

module.exports = {

  loadAssignments: function () {
    this.dispatch(constants.LOAD_ASSIGNMENTS);
    console.log('load assignments action')
  },

  loadNodes: function (assignmentId) {
    this.dispatch(constants.LOAD_NODES, {assignmentId: assignmentId});
    console.log('load nodes action')
  },

  loadAssignmentsSuccess: function (assignments) {
    console.log('loadAssignmentsSuccess fired')
    this.dispatch(constants.LOAD_ASSIGNMENTS_SUCCESS, { assignments: assignments })
  },

  loadNodesSuccess: function (assignments) {
    console.log('loadNodesSuccess fired')
    this.dispatch(constants.LOAD_NODES_SUCCESS, { nodes: nodes })
  },

  

  // createdTab: function () {
  //   this.dispatch(constants.CREATED_TAB);

    


  // },

  // closedTab: function () {
    
  // }
}