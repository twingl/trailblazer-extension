var constants = require('./constants');
var info = require('debug')('actions.js:info');

module.exports = {

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

  assignmentsSynchronized: function (assignments) {
    info('assignmentsSynchronized');
    chrome.runtime.sendMessage({ action: constants.ASSIGNMENTS_SYNCHRONIZED, payload: { assignments: assignments } });
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
  

  //UI ACTIONS. Dispatch is overwritten in UI and passes a message through runtime
  //which then calls the *same* method in background. [Mind Blown]
  selectAssignment: function (assignmentId) {
    info('selectAssignment');
    chrome.runtime.sendMessage({ action: constants.SELECT_ASSIGNMENT, payload: { assignmentId: assignmentId } });
  }
}
