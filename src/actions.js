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
    info('updateAssignmentCacheFail');
    chrome.runtime.sendMessage({ action: constants.UPDATE_ASSIGNMENT_CACHE_FAIL, payload: { error: error } });
  },

  assignmentsSynchronized: function (assignments) {
    info('assignmentsSynchronized');
    chrome.runtime.sendMessage({ action: constants.ASSIGNMENTS_SYNCHRONIZED, payload: { assignments: assignments } });
  },

  loadNodes: function (assignmentId) {
    info('loadNodes');
    chrome.runtime.sendMessage({ action: constants.LOAD_NODES, payload: {assignmentId: assignmentId} });
  },

  loadNodesSuccess: function (nodes) {
    info('loadNodesSuccess');
    chrome.runtime.sendMessage({ action: constants.LOAD_NODES_SUCCESS, payload: { nodes: nodes } });
  },

  //UI ACTIONS. Dispatch is overwritten in UI and passes a message through runtime
  //which then calls the *same* method in background. [Mind Blown]
  selectAssignment: function (assignmentId) {
    info('selectAssignment');
    chrome.runtime.sendMessage({ action: constants.SELECT_ASSIGNMENT, payload: { assignmentId: assignmentId } });
  }
}
