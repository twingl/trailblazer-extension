var _         = require('lodash')
 ,  camelize  = require('camelcase-keys')
 ,  constants = require('../constants')
 ,  Immutable = require('immutable')
 ,  Fluxxor   = require('fluxxor');

//TODO 
// handleTabCreated
// handleTabUpdated
// handleTabClosed
// handleStopRecording
// handleMarkedAsWaypoint

var NodeStore = Fluxxor.createStore({

  initialize: function (options) {
    var options         = options || {};
    this.nodeMap        = options.nodeMap || {};
    this.tabIdMap       = options.tabIdMap || {};
    this.loading        = false;
    this.error          = null;

    this.bindActions(
      constants.LOAD_NODES, this.onLoadNodes,
      constants.LOAD_NODES_SUCCESS, this.onLoadNodesSuccess,
      constants.LOAD_NODES_FAIL, this.onLoadNodesFail,

      constants.ADD_NODE, this.onAddNode,
      constants.ADD_NODE_SUCCESS, this.onAddNodeSuccess,
      constants.ADD_NODE_FAIL, this.onAddNodeFail,
      constants.TAB_CREATED, this.handleTabCreated
    );
  },

  getState: function () {
    console.log('getting node state')
    return {
      nodeMap: this.nodeMap,
      loading: this.loading,
      error: this.error
    };
  },

  onLoadNodes: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadNodesSuccess: function(payload) {
    this.loading = false;
    this.error = null;

    var map = payload.nodes.reduce(function(map, node) {
      var id = node.id;
      map[id] = camelize(node);
      return map;
    }, {});

    //TODO currently overwrites, should merge.
    this.nodeMap  = Immutable.fromJS(map);

    this.emit("change");
  },

  onLoadNodesFail: function(payload) {
    this.loading = false;
    this.error = payload.error;
    this.emit("change");
  },

  onAddNode: function(payload) {
    var node = payload.node;
    var id = node.id || Node._getId();
    this.nodeMap.set(id, node);
    this.emit("change");
  },

  onAddNodeSuccess: function(payload) {
    var id = payload.node.id;
    this.nodeMap.updateIn([id, 'status'], function(val) { return "OK" });
    this.emit("change");
  },

  onAddNodeFail: function(payload) {
    var id = payload.node.id;
    this.nodeMap.updateIn([id, 'status'], function(val) { return "ERROR" });
    this.nodeMap.updateIn([id, 'error'], function(val) { return payload.error });
    this.emit("change");
  },

  handleTabCreated: function (payload) {
    var node;
    var tabId = payload.data.tabId;
    var nodeId = this.tabIdMap[tabIdMap];

    if (nodeId) {
    // This is a resumed node

    } else {
    // This is a new node
      node = new Node({
        url: payload.data.url,
        title: payload.data.title,
        tabId: tabId
      });

    }


  }

});

module.exports = NodeStore;