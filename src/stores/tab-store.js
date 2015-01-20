var _           = require('lodash')
  , info        = require('debug')('stores/tab-store.js:info')
  , camelize    = require('camelize')
  , constants   = require('../constants')
  , Fluxxor     = require('fluxxor')
  , RandomName  = require('../util/random-name');


var TabStore = Fluxxor.createStore({

  initialize: function (options) {
    var options     = options || {};
    this.db         = options.db;
    this.tabs       = options.tabs || {};

    this.bindActions(
      constants.SIGN_OUT,                   this.handleSignOut,

      constants.REQUEST_TAB_STATE,          this.handleRequestTabState,

      constants.TAB_TITLE_UPDATED,          this.handleTabTitleUpdated,

      constants.TAB_CREATED,                this.handleTabCreated,
      constants.TAB_FOCUSED,                this.handleTabFocused,
      constants.CREATED_NAVIGATION_TARGET,  this.handleCreatedNavigationTarget,
      constants.HISTORY_STATE_UPDATED,      this.handleHistoryStateUpdated,
      constants.WEB_NAV_COMMITTED,          this.handleWebNavCommitted,
      constants.TAB_UPDATED,                this.handleTabUpdated,
      constants.TAB_CLOSED,                 this.handleTabClosed,
      constants.TAB_REPLACED,               this.handleTabReplaced,

      constants.START_RECORDING,            this.handleStartRecording,
      constants.RESUME_RECORDING,           this.handleResumeRecording,
      constants.STOP_RECORDING,             this.handleStopRecording,
      constants.DESTROY_ASSIGNMENT,         this.handleDestroyAssignment
    );
  },

  getState: function () {
    return {
      tabs: this.tabs
    };
  },

  handleSignOut: function () {
    _.each(this.tabs, function(tab, index, tabs) {
      tabs[index] = false;
    });
    this.emit('change', this.getState());
  },

  handleTabTitleUpdated: function (payload) {
    info('handleTabTitleUpdated');
    this.db.nodes.index('tabId').get(payload.tabId).then(function(nodes) {
      var node = _.first(nodes);

      if (node && node.url === payload.url) {
        this.flux.actions.setNodeTitle(node.localId, payload.title);
      }
    }.bind(this));
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
    }
  },

  handleTabFocused: function (payload) {
    info("handleTabFocused:", { payload: payload });
    this.emit('change', this.getState());
  },

  handleCreatedNavigationTarget: function (payload) {
    info("handleCreatedNavigationTarget:", { payload: payload });
    throw "NotImplementedError";
  },

  handleHistoryStateUpdated: function (payload) {
    info("handleHistoryStateUpdated:", { payload: payload });
    this.emit('change', this.getState());
  },

  handleTabUpdated: function (payload) {
    info("handleTabUpdated:", { payload: payload });
    this.emit('change', this.getState());
  },

  handleWebNavCommitted: function (payload) {
    info("handleWebNavCommitted:", { payload: payload });
    this.emit('change', this.getState());
  },

  handleTabClosed: function (payload) {
    info("handleTabClosed:", { payload: payload });
    delete this.tabs[payload.tabId];
  },

  handleTabReplaced: function (payload) {
    info("handleTabReplaced:", { payload: payload });
    this.tabs[payload.newTabId] = this.tabs[payload.oldTabId];
    delete this.tabs[payload.oldTabId];
  },

  // Create an assignment and first node in a single transaction, marking the
  // tab as recording on success
  handleStartRecording: function (payload) {
    info("handleStartRecording:", { payload: payload });


    this.db.nodes.db.transaction("readwrite", ["nodes", "assignments"], function(err, tx) {

      // Create a queue of callbacks to execute when the transaction completes
      var successCallbacks = [];

      var assignmentStore = tx.objectStore("assignments")
        , nodeStore       = tx.objectStore("nodes");

      var assignment = {
        title:        "Untitled (" + RandomName.get() + ")",
        description:  "Created " + new Date().toDateString()
      };

      assignmentStore.add(assignment).onsuccess = function (evt) {
        // Update the object with the new local ID
        assignment.localId = evt.target.result;

        successCallbacks.push( function() {
          // Notify listeners that an assignment was created locally
          this.flux.actions.createAssignmentSuccess(assignment);
        }.bind(this));

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
          successCallbacks.push( function() {
            this.flux.actions.createNodeSuccess(node);
          }.bind(this));
        }.bind(this); //nodeStore.add
      }.bind(this); //assignmentStore.add

      tx.oncomplete = function (evt) {
        info("handleStartRecording: success");
        this.tabs[payload.tabId] = true;
        this.flux.actions.startRecordingSuccess(payload.tabId);
        _.each(successCallbacks, function(cb) { cb(); });
        this.emit('change', this.getState());
      }.bind(this);

      tx.onerror = function (evt) {
        info("handleStartRecording: error");
        this.tabs[payload.tabId] = false;
        this.flux.actions.startRecordingFail(payload.tabId);
      }.bind(this);
    }.bind(this)); //transaction
  },

  handleResumeRecording: function (payload) {
    info("handleResumeRecording");

    this.db.nodes.get(payload.localId).then(function(node) {
      if (payload.focus && node.tabId) {
        info("handleResumeRecording: success");
        this.tabs[node.tabId] = true;
        this.emit('change', this.getState());
      } else {
        chrome.tabs.create({ url: node.url }, function(tab) {
          this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
            tx.oncomplete = function (evt) {
              info("handleResumeRecording: success");
              this.tabs[tab.id] = true;
              this.emit('change', this.getState());
            }.bind(this);

            // Error handler
            tx.onerror = function (evt) {
              info("handleResumeRecording: error");
              this.flux.actions.resumeRecordingFail(payload.localId);
            }.bind(this);

            var nodeStore = tx.objectStore("nodes");

            nodeStore.get(payload.localId).onsuccess = function(evt) {
              var node = evt.target.result;

              node.tabId = tab.id;

              // Update the node record
              nodeStore.put(node);
            };
          }.bind(this)); //tx
        }.bind(this));//create tab
      }
    }.bind(this));

  },

  handleStopRecording: function (payload) {
    info("handleStopRecording:", { payload: payload });
    this.tabs[payload.tabId] = false;
    this.flux.actions.stopRecordingSuccess(payload.tabId);
    this.emit('change', this.getState());
  },

  handleDestroyAssignment: function (payload) {
    info("handleDestroyAssignment", { payload: payload });
    this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
      tx.oncomplete = function() {
        this.emit('change', this.getState());
      }.bind(this);
      // Get all nodes associated w/ asgmt, remove from tab array
      var nodeStore = tx.objectStore("nodes");

      nodeStore.index('localAssignmentId').openCursor(IDBKeyRange.only(payload.localId)).onsuccess = function(evt) {
        var cursor = evt.target.result;
        if (cursor) {
          if (cursor.value.tabId) {
            console.log("Removing tab! " + cursor);
            this.tabs[cursor.value.tabId] = false;
          }
          cursor.continue();
        }
      }.bind(this);
    }.bind(this));
  },

  handleRequestTabState: function (payload) {
    info("handleRequestTabState:", { payload: payload });
    if (this.tabs[payload.tabId]) {
      var state = {
        recording: this.tabs[payload.tabId],
        assignment: undefined,
        node: undefined
      };
      this.db.nodes.index('tabId').get(payload.tabId)
        .then(function(nodes) {
          var node = _.first(nodes);
          this.db.assignments.get(node.localAssignmentId)
            .then(function(assignment) {
              state.assignment = assignment;
              state.node = node;
              this.flux.actions.requestTabStateResponse(payload.tabId, state);
            }.bind(this));
        }.bind(this));
    } else {
      var state = {
        recording: false
      };
      this.flux.actions.requestTabStateResponse(payload.tabId, state);
    }
  }

});

module.exports = TabStore;
