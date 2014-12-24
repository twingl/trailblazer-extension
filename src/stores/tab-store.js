var _         = require('lodash')
  , info      = require('debug')('stores/tab-store.js:info')
 ,  camelize  = require('camelize')
 ,  constants = require('../constants')
 ,  Fluxxor   = require('fluxxor');


var TabStore = Fluxxor.createStore({

  initialize: function (options) {
    var options     = options || {};
    this.tabIdMap   = options.tabIdMap || {};
    this.currentTabId = undefined;

    this.bindActions(
      constants.TAB_CREATED, this.handleTabCreated,
      constants.CREATED_NAVIGATION_TARGET, this.handleCreatedNavigationTarget,
      constants.TAB_UPDATED, this.handleTabUpdated,
      constants.HISTORY_STATE_UPDATED, this.handleHistoryStateUpdated,
      constants.WEB_NAV_COMMITTED, this.handleWebNavCommitted,
      constants.TAB_CLOSED, this.handleTabClosed,
      constants.TAB_REPLACED, this.handleTabReplaced

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

  handleCreatedNavigationTarget: function (payload) {
    info("handleCreatedNavigationTarget:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabUpdated: function (payload) {
    info("handleTabUpdated:", { payload: payload });
    throw "NotImplementedError";
  },

  handleHistoryStateUpdated: function (payload) {
    info("handleHistoryStateUpdated:", { payload: payload });
    throw "NotImplementedError";
  },

  handleWebNavCommitted: function (payload) {
    info("handleWebNavCommitted:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabClosed: function (payload) {
    info("handleTabClosed:", { payload: payload });
    throw "NotImplementedError";
  },

  handleTabReplaced: function (payload) {
    info("handleTabReplaced:", { payload: payload });
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
