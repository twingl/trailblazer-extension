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
          this.dispatch(constants.lOAD_NODES_SUCCESS, { nodes: response.nodes })
        } else {
          this.dispatch(constants.lOAD_NODES_FAIL, { error: response.error })  
        }

      }.bind(this));
  }
}