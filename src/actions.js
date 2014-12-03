var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');

module.exports = {

  loadAssignments: function () {
    this.dispatch(constants.LOAD_ASSIGNMENTS);
    console.log('load assignments action')
  },

  loadNodes: function (assignmentId) {
    this.dispatch(constants.LOAD_NODES, {payload: assignmentId});
    console.log('load nodes action')
  },

  loadAssignmentsSuccess: function (assignments) {
    console.log('loadAssignmentsSuccess fired')
    this.dispatch(constants.LOAD_ASSIGNMENTS_SUCCESS, { assignments: assignments })
  },

  persistAssignments: function (assignments) {
    console.log('persistAssignments fired', constants)
    this.dispatch(constants.PERSIST_ASSIGNMENTS, { assignments: assignments });
  }

  

  // createdTab: function () {
  //   this.dispatch(constants.CREATED_TAB);

    


  // },

  // closedTab: function () {
    
  // }
}