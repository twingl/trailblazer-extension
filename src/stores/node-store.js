var _         = require('lodash')
 ,  camelize  = require('camelcase-keys')
 ,  constants = require('../constants')
 ,  Immutable = require('immutable')
 ,  Fluxxor   = require('fluxxor');


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


  //onLoadNodes: function() {
  //  this.loading = true;
  //  this.emit("change");
  //},

  //onLoadNodesSuccess: function(payload) {
  //  this.loading = false;
  //  this.error = null;

  //  // var map = payload.nodes.reduce(function(map, node) {
  //  //   var id = node.id;
  //  //   map[id] = camelize(node);
  //  //   return map;
  //  // }, {});

  //  // //TODO currently overwrites, should merge.
  //  // this.nodeMap  = Immutable.fromJS(map);

  //  this.emit("change");
  //},

  //onLoadNodesFail: function(payload) {
  //  this.loading = false;
  //  this.error = payload.error;
  //  this.emit("change");
  //},

  //onAddNode: function(payload) {
  //  var node = payload.node;
  //  var id = node.id || Node._getId();
  //  this.nodeMap.set(id, node);
  //  this.emit("change");
  //},

  //onAddNodeSuccess: function(payload) {
  //  var id = payload.node.id;
  //  this.nodeMap.updateIn([id, 'status'], function(val) { return "OK" });
  //  this.emit("change");
  //},

  //onAddNodeFail: function(payload) {
  //  var id = payload.node.id;
  //  this.nodeMap.updateIn([id, 'status'], function(val) { return "ERROR" });
  //  this.nodeMap.updateIn([id, 'error'], function(val) { return payload.error });
  //  this.emit("change");
  //},

  //handleTabCreated: function (payload) {
  //  var node;
  //  var tabId = payload.data.tabId;
  //  var nodeId = this.tabIdMap[tabIdMap];

  //  if (nodeId) {
  //  // This is a resumed node

  //  } else {
  //  // This is a new node
  //    node = new Node({
  //      url: payload.data.url,
  //      title: payload.data.title,
  //      tabId: tabId
  //    });

  //  }


  //}

});

module.exports = NodeStore;
