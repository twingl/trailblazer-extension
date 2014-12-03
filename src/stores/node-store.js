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

    this.bindActions(
      constants.LOAD_NODES, this.handleLoadNodes,
      constants.LOAD_NODES_SUCCESS, this.handleLoadNodesSuccess,
      constants.LOAD_NODES_FAIL, this.handleLoadNodesFail
    );
  },

  getState: function () {
    console.log('getting node state')
    return {
      db: this.db,
      loading: this.loading,
      error: this.error
    };
  },

  onDbSuccess: function () {
    console.log('node db updated')
  },

  onDbFail: function (err) {
    console.log('node db error ', err)
  }, 

  handleloadNodes: function (assignmentId) {

    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(function(response) {
        console.log('response', response);
        if (response.error) {
          this.flux.actions.loadNodesFail(response.error)
        } else if (response.nodes) {
          this.flux.actions.loadNodesSuccess(response.nodes)
        }

      }.bind(this));


  },

  handleLoadNodesFail: function (error) {
    this.emit('update-ui', constants.LOAD_NODES_FAIL) 

  },


  handleLoadNodesSuccess: function (nodes) {
    var nodes = nodes.map(function (node) { return camelize(node) });

    //NOTE IDB wrapper doesnt support putBatch for out-of-line keys
    nodes.forEach(function (node) {
      this.db.put(node.id, node, this.onDbSuccess, this.onDbFail)
    }.bind(this))

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
