var _         = require('lodash')
 ,  camelize  = require('camelcase-keys')
 ,  constants = require('../constants')
 ,  Fluxxor   = require('fluxxor');

//TODO 
// handleTabCreated
// handleTabUpdated
// handleTabClosed
// handleStopRecording
// handleStartRecording


var TabStore = Fluxxor.createStore({

  initialize: function (options) {
    var options     = options || {};
    this.tabIdMap   = options.tabIdMap || {};
    this.currentTabId = undefined;

    this.bindActions(
      constants.TAB_CREATED,  this.handleTabCreated,
      constants.TAB_UPDATED, this.handleTabUpdated,
      constants.TAB_CLOSED, this.handleTabClosed,
      constants.STOP_RECORDING, this.handleStopRecording, 
      constants.START_RECORDING, this.handleStartRecording    );
  },

  getState: function () {
    return {
      tabIdMap: this.tabIdMap,
      currentTabId: this.currentTabId
    };
  },

  handleTabCreated: function (payload) {
    var tabObj = payload.tabObj;
    var nodeStub

    this.tabIdMap[tabId] = nodeStub;
  },

  handleTabUpdated: function (payload) {
    // body...
  },

  handleTabClosed: function (payload) {

    this.waitFor(['NodeStore'], function (nodeStore) {
      var tabId = payload.tabId;
      var node = tabIdMap[tabId];

      if (node) {
        delete tabIdMap[tabId]
      }


    })
  },

  handleTabFocused: function (payload) {
    this.currentTabId = payload.tabId;
  },

  handleStartRecording: function (payload) {
    var tabId = payload.tabId;

    var assignment = new Assignment();
    var nodeStub = new Node();

    this.tabIdMap[tabId] = nodeStub;


  }




});

module.exports = TabStore;