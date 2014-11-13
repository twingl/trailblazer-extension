var _       = require('lodash');
var Node = require('../model/node');

var Fluxxor = require('fluxxor');

var constants = require('../constants');

var NodeStore = Fluxxor.createStore({

  initialize: function (options) {
    var options = options || {};
    this.nodeInstances = options.nodes || {};
    this.loading = false;
    this.error = null;

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
    return {
      nodes: this.nodeInstances
    };
  },

  onLoadNodes: function() {
    this.loading = true;
    this.emit("change");
  },

  onLoadNodesSuccess: function(payload) {
    this.loading = false;
    this.error = null;

    this.nodeInstances = payload.nodes.reduce(function(acc, node) {
      var id = node.id;
      acc[id] = node;
      return acc;
    }, {});
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
    this.nodeInstances[id] = node;
    this.emit("change");
  },

  onAddNodeSuccess: function(payload) {
    var id = payload.node.id;
    this.nodeInstances[id].status = "OK";
    this.emit("change");
  },

  onAddNodeFail: function(payload) {
    var id = payload.node.id;
    this.nodeInstances[id].status = "ERROR";
    this.nodeInstances[id].error = payload.error;
    this.emit("change");
  }

});

module.exports = NodeStore;