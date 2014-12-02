var _         = require('lodash')
 ,  camelize  = require('camelcase-keys')
 ,  constants = require('../constants')
 ,  Immutable = require('immutable')
 ,  Fluxxor   = require('fluxxor');

 var TrailblazerHTTPStorageAdapter = require('../adapter/trailblazer_http_storage_adapter');



var NodeStore = Fluxxor.createStore({

  initialize: function (options) {
    var options   = options || {};

    // Instance of IDBDatabase
    this.db       = options.db;
    this.loading  = false;
    this.error    = null;

    // this.bindActions(
    //   constants.LOAD_NODES, this.onLoadNodes,
    //   constants.LOAD_NODES_SUCCESS, this.onLoadNodesSuccess,
    //   constants.LOAD_NODES_FAIL, this.onLoadNodesFail,

    //   constants.ADD_NODE, this.onAddNode,
    //   constants.ADD_NODE_SUCCESS, this.onAddNodeSuccess,
    //   constants.ADD_NODE_FAIL, this.onAddNodeFail,
    //   constants.TAB_CREATED, this.handleTabCreated
    // );
  },

  getState: function () {
    console.log('getting node state')
    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  loadNodes: function (assignmentId) {

    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(function(response) {
        if (response.error) this.emit('update-ui', constants.LOAD_NODES_FAIL)

      }.bind(this));


  },



  onTabCreated: function(tab) {
    // This is, presently, just a kind of pseudo code until flux is wired up on
    // the background.
    waitFor(["tabStore"], function(tabStore) {
      var objectStore = db.transaction(["nodes"], "readwrite").objectStore("nodes");

      var request = objectStore.index("tabId").get(tab.id).onsuccess = function(evt) {
        console.log("onTabCreated: nodes.where tabId = tab.id", evt.target.result);
      };
    });
    throw "NotImplemented";
  },

  onTabUpdated: function() {
    throw "NotImplemented";
  },

  onTabClosed: function() {
    throw "NotImplemented";
  },

  onStartRecording: function() {
    throw "NotImplemented";
  },

  onStopRecording: function() {
    throw "NotImplemented";
  },

  onMarkedAsWaypoint: function() {
    throw "NotImplemented";
  }




});

module.exports = NodeStore;
