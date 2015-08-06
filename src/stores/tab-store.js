import _          from 'lodash';
import Logger     from '../util/logger';
import camelize   from 'camelize';
import constants  from '../constants';
import RandomName from '../util/random-name';

import Store from '../lib/store';
import { query, action, deprecated } from '../decorators';

var logger = new Logger('stores/tab-store.js');

class TabStore extends Store {

  constructor (options = {}) {
    super(options);

    this.db         = options.db;
    this.tabs       = options.tabs || {};
  }

  getState() {
    return {
      tabs: this.tabs
    };
  }

  @action(constants.SIGN_OUT)
  handleSignOut() {
    _.each(this.tabs, function(tab, index, tabs) {
      tabs[index] = false;
    });
    this.emit('change', this.getState());
  }

  @action(constants.TAB_TITLE_UPDATED)
  handleTabTitleUpdated(payload) {
    logger.info('handleTabTitleUpdated');
    this.db.nodes.index('tabId').get(payload.tabId).then(function(nodes) {
      var node = _.first(nodes);

      if (node && node.url === payload.url) {
        this.flux.actions.setNodeTitle(node.localId, payload.title);
      }
    }.bind(this));
  }

  @action(constants.TAB_CREATED)
  handleTabCreated(payload) {
    logger.info("handleTabCreated:", { payload: payload });
    var parentId = payload.parentTabId;

    // Look up parent tab (if present) to see if we're recording it
    // If we are, add an entry into this.tabs
    if (parentId && this.tabs[parentId] === true) {
      // Copy over the assignment ID
      this.tabs[payload.tabId] = true;
      this.emit('change', this.getState());
    }
  }

  @action(constants.TAB_FOCUSED)
  handleTabFocused(payload) {
    logger.info("handleTabFocused:", { payload: payload });
    this.emit('change', this.getState());
  }

  @action(constants.CREATED_NAVIGATION_TARGET)
  handleCreatedNavigationTarget(payload) {
    logger.info("handleCreatedNavigationTarget:", { payload: payload });
    throw "NotImplementedError";
  }

  @action(constants.HISTORY_STATE_UPDATED)
  handleHistoryStateUpdated(payload) {
    logger.info("handleHistoryStateUpdated:", { payload: payload });
    this.emit('change', this.getState());
  }

  @action(constants.TAB_UPDATED)
  handleTabUpdated(payload) {
    logger.info("handleTabUpdated:", { payload: payload });
    this.emit('change', this.getState());
  }

  @action(constants.WEB_NAV_COMMITTED)
  handleWebNavCommitted(payload) {
    logger.info("handleWebNavCommitted:", { payload: payload });
    this.emit('change', this.getState());
  }

  @action(constants.TAB_CLOSED)
  handleTabClosed(payload) {
    logger.info("handleTabClosed:", { payload: payload });
    delete this.tabs[payload.tabId];
    this.emit('change', this.getState());
  }

  @action(constants.TAB_REPLACED)
  handleTabReplaced(payload) {
    logger.info("handleTabReplaced:", { payload: payload });
    this.tabs[payload.newTabId] = this.tabs[payload.oldTabId];
    delete this.tabs[payload.oldTabId];
  }

  // Create an assignment and first node in a single transaction, marking the
  // tab as recording on success
  @action(constants.START_RECORDING)
  handleStartRecording(payload) {
    logger.info("handleStartRecording:", { payload: payload });


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
        logger.info("handleStartRecording: success");
        this.tabs[payload.tabId] = true;
        this.flux.actions.startRecordingSuccess(payload.tabId);
        _.each(successCallbacks, function(cb) { cb(); });
        this.emit('change', this.getState());
      }.bind(this);

      tx.onerror = function (evt) {
        logger.info("handleStartRecording: error");
        this.tabs[payload.tabId] = false;
        this.flux.actions.startRecordingFail(payload.tabId);
      }.bind(this);
    }.bind(this)); //transaction
  }

  @action(constants.RESUME_RECORDING)
  handleResumeRecording(payload) {
    logger.info("handleResumeRecording");

    this.db.nodes.get(payload.localId).then(function(node) {
      if (payload.focus && node.tabId) {
        logger.info("handleResumeRecording: success");
        this.tabs[node.tabId] = true;
        this.emit('change', this.getState());
      } else {
        chrome.tabs.create({ url: node.url }, function(tab) {
          this.db.nodes.db.transaction("readwrite", ["nodes"], function(err, tx) {
            tx.oncomplete = function (evt) {
              logger.info("handleResumeRecording: success");
              this.tabs[tab.id] = true;
              this.emit('change', this.getState());
            }.bind(this);

            // Error handler
            tx.onerror = function (evt) {
              logger.info("handleResumeRecording: error");
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

  }

  @action(constants.STOP_RECORDING)
  handleStopRecording(payload) {
    logger.info("handleStopRecording:", { payload: payload });
    this.tabs[payload.tabId] = false;
    this.flux.actions.stopRecordingSuccess(payload.tabId);
    this.emit('change', this.getState());
  }

  @action(constants.DESTROY_ASSIGNMENT)
  handleDestroyAssignment(payload) {
    logger.info("handleDestroyAssignment", { payload: payload });
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
  }

  @deprecated
  @action(constants.REQUEST_TAB_STATE)
  handleRequestTabState(payload) {
    logger.info("handleRequestTabState:", { payload: payload });
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

};

export default TabStore;
