var constants = require('./constants');
var TrailblazerHTTPStorageAdapter = require('./adapter/trailblazer_http_storage_adapter');

module.exports = {
  // loadNodes: function (assignmentId) {
  //   this.dispatch(constants.LOAD_NODES);
  // },

  loadMaps: function () {
    this.dispatch(constants.LOAD_MAPS);
    console.log('load assignments action')
  }

  // createdTab: function () {
  //   this.dispatch(constants.CREATED_TAB);

    


  // },

  // closedTab: function () {
    
  // }
}