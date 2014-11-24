var _         = require('lodash')
 ,  camelize  = require('camelcase-keys')
 ,  constants = require('../constants')
 ,  Immutable = require('immutable')
 ,  Fluxxor   = require('fluxxor');

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
      constants.ADD_NODE_FAIL, this.onAddNodeFail
    );
  },

  getState: function () {
    console.log('getting node state')
    return {
      nodeMap: this.nodeMap,
      tabIdMap: this.tabIdMap
    };
  },

  onLoadNodes: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadNodesSuccess: function(payload) {
    this.loading = false;
    this.error = null;

    var nodes = Immutable.List(payload.nodes);
    console.log('nodes in onLoadNodesSuccess', nodes)

    var map = payload.nodes.reduce(function(acc, node) {
      var id = node.id;
      acc[id] = camelize(node);
      return acc;
    }, {});

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
  }

});

module.exports = NodeStore;