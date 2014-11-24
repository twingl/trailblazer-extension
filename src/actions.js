var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');

module.exports = {
  loadNodes: function (assignmentId) {
    this.dispatch(constants.LOAD_NODES);

    // Request nodes from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(function(response) {
        console.log('response in actions', response, constants)
        if (response.nodes) { 
          this.dispatch(constants.LOAD_NODES_SUCCESS, { nodes: response.nodes })
        } else {
          this.dispatch(constants.LOAD_NODES_FAIL, { error: response.error })  
        }

      }.bind(this));
  },

  loadAssignments: function () {
    this.dispatch(constants.LOAD_ASSIGNMENTS);
    console.log('load assignments action')

    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(function(response) {
        console.log('response in load assignments action', response, constants.LOAD_ASSIGNMENTS_SUCCESS)
        if (response) {
          this.dispatch(constants.LOAD_ASSIGNMENTS_SUCCESS, { assignments: response.assignments })
        } else {
          this.dispatch(constants.LOAD_ASSIGNMENTS_FAIL, { error: response.error })  
        }

      }.bind(this));
  },

  pageMode: function (mode) {
    


  }
}