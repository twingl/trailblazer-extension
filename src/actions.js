var constants = require('./constants');
var info = require('debug')('actions.js:info');

module.exports = {

  requestAssignments: function () {
    info('requestAssignments');
    chrome.runtime.sendMessage({ action: constants.REQUEST_ASSIGNMENTS });
  },

  fetchAssignments: function () {
    info('fetchAssignments');
    chrome.runtime.sendMessage({ action: constants.FETCH_ASSIGNMENTS });
  },

  fetchAssignmentsSuccess: function (assignments) {
    info('fetchAssignmentsSuccess');
    chrome.runtime.sendMessage({ action: constants.FETCH_ASSIGNMENTS_SUCCESS, payload: { assignments: assignments } });
  },

  fetchAssignmentsFail: function (error) {
    info('fetchAssignmentsFail');
    chrome.runtime.sendMessage({ action: constants.FETCH_ASSIGNMENTS_FAIL, payload: { error: error } });
  },

  updateAssignmentCache: function (assignments) {
    info('updateAssignmentCache');
    chrome.runtime.sendMessage({ action: constants.UPDATE_ASSIGNMENT_CACHE, payload: { assignments: assignments } });
  },

  updateAssignmentCacheSuccess: function () {
    info('updateAssignmentCacheSuccess');
    chrome.runtime.sendMessage({ action: constants.UPDATE_ASSIGNMENT_CACHE_SUCCESS });
  },

  updateAssignmentCacheFail: function (error) {
    info('updateAssignmentCacheFail', {error: error });
    chrome.runtime.sendMessage({ action: constants.UPDATE_ASSIGNMENT_CACHE_FAIL, payload: { error: error } });
  },

  updateAssignmentTitle: function (localId, title) {
    info('updateAssignmentTitle', { localId: localId, title: title });
    chrome.runtime.sendMessage({
      action: constants.UPDATE_ASSIGNMENT_TITLE,
      payload: {
        localId: localId,
        title: title
      }
    });
  },

  assignmentsSynchronized: function () {
    info('assignmentsSynchronized');
    chrome.runtime.sendMessage({ action: constants.ASSIGNMENTS_SYNCHRONIZED });
  },

  createAssignmentSuccess: function (assignment) {
    info('createAssignmentSuccess');
    chrome.runtime.sendMessage({
      action: constants.CREATE_ASSIGNMENT_SUCCESS,
      payload: {
        assignment: assignment
      }
    });
  },

  destroyAssignment: function (localId) {
    info('destroyAssignment');
    chrome.runtime.sendMessage({
      action: constants.DESTROY_ASSIGNMENT,
      payload: {
        localId: localId
      }
    });
  },

  fetchNodes: function () {
    info('fetchNodes');
    chrome.runtime.sendMessage({ action: constants.FETCH_NODES });
  },

  fetchNodesSuccess: function (nodes) {
    info('fetchNodesSuccess');
    chrome.runtime.sendMessage({ action: constants.FETCH_NODES_SUCCESS, payload: { nodes: nodes } });
  },

  fetchNodesFail: function (error) {
    info('fetchNodesFail');
    chrome.runtime.sendMessage({ action: constants.FETCH_NODES_FAIL, payload: { error: error } });
  },

  updateNodeCache: function (nodes, assignmentId) {
    info('updateNodeCache');
    chrome.runtime.sendMessage({
      action: constants.UPDATE_NODE_CACHE,
      payload: {
        nodes: nodes,
        assignmentId: assignmentId
      }
    });
  },

  updateNodeCacheSuccess: function () {
    info('updateNodeCacheSuccess');
    chrome.runtime.sendMessage({ action: constants.UPDATE_NODE_CACHE_SUCCESS });
  },

  updateNodeCacheFail: function (error) {
    info('updateNodeCacheFail');
    chrome.runtime.sendMessage({ action: constants.UPDATE_NODE_CACHE_FAIL, payload: { error: error } });
  },

  createNodeSuccess: function (node) {
    info('createNodeSuccess');
    chrome.runtime.sendMessage({
      action: constants.CREATE_NODE_SUCCESS,
      payload: {
        node: node
      }
    });
  },

  tabCreated: function(tabId, url, title, parentTabId, tabObj) {
    info('tabCreated');
    chrome.runtime.sendMessage({
      action: constants.TAB_CREATED,
      payload: {
        tabId: tabId,
        url: url,
        title: title,
        parentTabId: parentTabId,
        tabObj: tabObj
      }
    });
  },

  createdNavigationTarget: function(parentTabId, tabId, url, timestamp) {
    info('createdNavigationTarget');
    chrome.tabs.get(tabId, function(tabObj) {
      chrome.runtime.sendMessage({
        action: constants.CREATED_NAVIGATION_TARGET,
        payload: {
          parentTabId: parentTabId,
          tabId: tabId,
          url: url,
          timestamp: timestamp,
          tabObj: tabObj
        }
      });
    });
  },

  tabUpdated: function(tabId, url, title, tabObj) {
    info('tabUpdated');
    chrome.runtime.sendMessage({
      action: constants.TAB_UPDATED,
      payload: {
        tabId: tabId,
        url: url,
        title: title,
        tabObj: tabObj
      }
    });
  },

  historyStateUpdated: function(tabId, url, transitionType, transitionQualifiers, timestamp) {
    info('historyStateUpdated');
    chrome.tabs.get(tabId, function(tabObj) {
      chrome.runtime.sendMessage({
        action: constants.HISTORY_STATE_UPDATED,
        payload: {
          tabId: tabId,
          url: url,
          transitionType: transitionType,
          transitionQualifiers: transitionQualifiers,
          timestamp: timestamp,
          tabObj: tabObj
        }
      });
    });
  },

  webNavCommitted: function(tabId, url, transitionType, transitionQualifiers, timestamp) {
    info('webNavCommitted');
    chrome.tabs.get(tabId, function(tabObj) {
      chrome.runtime.sendMessage({
        action: constants.WEB_NAV_COMMITTED,
        payload: {
          tabId: tabId,
          url: url,
          transitionType: transitionType,
          transitionQualifiers: transitionQualifiers,
          timestamp: timestamp,
          tabObj: tabObj
        }
      });
    });
  },

  tabClosed: function(tabId) {
    info('tabClosed');
    chrome.runtime.sendMessage({ action: constants.TAB_CLOSED, payload: { tabId: tabId } });
  },

  tabReplaced: function(oldTabId, newTabId, timestamp) {
    info('tabReplaced');
    chrome.runtime.sendMessage({
      action: constants.TAB_REPLACED,
      payload: {
        oldTabId: oldTabId,
        newTabId: newTabId,
        timestamp: timestamp
      }
    });
  },

  //UI ACTIONS. Dispatch is overwritten in UI and passes a message through runtime
  //which then calls the *same* method in background. [Mind Blown]
  selectAssignment: function (assignmentId) {
    info('selectAssignment');
    chrome.runtime.sendMessage({ action: constants.SELECT_ASSIGNMENT, payload: { assignmentId: assignmentId } });
  },

  requestTabState: function (tabId) {
    info('requestTabState');
    chrome.runtime.sendMessage({
      action: constants.REQUEST_TAB_STATE,
      payload: {
        tabId: tabId
      }
    });
  },

  requestTabStateResponse: function (tabId, state) {
    info('requestTabStateResponse');
    chrome.runtime.sendMessage({
      action: constants.REQUEST_TAB_STATE_RESPONSE,
      payload: {
        tabId: tabId,
        state: state
      }
    });
  },

  startRecording: function (tabId, tabObj) {
    info('startRecording');
    chrome.runtime.sendMessage({
      action: constants.START_RECORDING,
      payload: {
        tabId: tabId,
        tabObj: tabObj
      }
    });
  },

  startRecordingSuccess: function (tabId) {
    info('startRecordingSuccess');
    chrome.runtime.sendMessage({
      action: constants.START_RECORDING_SUCCESS,
      payload: {
        tabId: tabId
      }
    });
  },

  startRecordingFail: function (tabId) {
    info('startRecordingFail');
    chrome.runtime.sendMessage({
      action: constants.START_RECORDING_FAIL,
      payload: {
        tabId: tabId
      }
    });
  },

  stopRecording: function (tabId) {
    info('stopRecording');
    chrome.runtime.sendMessage({
      action: constants.STOP_RECORDING,
      payload: {
        tabId: tabId
      }
    });
  },

  stopRecordingSuccess: function (tabId) {
    info('stopRecordingSuccess');
    chrome.runtime.sendMessage({
      action: constants.STOP_RECORDING_SUCCESS,
      payload: {
        tabId: tabId
      }
    });
  },

  rankNodeWaypoint: function (localId) {
    info('rankNodeWaypoint');
    chrome.runtime.sendMessage({
      action: constants.RANK_NODE_WAYPOINT,
      payload: {
        localId: localId
      }
    });
  },

  rankNodeNeutral: function (localId) {
    info('rankNodeNeutral');
    chrome.runtime.sendMessage({
      action: constants.RANK_NODE_NEUTRAL,
      payload: {
        localId: localId
      }
    });
  },

  signIn: function () {
    info('signIn');
    chrome.runtime.sendMessage({
      action: constants.SIGN_IN
    });
  },

  signOut: function () {
    info('signOut');
    chrome.runtime.sendMessage({
      action: constants.SIGN_OUT
    });
  }
}
