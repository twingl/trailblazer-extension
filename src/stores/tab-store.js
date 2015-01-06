var _         = require('lodash')
  , info      = require('debug')('stores/tab-store.js:info')
 ,  camelize  = require('camelize')
 ,  constants = require('../constants')
 ,  Fluxxor   = require('fluxxor')
 ,  RandomName = require('../util/random-name');


var TabStore = Fluxxor.createStore({

  initialize: function (options) {
    var options     = options || {};
    this.db         = options.db;
    this.tabs       = options.tabs || {};

    this.bindActions(
      constants.TAB_CREATED, this.handleTabCreated,
      constants.CREATED_NAVIGATION_TARGET, this.handleCreatedNavigationTarget,
      constants.TAB_UPDATED, this.handleTabUpdated,
      constants.HISTORY_STATE_UPDATED, this.handleHistoryStateUpdated,
      constants.WEB_NAV_COMMITTED, this.handleWebNavCommitted,
      constants.TAB_CLOSED, this.handleTabClosed,
      constants.TAB_REPLACED, this.handleTabReplaced,

      constants.START_RECORDING, this.handleStartRecording,
      constants.STOP_RECORDING, this.handleStopRecording
    );
  },

  getState: function () {
    return {
      tabs: this.tabs
    };
  },

  handleTabCreated: function (payload) {
    info("handleTabCreated:", { payload: payload });
    var parentId = payload.parentTabId;

    // Look up parent tab (if present) to see if we're recording it
    // If we are, add an entry into this.tabs
    if (parentId && this.tabs[parentId] === true) {
      // Copy over the assignment ID
      this.tabs[payload.tabId] = true;
      this.emit('change', this.getState());
    } else {
      this.tabs[payload.tabId] = false;
    }
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

  // Create an assignment and first node in a single transaction, marking the
  // tab as recording on success
  handleStartRecording: function (payload) {
    info("handleStartRecording:", { payload: payload });

    var success = function (evt) {
      info("handleStartRecording: success");
      this.tabs[payload.tabId] = true;
      payload.responder({ success: true });
    }.bind(this);

    var error = function (evt) {
      info("handleStartRecording: error");
      this.tabs[payload.tabId] = false;
      payload.responder({ success: false });
    }.bind(this);

    this.db.nodes.db.transaction("readwrite", ["nodes", "assignments"], function(err, tx) {
      tx.oncomplete = success;
      tx.onerror    = error;

      var assignmentStore = tx.objectStore("assignments")
        , nodeStore       = tx.objectStore("nodes");

      var assignment = {
        title:        "Untitled (" + RandomName.get() + ")",
        description:  "Created " + new Date().toDateString()
      };

      assignmentStore.add(assignment).onsuccess = function (evt) {
        // Update the object with the new local ID
        assignment.localId = evt.target.result;

        // Notify listeners that an assignment was created locally
        this.flux.actions.createAssignmentSuccess(assignment);

        var node = {
          localAssignmentId: evt.target.result,
          tabId:             payload.tabId,
          title:             payload.tabObj.title,
          url:               payload.tabObj.url
        };

        nodeStore.add(node).onsuccess = function (evt) {
          // Update the object with the new local ID
          node.localId = evt.target.result;

          // Notify listeners that a node was created locally
          this.flux.actions.createNodeSuccess(node);
        }.bind(this); //nodeStore.add
      }.bind(this); //assignmentStore.add
    }.bind(this)); //transaction
  },

  handleStopRecording: function (payload) {
    info("handleStopRecording:", { payload: payload });
    payload.responder();
    this.tabs[payload.tabId] = false;
  }

});

module.exports = TabStore;
