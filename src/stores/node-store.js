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

  handleloadNodes: function (assignmentId) {

    new TrailblazerHTTPStorageAdapter()
      .list(["assignments", assignmentId, "nodes"].join("/"))
      .then(function(response) {
        console.log('response' response)
        if (response.error) { 
          this.flux.actions.loadNodesSuccess(response.nodes)
        } else if (response.nodes) {
          this.
        }

      }.bind(this));


  },

  handleLoadNodesFail: function (error) {
    this.emit('update-ui', constants.LOAD_NODES_FAIL) 

  },


  handleLoadNodesSuccess: function (nodes) {
    var nodes = nodes.map(function (node) { return camelize(node) });

    this.emit('update-ui', constants.NODES_READY, { nodes: nodes })

    var ops = nodes.map(function (node) { 
      return { type: 'put', key: node.id, value: node }
    });

    this.db.batch(ops, function (err) {
      if (err) throw err;
      console.log('nodes persisted')

      this.db.createReadStream()
        .on('data', function (data) {
          console.log(data.key, ' = ', data.value)
        })
        .on('end', function () {
          console.log("Stream closed")
        })
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
