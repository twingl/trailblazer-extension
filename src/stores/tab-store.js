var _         = require('lodash')
  , info      = require('debug')('stores/tab-store.js:info')
 ,  camelize  = require('camelize')
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
      constants.TAB_CREATED, this.handleTabCreated,
      constants.TAB_UPDATED, this.handleTabUpdated,
      constants.TAB_CLOSED, this.handleTabClosed
      // constants.START_RECORDING, this.handleStartRecording,
      // constants.STOP_RECORDING, this.handleStopRecording
    );
  },

  getState: function () {
    return {
      tabIdMap: this.tabIdMap,
      currentTabId: this.currentTabId
    };
  },

  handleTabCreated: function (payload) {
    info("handleTabCreated:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabUpdated: function (payload) {
    info("handleTabUpdated:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabClosed: function (payload) {
    info("handleTabClosed:", { payload: payload });
    throw "NotImplementedError";
  },

  handleStartRecording: function (payload) {
    info("handleStartRecording:", { payload: payload });
    throw "NotImplementedError";
  },

  handleStopRecording: function (payload) {
    info("handleStopRecording:", { payload: payload });
    throw "NotImplementedError";
  }

});

module.exports = TabStore;
