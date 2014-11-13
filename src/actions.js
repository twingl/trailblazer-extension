var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');

module.exports = {
  loadNodes: function (assignmentId) {
    this.dispatch({type: constants.lOAD_NODES});

    // Request nodes from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(function(response) {
        console.log('response in actions', response, constants)
        if (response.nodes) { 
          this.dispatch({
            type: constants.lOAD_NODES_SUCCESS, 
            payload: { nodes: response.nodes }
          })
        } else {
          this.dispatch({
            type: constants.lOAD_NODES_FAIL, 
            payload: { error: response.error }
          })  
        }

      }.bind(this));
  },

  loadAssignments: function () {
    this.dispatch({type: constants.lOAD_ASSIGMENTS});

    // Request assignments from the storage adapter
    new TrailblazerHTTPStorageAdapter()
      .list("assignments")
      .then(function(response) {
        if (response.assignments) { 
          this.dispatch({
            type: constants.lOAD_ASSIGMENTS_SUCCESS, 
            payload: { assignments: response.assignments }
          })
        } else {
          this.dispatch({
            type: constants.lOAD_ASSIGNMENTS_FAIL, 
            payload: { error: response.error }
          })  
        }

      }.bind(this));
  }
}